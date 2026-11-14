import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, X, Headphones, Loader2 } from 'lucide-react';
import { uploadAudioToFirestoreChunks } from '../utils/firestoreAudioStorage';
import { CommunityAudioPlayer } from './CommunityAudioPlayer';

interface CommunityAudioComposerProps {
  audioUrl: string;
  audioDuration?: string;
  onChange: (url: string, duration?: string) => void;
  onToast: (msg: string) => void;
}

const formatDurationSec = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const CommunityAudioComposer: React.FC<CommunityAudioComposerProps> = ({
  audioUrl,
  audioDuration,
  onChange,
  onToast,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedSecondsRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopRecordingStream = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleStartRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onToast('المتصفح الحالي لا يدعم التسجيل المباشر؛ يمكنك رفع ملف صوتي جاهز بدلاً من ذلك');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      recordedSecondsRef.current = 0;
      setRecordingSeconds(0);

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = supportedType ? new MediaRecorder(stream, { mimeType: supportedType }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const elapsed = recordedSecondsRef.current;
        stopRecordingStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 500) {
          onToast('التسجيل الصوتي قصير جداً، يرجى المحاولة مرة أخرى');
          return;
        }
        setIsSaving(true);
        try {
          const result = await uploadAudioToFirestoreChunks(blob, `recitation-${Date.now()}.webm`);
          onChange(result.url, formatDurationSec(elapsed));
          onToast('✓ تم حفظ التسجيل الصوتي وإرفاقه بالمنشور بنجاح');
        } catch (err: any) {
          onToast(err?.message || 'تعذر حفظ التسجيل الصوتي');
        } finally {
          setIsSaving(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        recordedSecondsRef.current += 1;
        setRecordingSeconds(recordedSecondsRef.current);
      }, 1000);
    } catch {
      stopRecordingStream();
      onToast('يرجى السماح بالوصول إلى الميكروفون للتسجيل أو رفع ملف صوتي');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopRecordingStream();
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const result = await uploadAudioToFirestoreChunks(file, file.name);
      onChange(result.url);
      onToast('✓ تم رفع الملف الصوتي وإرفاقه بالمنشور بنجاح');
    } catch (err: any) {
      onToast(err?.message || 'تعذر رفع الملف الصوتي');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs" dir="rtl">
      <div className="flex items-center justify-between font-bold text-[#07243c]">
        <span className="flex items-center gap-1.5">
          <Headphones className="w-4 h-4 text-rose-600" />
          <span>إرفاق إلقاء صوتي بصوت الكاتب للقصيدة أو الخاطرة:</span>
        </span>
        {audioUrl && (
          <button
            type="button"
            onClick={() => onChange('', undefined)}
            className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>إزالة الصوت</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleStartRecording}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-xs"
          >
            <Mic className="w-4 h-4" />
            <span>تسجيل صوتي مباشر الآن</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopRecording}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition cursor-pointer shadow-xs"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span>إيقاف وحفظ ({formatDurationSec(recordingSeconds)})</span>
          </button>
        )}

        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold transition cursor-pointer">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#07243c]" /> : <Upload className="w-4 h-4 text-[#07243c]" />}
          <span>{isSaving ? 'جارٍ حفظ الصوت...' : 'أو اختيار ملف صوتي (MP3/M4A/WAV)'}</span>
          <input
            type="file"
            accept="audio/*"
            disabled={isSaving || isRecording}
            className="hidden"
            onChange={handleAudioFileUpload}
          />
        </label>
      </div>

      {audioUrl && (
        <div className="pt-1">
          <CommunityAudioPlayer
            rawAudioUrl={audioUrl}
            durationHint={audioDuration}
            title="معاينة الإلقاء الصوتي المرفق"
          />
        </div>
      )}
    </div>
  );
};
