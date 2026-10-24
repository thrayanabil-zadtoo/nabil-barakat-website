import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini client if API key is provided
const geminiApiKey = process.env.GEMINI_API_KEY;
const aiClient = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Ensure uploads directory exists
  const uploadDir = path.resolve(__dirname, 'public', 'uploads', 'videos');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure Multer for video disk storage
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
      const ext = path.extname(file.originalname) || '.mp4';
      cb(null, `video-${dateKey}-${uniqueSuffix}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 150 * 1024 * 1024, // 150 MB max video file size
    },
    fileFilter: (_req, file, cb) => {
      if (
        file.mimetype.startsWith('video/') ||
        file.originalname.match(/\.(mp4|webm|mov|ogg|m4v|avi|mkv)$/i)
      ) {
        cb(null, true);
      } else {
        cb(new Error('الملف ليس ملف فيديو مدعوم (MP4, WebM, MOV)'));
      }
    },
  });

  // Body parsing for JSON
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static uploads with proper video streaming headers
  app.use(
    '/uploads',
    express.static(path.resolve(__dirname, 'public', 'uploads'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.webm')) {
          res.setHeader('Content-Type', 'video/webm');
        }
        res.setHeader('Accept-Ranges', 'bytes');
      },
    })
  );

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // In-memory cache for synthesized audio to prevent duplicate API calls & rate limits
  const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();

  // Text-to-Speech API endpoint with strictly feminine voice (Aoede)
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voiceName = 'Aoede' } = req.body;
      const targetVoice = voiceName || 'Aoede';
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'النص المطلوب قراءته غير موجود' });
      }

      // Check cache first for instant playback without rate limit
      const sanitizedText = text.trim().slice(0, 1200);
      const cacheKey = `${targetVoice}_${sanitizedText}`;
      if (ttsAudioCache.has(cacheKey)) {
        const cached = ttsAudioCache.get(cacheKey)!;
        return res.json({
          success: true,
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType || 'audio/wav',
          voiceName: targetVoice,
          cached: true,
        });
      }

      if (!aiClient) {
        return res.status(503).json({
          success: false,
          fallbackToSpeechSynthesis: true,
          error: 'خدمة التحويل الصوتي المباشر غير مهيأة بمفتاح Gemini، سيتم استخدام القارئ الصوتي للمتصفح'
        });
      }

      let audioBase64: string | undefined;
      const modelsToTry = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

      for (const model of modelsToTry) {
        try {
          const response = await aiClient.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: sanitizedText,
                    speechMetadata: {
                      style: 'Natural, expressive, gentle Arabic female voice with clear and soothing tone',
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: targetVoice },
                },
              },
            },
          });

          audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioBase64) {
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[TTS] Model ${model} failed, trying next:`, modelErr?.message || modelErr);
        }
      }

      if (!audioBase64) {
        return res.status(500).json({
          success: false,
          fallbackToSpeechSynthesis: true,
          error: 'لم يتم استلام مقطع صوتي من النموذج'
        });
      }

      // Store in cache for future instant plays
      ttsAudioCache.set(cacheKey, { audioBase64, mimeType: 'audio/wav' });

      return res.json({
        success: true,
        audioBase64,
        mimeType: 'audio/wav',
        voiceName: targetVoice,
      });
    } catch (err: any) {
      console.error('[TTS API Error]:', err?.message || err);
      return res.status(500).json({
        success: false,
        fallbackToSpeechSynthesis: true,
        error: err?.message || 'فشل توليد الصوت'
      });
    }
  });

  // API endpoint: Video Upload with real file streaming and disk persistence
  app.post('/api/upload-video', upload.single('video'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'لم يتم استلام أي ملف فيديو' });
      }

      const relativeUrl = `/uploads/videos/${req.file.filename}`;
      const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(2);

      console.log(`[VideoUpload] Successfully saved video: ${req.file.filename} (${fileSizeMb} MB) -> ${relativeUrl}`);

      return res.json({
        success: true,
        url: relativeUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeMb: fileSizeMb,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[VideoUpload] Error processing upload:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ ملف الفيديو' });
    }
  });

  // Mount Vite in development or static dist in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer();
