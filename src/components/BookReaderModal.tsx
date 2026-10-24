import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../types';
import {
  X,
  BookOpen,
  List,
  MessageSquare,
  Star,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Image as ImageIcon,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Camera,
  Trash2,
  Plus,
  Edit3,
  FastForward,
  Rewind,
  Eye,
  Maximize2,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Share2,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Video,
  Film,
  User,
  Feather,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import { PageShareCardModal } from './PageShareCardModal';
import { AuthorSeal } from './AuthorSeal';
import { isVideoMedia } from '../utils/mediaUtils';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { saveReadingProgress, getDeviceInfo } from '../utils/deviceDetector';
import { compressImage } from '../utils/imageCompressor';
import { getSiteDomain } from '../config/siteDomain';
import { initialBooks } from '../data/initialData';

interface BookReaderModalProps {
  book: Book;
  onClose: () => void;
  initialPageIndex?: number;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({ book, onClose, initialPageIndex }) => {
  const { books, authorProfile, addBookComment, deleteBookComment, setBookCover, updateBook, deleteBookGalleryImage, addBookGalleryImage, showToast, isAuthorMode, photos, processAndUploadImage, processAndUploadVideo } = useApp();
  const [confirmDeleteBookCommentId, setConfirmDeleteBookCommentId] = useState<string | null>(null);
  
  // Track active book ID so user can switch books right inside reader
  const [activeBookId, setActiveBookId] = useState(book.id);

  // Always derive live book state from AppContext so page deletions/edits update INSTANTLY!
  const liveBook = books.find((b) => b.id === activeBookId) || books.find((b) => b.id === book.id) || book;
  const defaultBook = initialBooks.find((ib) => ib.id === liveBook.id);
  const samplePages = (liveBook.samplePages && liveBook.samplePages.length > 0)
    ? liveBook.samplePages
    : (defaultBook?.samplePages || []);
  const tableOfContents = (liveBook.tableOfContents && liveBook.tableOfContents.length > 0)
    ? liveBook.tableOfContents
    : (defaultBook?.tableOfContents || []);

  const activeBook: Book = {
    ...liveBook,
    samplePages,
    tableOfContents,
  };

  const { pauseMusic } = useMusic();
  const [activeTab, setActiveTab] = useState<'reader' | 'toc' | 'gallery' | 'reviews'>('reader');
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex ?? 0);

  // Inline Romantic Female Speech states for reading the current page
  const [isPageSpeaking, setIsPageSpeaking] = useState(false);
  const [isPagePaused, setIsPagePaused] = useState(false);
  const [isPageLoadingVoice, setIsPageLoadingVoice] = useState(false);
  const [pageSpeechRate, setPageSpeechRate] = useState<number>(0.88);
  const pageAudioRef = useRef<HTMLAudioElement | null>(null);
  const pageUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Preload and keep browser voices fresh for female speech selection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      };
    }
  }, []);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const readerTopRef = useRef<HTMLDivElement>(null);

  const scrollToReaderTop = (smooth = true) => {
    if (readerTopRef.current) {
      try {
        readerTopRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      } catch {
        // Fallback
      }
    }
    if (modalContainerRef.current) {
      try {
        modalContainerRef.current.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      } catch {
        modalContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Automatically scroll to the top of the reading section whenever the page or section changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (activeTab === 'reader') {
      const timer = setTimeout(() => {
        scrollToReaderTop(true);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [currentPageIndex]);

  useEffect(() => {
    if (activeTab === 'reader') {
      const timer = setTimeout(() => {
        scrollToReaderTop(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Completely stop any playing music upon entering the reader modal
  useEffect(() => {
    pauseMusic();
    return () => {
      stopPageAudio();
      pauseMusic();
    };
  }, []);

  // Stop audio speech when changing pages or changing books
  useEffect(() => {
    stopPageAudio();
  }, [currentPageIndex, activeBookId, activeTab]);

  const stopPageAudio = () => {
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current.currentTime = 0;
      pageAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPageSpeaking(false);
    setIsPagePaused(false);
    setIsPageLoadingVoice(false);
  };

  const handleTogglePageSpeech = async () => {
    if (isPageSpeaking) {
      if (!isPagePaused) {
        if (pageAudioRef.current) {
          pageAudioRef.current.pause();
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.pause();
        }
        setIsPagePaused(true);
      } else {
        if (pageAudioRef.current) {
          pageAudioRef.current.play();
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.resume();
        }
        setIsPagePaused(false);
      }
      return;
    }

    const curPage = samplePages[currentPageIndex] || samplePages[0];
    const textToRead = `${curPage?.title ? curPage.title + '.\n' : ''}${curPage?.content || activeBook.description || ''}`;
    if (!textToRead.trim()) {
      showToast('لا يوجد نص في هذه الصفحة للاستماع إليه');
      return;
    }

    setIsPageLoadingVoice(true);
    setIsPageSpeaking(true);
    setIsPagePaused(false);

    // 1. Primary: Server-side Gemini TTS with strictly feminine voice (Kore)
    try {
      const sanitizedChunk = textToRead.slice(0, 850);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sanitizedChunk,
          voiceName: 'Kore',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          pageAudioRef.current = audio;
          audio.playbackRate = pageSpeechRate >= 1.0 ? pageSpeechRate : 0.95;

          audio.onplay = () => {
            setIsPageLoadingVoice(false);
            setIsPageSpeaking(true);
            setIsPagePaused(false);
          };

          audio.onended = () => {
            stopPageAudio();
          };

          audio.onerror = () => {
            speakPageWithBrowser(textToRead);
          };

          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to client synthesis below
    }

    speakPageWithBrowser(textToRead);
  };

  const speakPageWithBrowser = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPageLoadingVoice(false);
      setIsPageSpeaking(false);
      showToast('المتصفح لا يدعم القراءة الصوتية');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    pageUtteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();

    // Helper to check and strictly filter out all male voices across all OS and browsers
    const isMale = (v: SpeechSynthesisVoice) => {
      const n = (v.name + ' ' + (v.lang || '')).toLowerCase();
      return (
        n.includes('male') ||
        n.includes('maged') ||
        n.includes('naayf') ||
        n.includes('tarik') ||
        n.includes('tariq') ||
        n.includes('shakir') ||
        n.includes('george') ||
        n.includes('david') ||
        n.includes('hamed') ||
        n.includes('salman') ||
        n.includes('bassam') ||
        n.includes('bilal') ||
        n.includes('faris') ||
        n.includes('ali') ||
        n.includes('youssef') ||
        n.includes('kareem') ||
        n.includes('omar') ||
        n.includes('zayd') ||
        n.includes('google عربي') ||
        n.includes('google arabic') ||
        n.includes('wavenet-b') ||
        n.includes('wavenet-c') ||
        n.includes('neural2-b') ||
        n.includes('neural2-c') ||
        n.includes('standard-b') ||
        n.includes('standard-c') ||
        n.includes('ar-xa-x-ard') ||
        n.includes('ar-xa-x-arc')
      );
    };

    // Helper to identify verified female voices
    const isFemale = (v: SpeechSynthesisVoice) => {
      const n = (v.name + ' ' + (v.lang || '')).toLowerCase();
      if (isMale(v)) return false;
      return (
        n.includes('female') ||
        n.includes('woman') ||
        n.includes('girl') ||
        n.includes('laila') ||
        n.includes('salma') ||
        n.includes('zeina') ||
        n.includes('maryam') ||
        n.includes('mariam') ||
        n.includes('hoda') ||
        n.includes('zariyah') ||
        n.includes('fatima') ||
        n.includes('fatimah') ||
        n.includes('nour') ||
        n.includes('noor') ||
        n.includes('samira') ||
        n.includes('sana') ||
        n.includes('rana') ||
        n.includes('amal') ||
        n.includes('yara') ||
        n.includes('amina') ||
        n.includes('wavenet-a') ||
        n.includes('wavenet-d') ||
        n.includes('neural2-a') ||
        n.includes('neural2-d') ||
        n.includes('standard-a') ||
        n.includes('standard-d') ||
        n.includes('ar-xa-x-are') ||
        n.includes('ar-xa-x-arz') ||
        n.includes('ar-xa-x-ara') ||
        v.name.includes('ليلى') ||
        v.name.includes('سلمى') ||
        v.name.includes('مريم') ||
        v.name.includes('هدى') ||
        v.name.includes('نور') ||
        v.name.includes('فاطمة') ||
        v.name.includes('أمينة') ||
        v.name.includes('سناء') ||
        v.name.includes('زينة') ||
        v.name.includes('رنا') ||
        v.name.includes('أمل') ||
        v.name.includes('يارا')
      );
    };

    const arabicVoices = voices.filter(
      (v) => v.lang.startsWith('ar') || v.lang.includes('AR')
    );

    // Prefer verified female Arabic voice
    const femaleArabicVoice = arabicVoices.find(isFemale);
    const anyFemaleVoice = femaleArabicVoice || voices.find(isFemale);

    if (femaleArabicVoice) {
      utterance.voice = femaleArabicVoice;
      utterance.pitch = 1.15;
    } else if (anyFemaleVoice) {
      utterance.voice = anyFemaleVoice;
      utterance.pitch = 1.25;
    } else {
      // NEVER assign a male voice to utterance.voice
      const nonMaleVoice = voices.find((v) => !isMale(v));
      if (nonMaleVoice) {
        utterance.voice = nonMaleVoice;
      }
      utterance.pitch = 1.4; // Soft feminine pitch register
    }

    utterance.lang = 'ar-SA';
    utterance.rate = pageSpeechRate >= 1.0 ? 0.95 : 0.88;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsPageLoadingVoice(false);
      setIsPageSpeaking(true);
      setIsPagePaused(false);
    };
    utterance.onend = () => {
      stopPageAudio();
    };
    utterance.onerror = () => {
      stopPageAudio();
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (initialPageIndex !== undefined && initialPageIndex >= 0) {
      setCurrentPageIndex(initialPageIndex);
    }
  }, [initialPageIndex]);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [enlargedPageImage, setEnlargedPageImage] = useState<string | null>(null);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<'edit' | 'new' | 'current' | null>(null);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageContent, setNewPageContent] = useState('');
  const [newPageNumber, setNewPageNumber] = useState(activeBook.pagesCount || 1);
  const [newPageImage, setNewPageImage] = useState('');

  // Reset page index when switching to a different book
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [activeBookId]);

  // Supervisor Quick Edit Page State
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [editPageTitle, setEditPageTitle] = useState('');
  const [editPageContent, setEditPageContent] = useState('');
  const [editPageNumber, setEditPageNumber] = useState(1);
  const [editPageImage, setEditPageImage] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoInputRef = useRef<HTMLInputElement>(null);
  const [galleryMediaFilter, setGalleryMediaFilter] = useState<'all' | 'images' | 'videos'>('all');
  const editPageImageInputRef = useRef<HTMLInputElement>(null);
  const newPageImageInputRef = useRef<HTMLInputElement>(null);

  // Reading customization
  const [readerFontSize, setReaderFontSize] = useState<number>(18);
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'white' | 'dark'>('sepia');

  const currentPage = samplePages[currentPageIndex];

  // Anti-copy, print interception & arrow keys page navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        showToast(`طباعة المحتوى محظورة لحماية حقوق النشر للكاتب نبيل بركات (${getSiteDomain()})`);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        showToast('النصوص محمية بحقوق الملكية الفكرية، يرجى استخدام زر "مشاركة الصفحة كبطاقة" للاقتباس المعتمد.');
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
      // Page flipping with arrow keys (Right: Previous, Left: Next in Arabic RTL)
      if (activeTab === 'reader' && !isEditingPage && !isAddingPage) {
        if (e.key === 'ArrowLeft') {
          setCurrentPageIndex((prev) => Math.min(samplePages.length - 1, prev + 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentPageIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast, activeTab, isEditingPage, isAddingPage, samplePages.length]);

  // Review form state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Auto-save reader progress & device tracking
  const devInfo = getDeviceInfo();
  useEffect(() => {
    if (currentPage && samplePages.length > 0) {
      saveReadingProgress(
        activeBook.id,
        activeBook.title,
        activeBook.coverImage,
        currentPageIndex,
        currentPage.pageNumber,
        currentPage.title,
        samplePages.length
      );
    }
  }, [currentPageIndex, activeBook.id, activeBook.title, activeBook.coverImage, currentPage, samplePages.length]);

  const handleJumpFromToc = (pageNumber: number) => {
    const exactIdx = samplePages.findIndex((p) => p.pageNumber === pageNumber);
    if (exactIdx >= 0) {
      setCurrentPageIndex(exactIdx);
    } else {
      let closestIdx = 0;
      let minDiff = Infinity;
      samplePages.forEach((p, idx) => {
        const diff = Math.abs(p.pageNumber - pageNumber);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      setCurrentPageIndex(closestIdx);
    }
    setActiveTab('reader');
    showToast(`انتقلت إلى صفحة ${pageNumber}`);
    setTimeout(() => {
      scrollToReaderTop(true);
    }, 50);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 900, 1200, 0.82);
      setBookCover(activeBook.id, dataUrl);
      showToast('تم تحديث صورة غلاف الكتاب بنجاح');
    } catch {
      showToast('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مجدداً');
    }
  };

  const handleDeleteCurrentPage = () => {
    if (!currentPage) return;
    const pageToDeleteTitle = currentPage.title;
    const updatedPages = samplePages.filter((_, idx) => idx !== currentPageIndex);
    updateBook(activeBook.id, { samplePages: updatedPages });

    if (currentPageIndex >= updatedPages.length) {
      setCurrentPageIndex(Math.max(0, updatedPages.length - 1));
    }
    showToast(`تم حذف صفحة "${pageToDeleteTitle}" بنجاح`);
  };

  const handleRemoveCurrentImage = () => {
    if (!currentPage) return;
    const updatedPages = samplePages.map((p, idx) =>
      idx === currentPageIndex ? { ...p, image: undefined } : p
    );
    updateBook(activeBook.id, { samplePages: updatedPages });
    showToast('تم إزالة الصورة من هذه الصفحة بنجاح');
  };

  const handleAddNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageContent.trim()) return;

    const newPage = {
      title: newPageTitle.trim(),
      content: newPageContent.trim(),
      pageNumber: Number(newPageNumber) || (samplePages.length > 0 ? samplePages[samplePages.length - 1].pageNumber + 1 : 1),
      image: newPageImage.trim() || undefined,
    };

    const updatedPages = [...samplePages, newPage];
    updateBook(activeBook.id, { samplePages: updatedPages });
    setCurrentPageIndex(updatedPages.length - 1);
    setIsAddingPage(false);
    setNewPageTitle('');
    setNewPageContent('');
    setNewPageImage('');
    showToast(`تمت إضافة صفحة "${newPage.title}" مباشرة إلى الكتاب بنجاح`);
  };

  const handleStartEditPage = () => {
    if (!currentPage) return;
    setEditPageTitle(currentPage.title);
    setEditPageContent(currentPage.content);
    setEditPageNumber(currentPage.pageNumber);
    setEditPageImage(currentPage.image || '');
    setIsEditingPage(true);
    setIsAddingPage(false);
  };

  const handleSaveEditedPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPageTitle.trim() || !editPageContent.trim()) return;

    const oldPageTitle = currentPage ? currentPage.title : '';
    const oldPageNum = currentPage ? currentPage.pageNumber : 0;
    const newPageNum = Number(editPageNumber) || oldPageNum;

    const updatedPages = samplePages.map((p, idx) => {
      if (idx === currentPageIndex) {
        return {
          ...p,
          title: editPageTitle.trim(),
          content: editPageContent.trim(),
          pageNumber: newPageNum,
          image: editPageImage.trim() || undefined,
        };
      }
      return p;
    });

    // Also update tableOfContents so chapter listings match edited title and page number
    let updatedToc = activeBook.tableOfContents || [];
    updatedToc = updatedToc.map((item) => {
      if (item.pageNumber === oldPageNum || item.chapter === oldPageTitle) {
        return {
          ...item,
          chapter: editPageTitle.trim(),
          pageNumber: newPageNum,
        };
      }
      return item;
    });

    updateBook(activeBook.id, { samplePages: updatedPages, tableOfContents: updatedToc });
    setIsEditingPage(false);
    showToast(`تم حفظ تعديلات صفحة "${editPageTitle}" بشكل دائم في قاعدة البيانات`);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewContent.trim()) return;

    setIsSubmittingReview(true);
    addBookComment(activeBook.id, {
      authorName: reviewerName.trim(),
      content: reviewContent.trim(),
      rating: reviewRating,
    });

    setReviewerName('');
    setReviewContent('');
    setIsSubmittingReview(false);
  };

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 w-screen h-screen min-h-screen z-[100] bg-[#f4f7f9] overflow-y-auto flex flex-col select-none print:hidden animate-in fade-in duration-200"
      onContextMenu={(e) => {
        e.preventDefault();
        showToast(`المحتوى محمي بحقوق الملكية الفكرية للأستاذ نبيل بركات (${getSiteDomain()})`);
      }}
      onCopy={(e) => {
        e.preventDefault();
        showToast('نسخ النصوص محمي بموجب حقوق النشر للأستاذ نبيل بركات.');
      }}
    >
      {/* Top Header Bar for Full Page Reader */}
      <header className="sticky top-0 z-40 bg-[#07243c] border-b border-[#051a2c] text-white px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer border border-white/15 shadow-2xs"
              title="العودة إلى مكتبة المؤلفات"
            >
              <ArrowRight className="w-4 h-4 text-[#dfa85b]" />
              <span>العودة للمكتبة</span>
            </button>

            <div className="h-6 w-px bg-white/20 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#dfa85b]" />
                <h1 className="text-sm sm:text-base font-bold font-literary truncate max-w-[200px] sm:max-w-md">
                  {activeBook.title}
                </h1>
              </div>
              <div className="text-[11px] text-slate-300 hidden sm:flex items-center gap-2">
                <span>{activeBook.genre}</span>
                <span aria-hidden="true">·</span>
                <span>دار النشر: {activeBook.publisher}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#dfa85b] font-mono font-bold">{getSiteDomain()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isPageSpeaking && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-bold animate-pulse">
                <Headphones className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">جاري الاستماع...</span>
                <span className="sm:hidden">استماع 🎧</span>
              </div>
            )}

            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>محتوى محمي © {getSiteDomain()}</span>
            </span>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              title="إغلاق القراءة والعودة للموقع"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* All Books Quick Switcher Strip (شريط التبديل السريع بين مؤلفات الكاتب) */}
      <div className="bg-[#051829] border-b border-[#082a47] px-4 sm:px-8 py-2 text-white sticky top-[57px] z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-amber-300 hidden md:inline">مؤلفات الكاتب:</span>
          </div>

          {/* Horizontal scroll of all books */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-thin">
            {books.map((b) => {
              const isCurrent = b.id === activeBook.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setActiveBookId(b.id);
                    setCurrentPageIndex(0);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                    isCurrent
                      ? 'bg-amber-400 text-[#07243c] border-amber-300 shadow-md font-black scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                  }`}
                  title={`الانتقال لتصفح وقراءة كتاب ${b.title}`}
                >
                  {b.coverImage ? (
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-5 h-7 object-cover rounded shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-7 rounded bg-white/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
                    </div>
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-[170px]">{b.title}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#07243c] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Close / Return to library button */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-rose-500/40"
            title="إغلاق القارئ والعودة إلى المكتبة الرئيسية"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">العودة للمكتبة</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="bg-white border-b border-[#e2e8f0] shadow-2xs sticky top-[103px] z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-2 px-4 sm:px-8 py-2.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reader'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>تصفح النماذج والصفحات</span>
            {samplePages.length > 0 && (
              <span className="text-[10px] font-mono opacity-90">({samplePages.length})</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('toc')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'toc'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>فهرس المحتويات الكامل</span>
            <span className="text-[10px] font-mono opacity-90">({tableOfContents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>معرض الصور واللوحات</span>
            <span className="text-[10px] font-mono opacity-90">
              ({(activeBook.galleryImages || []).filter((img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')).length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>مراجعات وآراء القراء</span>
            <span className="text-[10px] font-mono opacity-90">({(activeBook.comments || []).length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 max-w-[1550px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
          
          {/* Hidden inputs for uploading Cover and Gallery */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const uploadedUrl = await processAndUploadImage(file, {
                  maxWidth: 640,
                  maxHeight: 900,
                  quality: 0.72,
                  category: 'المؤلفات والكتب',
                  contextTitle: `معرض مؤلف: ${activeBook.title}`,
                  bookId: activeBook.id,
                });
                await addBookGalleryImage(activeBook.id, uploadedUrl);
              } catch (err: any) {
                showToast(err?.message || 'تعذر معالجة أو رفع الصورة');
              } finally {
                e.target.value = '';
              }
            }}
          />
          <input
            ref={galleryVideoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 150 * 1024 * 1024) {
                showToast('حجم الفيديو أكبر من 150 ميجابايت. يُرجى اختيار ملف فيديو أصغر.');
                return;
              }
              try {
                const videoUrl = await processAndUploadVideo(file, {
                  contextTitle: `فيديو كتاب: ${activeBook.title}`,
                  bookId: activeBook.id,
                });
                await addBookGalleryImage(activeBook.id, videoUrl);
                showToast('تمت إضافة الفيديو إلى معرض الكتاب وحفظه سحابياً');
              } catch (err: any) {
                showToast(err?.message || 'حدث خطأ أثناء رفع ملف الفيديو');
              } finally {
                e.target.value = '';
              }
            }}
          />
          
          {/* TAB 1: Reader View */}
          {activeTab === 'reader' && (
            <div className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
                
                {/* RIGHT SIDEBAR (Desktop/Laptop Only) - محتويات وسيرة الكاتب وتراخيص الرواية وفهرس الفصول */}
                <aside className="hidden lg:block lg:col-span-3 space-y-5 select-none">
                  
                  {/* بطاقة الكاتب الرسمية من الصفحة الرئيسية */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-100">
                        <img
                          src={authorProfile?.portraitImage || '/author.jpg'}
                          alt={authorProfile?.name || 'أ. نبيل بركات'}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-[#07243c]/85 text-[9px] text-[#f5cd72] font-bold text-center py-0.5">
                          المؤلف
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-[#07243c] font-literary truncate">
                          {authorProfile?.name || 'الكاتب أ. نبيل بركات'}
                        </h3>
                        <p className="text-[11px] font-bold text-amber-700 leading-tight mt-0.5">
                          عضو الجمعية المصرية لكتاب القصة والرواية
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          كاتب روائي وشاعر
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-amber-50 to-slate-50 rounded-2xl border border-amber-200/60 text-center">
                      <p className="text-xs font-literary text-[#07243c] font-bold">
                        « {authorProfile?.motto || 'حروفي مرآتي وصمتي قصيدة'} »
                      </p>
                    </div>

                    <div className="flex items-center justify-center pt-1">
                      <AuthorSeal size="sm" showText={true} />
                    </div>
                  </div>

                  {/* تراخيص الرواية الحالية والتوثيق القانوني */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-xs text-[#07243c]">
                        توثيق وتراخيص الرواية
                      </h4>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      {activeBook.depositNumber && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                          <div className="text-[10px] font-bold text-amber-800">رقم الإيداع القانوني:</div>
                          <div className="font-mono font-bold text-[#07243c] dir-ltr mt-0.5 text-xs">{activeBook.depositNumber}</div>
                        </div>
                      )}

                      {activeBook.isbn && (
                        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/70">
                          <div className="text-[10px] font-bold text-sky-800">الترقيم الدولي (ISBN):</div>
                          <div className="font-mono font-bold text-[#07243c] dir-ltr mt-0.5 text-xs">{activeBook.isbn}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-500 pt-1 text-[10px]">
                        <span>دار النشر: {activeBook.publisher || 'مؤسسة دار الهلال للنشر'}</span>
                        <span>سنة: {activeBook.publicationYear || '2025'}</span>
                      </div>
                    </div>
                  </div>

                  {/* فهرس فصول الرواية المباشر أثناء القراءة */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <List className="w-4 h-4 text-[#c4924c]" />
                        <h4 className="font-bold text-xs text-[#07243c]">فهرس الفصول السريع</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">({samplePages.length} فصول)</span>
                    </div>

                    <div className="space-y-1 pl-1">
                      {samplePages.map((page, idx) => {
                        const isActive = currentPageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCurrentPageIndex(idx);
                              scrollToReaderTop(true);
                            }}
                            className={`w-full text-right p-2 rounded-xl text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                              isActive
                                ? 'bg-[#07243c] text-[#f5cd72] font-bold shadow-xs'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{idx === 0 ? 'الغلاف والإهداء' : page.title}</span>
                            <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`}>
                              ص {page.pageNumber}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                {/* CENTER COLUMN: قراءة الرواية (Responsive: 100% on mobile, 6 cols on laptop) */}
                <div className="lg:col-span-6 space-y-6 max-w-2xl w-full mx-auto">
                  {/* Top scroll anchor for reading navigation */}
                  <div ref={readerTopRef} className="scroll-mt-28" />

              {/* Novel Title Banner Prominently at the Top of the Reading Page */}
              <div className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white p-5 sm:p-7 rounded-3xl shadow-lg border border-[#dfa85b]/40 text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-[#dfa85b]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#dfa85b]/20 border border-[#dfa85b]/40 text-[#f5cd72] text-xs font-bold shadow-xs">
                  <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>تصفح وقراءة الرواية</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#f5cd72] font-literary tracking-wide drop-shadow-md">
                  {activeBook.title}
                </h1>

                <p className="text-xs sm:text-sm text-sky-100 font-bold">
                  {activeBook.subtitle}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-300 pt-1 font-medium">
                  <span>بقلم: <strong className="text-white">الكاتب الروائي والشاعر أ. نبيل بركات</strong></span>
                  <span>·</span>
                  <span className="text-[#f5cd72]">عضو الجمعية المصرية لكتاب القصة والرواية</span>
                  {activeBook.publicationYear && (
                    <>
                      <span>·</span>
                      <span>سنة النشر: {activeBook.publicationYear}</span>
                    </>
                  )}
                </div>
              </div>

              {samplePages.length > 0 && currentPage ? (
                <div
                  key={`reader-page-${currentPageIndex}`}
                  className={`rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 transition duration-300 border relative animate-in fade-in duration-300 ${
                  readerTheme === 'sepia'
                    ? 'bg-[#fcf8f0] text-[#2c2217] border-[#e8ddcb]'
                    : readerTheme === 'dark'
                    ? 'bg-[#061828] text-[#e2e8f0] border-[#183957]'
                    : 'bg-white text-[#1e293b] border-[#cbd5e1]'
                }`}>
                  {/* Parchment Inner Spine Shadow & Page Gutter Depth */}
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black/15 via-black/5 to-transparent pointer-events-none rounded-r-2xl" />
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none rounded-l-2xl" />
                  <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-b from-[#dfa85b]/30 to-transparent pointer-events-none" />
                  
                  {/* Page Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#e2e8f0]/80 text-xs text-[#64748b]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Bookmark className="w-4 h-4 text-[#dfa85b]" />
                        <span className="font-bold text-[#0b385e] dark:text-amber-200 text-sm">{currentPage.title}</span>
                      </div>

                      {/* Bookmark Auto-saved indicator */}
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <span>موضع القراءة محفوظ تلقائياً</span>
                      </span>

                      {/* Reader Font & Theme Controls */}
                      <div className="flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setReaderTheme('sepia')}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                            readerTheme === 'sepia' ? 'bg-[#dfa85b] text-[#07243c] shadow-xs' : 'text-gray-500 hover:text-gray-800'
                          }`}
                          title="نمط الورق العتيق الدافئ"
                        >
                          ورق
                        </button>
                        <button
                          type="button"
                          onClick={() => setReaderTheme('white')}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                            readerTheme === 'white' ? 'bg-[#0b385e] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                          }`}
                          title="النمط الأبيض الصافي"
                        >
                          أبيض
                        </button>
                        <button
                          type="button"
                          onClick={() => setReaderTheme('dark')}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                            readerTheme === 'dark' ? 'bg-slate-700 text-amber-300 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                          }`}
                          title="النمط الليلي الأدبي"
                        >
                          ليلي
                        </button>
                        <span className="w-px h-3 bg-gray-300 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => setReaderFontSize((prev) => Math.max(14, prev - 2))}
                          className="px-1.5 py-0.5 hover:bg-black/10 rounded font-bold text-xs cursor-pointer"
                          title="تصغير حجم الخط"
                        >
                          A-
                        </button>
                        <span className="font-mono text-[10px] text-gray-500">{readerFontSize}</span>
                        <button
                          type="button"
                          onClick={() => setReaderFontSize((prev) => Math.min(26, prev + 2))}
                          className="px-1.5 py-0.5 hover:bg-black/10 rounded font-bold text-xs cursor-pointer"
                          title="تكبير حجم الخط"
                        >
                          A+
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct supervisor actions: Edit / Delete page directly without control panel */}
                      {isAuthorMode && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleStartEditPage}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="تعديل عنوان أو نص هذه الصفحة مباشرة دون الدخول للوحة التحكم"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>تعديل هذه الصفحة</span>
                          </button>

                          <button
                            onClick={handleDeleteCurrentPage}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="حذف هذه الصفحة مباشرة دون الدخول في لوحة التحكم"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>حذف هذه الصفحة</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsAddingPage(!isAddingPage);
                              setIsEditingPage(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="إضافة صفحة جديدة مباشرة للكتاب"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>إضافة صفحة</span>
                          </button>
                        </div>
                      )}

                      <div className="font-mono tabular-nums text-[#c4924c] font-bold">
                        الصفحة: {currentPage.pageNumber} من {activeBook.pagesCount}
                      </div>
                    </div>
                  </div>

                  {/* Supervisor Quick Edit Page Form */}
                  {isEditingPage && isAuthorMode && (
                    <form onSubmit={handleSaveEditedPage} className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-amber-700" />
                          <span>تعديل بيانات ومحتوى الصفحة رقم ({currentPage.pageNumber}) مباشرة:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPage(false)}
                          className="text-amber-800 hover:text-amber-950 font-bold text-xs"
                        >
                          ✕ إغلاق
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-amber-900 mb-1">عنوان الصفحة / الفصل</label>
                          <input
                            type="text"
                            required
                            value={editPageTitle}
                            onChange={(e) => setEditPageTitle(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg outline-none font-bold text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 mb-1">رقم الصفحة</label>
                          <input
                            type="number"
                            value={editPageNumber}
                            onChange={(e) => setEditPageNumber(Number(e.target.value))}
                            className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg outline-none font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">نص ومحتوى الصفحة</label>
                        <textarea
                          required
                          rows={6}
                          value={editPageContent}
                          onChange={(e) => setEditPageContent(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-amber-300 rounded-lg outline-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">صورة / لوحة توضيحية للصفحة (اختياري)</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="رابط الصورة أو مسارها..."
                            value={editPageImage}
                            onChange={(e) => setEditPageImage(e.target.value)}
                            className="flex-1 min-w-[180px] text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setGalleryPickerTarget('edit')}
                            className="px-2.5 py-1.5 bg-[#0b385e] hover:bg-[#07243c] text-white text-xs rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#dfa85b]" />
                            <span>اختيار من المعرض</span>
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            ref={editPageImageInputRef}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) setEditPageImage(ev.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => editPageImageInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>رفع صورة</span>
                          </button>
                          {editPageImage && (
                            <button
                              type="button"
                              onClick={() => setEditPageImage('')}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
                            >
                              إزالة
                            </button>
                          )}
                        </div>
                        {editPageImage && (
                          <div className="mt-2 flex items-center gap-2 p-1.5 bg-white/80 rounded-lg border border-amber-200 max-w-xs">
                            <img src={editPageImage} alt="معاينة" className="w-10 h-10 object-cover rounded" />
                            <span className="text-[10px] text-gray-700 truncate font-mono flex-1">{editPageImage}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingPage(false)}
                          className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm cursor-pointer"
                        >
                          حفظ التعديل فوراً
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Add Page Form for supervisor */}
                  {isAddingPage && isAuthorMode && (
                    <form onSubmit={handleAddNewPage} className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>إضافة صفحة / مقطع جديد للكتاب مباشرة دون الدخول للوحة التحكم</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            required
                            placeholder="عنوان الصفحة أو الفصل (مثال: ومضات الصبر)"
                            value={newPageTitle}
                            onChange={(e) => setNewPageTitle(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="رقم الصفحة"
                            value={newPageNumber}
                            onChange={(e) => setNewPageNumber(Number(e.target.value))}
                            className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                      <textarea
                        required
                        rows={4}
                        placeholder="اكتب أو الصق نص الصفحة أو الفصل هنا..."
                        value={newPageContent}
                        onChange={(e) => setNewPageContent(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg outline-none"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="رابط صورة توضيحية للصفحة إن وُجدت (اختياري)..."
                            value={newPageImage}
                            onChange={(e) => setNewPageImage(e.target.value)}
                            className="flex-1 min-w-[180px] text-xs px-3 py-1.5 bg-white border border-emerald-300 rounded-lg outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setGalleryPickerTarget('new')}
                            className="px-2.5 py-1.5 bg-[#0b385e] hover:bg-[#07243c] text-white text-xs rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#dfa85b]" />
                            <span>اختيار من المعرض</span>
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            ref={newPageImageInputRef}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) setNewPageImage(ev.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => newPageImageInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-emerald-200/80 hover:bg-emerald-300 text-emerald-900 text-xs rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>رفع صورة</span>
                          </button>
                          {newPageImage && (
                            <button
                              type="button"
                              onClick={() => setNewPageImage('')}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
                            >
                              إزالة
                            </button>
                          )}
                        </div>
                        {newPageImage && (
                          <div className="mt-2 flex items-center gap-2 p-1.5 bg-white/80 rounded-lg border border-emerald-200 max-w-xs">
                            <img src={newPageImage} alt="معاينة" className="w-10 h-10 object-cover rounded" />
                            <span className="text-[10px] text-gray-700 truncate font-mono flex-1">{newPageImage}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingPage(false)}
                          className="px-3 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                        >
                          حفظ وإضافة الصفحة الآن
                        </button>
                      </div>
                    </form>
                  )}

                  {/* QUICK JUMP BAR / شريط النقلات السريعة في العرض */}
                  <div className="p-3 bg-[#f1f5f9] rounded-xl border border-[#cbd5e1] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0b385e] whitespace-nowrap">
                          النقلات السريعة:
                        </span>
                        <select
                          value={currentPageIndex}
                          onChange={(e) => setCurrentPageIndex(Number(e.target.value))}
                          className="bg-white border border-[#94a3b8] text-[#0b385e] font-bold text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer max-w-[200px] sm:max-w-[260px] truncate shadow-2xs"
                        >
                          {samplePages.map((page, idx) => (
                            <option key={idx} value={idx}>
                              ص {page.pageNumber}: {page.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Rapid Step Buttons */}
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <button
                          onClick={() => setCurrentPageIndex(0)}
                          disabled={currentPageIndex === 0}
                          className="px-2 py-1 bg-white hover:bg-[#edf4fb] text-[#0b385e] border border-gray-300 rounded disabled:opacity-30 transition cursor-pointer"
                          title="الانتقال إلى بداية الكتاب"
                        >
                          البداية
                        </button>

                        <button
                          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 5))}
                          disabled={currentPageIndex === 0}
                          className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-[#edf4fb] text-[#0b385e] border border-gray-300 rounded disabled:opacity-30 transition cursor-pointer"
                          title="الرجوع 5 صفحات سريعة للخلف"
                        >
                          <Rewind className="w-3 h-3 text-[#c4924c]" />
                          <span>-5</span>
                        </button>

                        <button
                          onClick={() => setCurrentPageIndex((prev) => Math.min(samplePages.length - 1, prev + 5))}
                          disabled={currentPageIndex >= samplePages.length - 1}
                          className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-[#edf4fb] text-[#0b385e] border border-gray-300 rounded disabled:opacity-30 transition cursor-pointer"
                          title="التقدم 5 صفحات سريعة للأمام"
                        >
                          <span>+5</span>
                          <FastForward className="w-3 h-3 text-[#c4924c]" />
                        </button>

                        <button
                          onClick={() => setCurrentPageIndex(samplePages.length - 1)}
                          disabled={currentPageIndex === samplePages.length - 1}
                          className="px-2 py-1 bg-white hover:bg-[#edf4fb] text-[#0b385e] border border-gray-300 rounded disabled:opacity-30 transition cursor-pointer"
                          title="الانتقال إلى نهاية الكتاب"
                        >
                          النهاية
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Quick Page Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-[11px] scrollbar-thin">
                      {samplePages.map((page, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPageIndex(idx)}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer shrink-0 ${
                            currentPageIndex === idx
                              ? 'bg-[#0b385e] text-[#dfa85b] font-bold shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-slate-200'
                          }`}
                        >
                          ص {page.pageNumber}: {page.title.length > 22 ? page.title.substring(0, 20) + '...' : page.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* First Page (بداية الرواية): Novel Cover Image at the top, and Dedication below it */}
                  {currentPageIndex === 0 && (
                    <div className="space-y-6 pt-3 pb-6 border-b-2 border-dashed border-[#dfa85b]/50 dark:border-amber-400/30">
                      {/* Prominent Novel Cover in the Center */}
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative group max-w-[240px] sm:max-w-[280px] w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 ring-4 ring-[#dfa85b]/40 bg-slate-900 transition-all hover:scale-[1.02]">
                          <img
                            src={activeBook.coverImage}
                            alt={`غلاف رواية ${activeBook.title}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 inset-x-3 text-center">
                            <span className="inline-block px-3 py-1 rounded-xl bg-black/75 backdrop-blur-xs text-xs font-bold text-[#f5cd72] border border-[#dfa85b]/50 shadow-md">
                              غلاف الرواية الرسمي
                            </span>
                          </div>
                        </div>

                        <div className="text-center space-y-0.5">
                          <p className="text-base sm:text-lg font-bold text-[#07243c] dark:text-amber-200 font-literary">
                            {activeBook.title}
                          </p>
                          <p className="text-xs font-bold text-[#c4924c] dark:text-amber-300">
                            {activeBook.subtitle}
                          </p>
                          <p className="text-[11px] text-[#64748b] dark:text-slate-400 font-mono">
                            دار النشر: {activeBook.publisher || 'مؤسسة دار الهلال للنشر'} · {activeBook.publicationYear || '2025'}
                          </p>
                        </div>
                      </div>

                      {/* Dedication Header Ornament */}
                      <div className="flex items-center justify-center gap-3 text-amber-500 py-1">
                        <span className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-amber-400/70" />
                        <span className="font-literary text-sm sm:text-base font-bold text-[#07243c] dark:text-amber-200 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#dfa85b]" />
                          <span>إهداء الرواية</span>
                          <Sparkles className="w-4 h-4 text-[#dfa85b]" />
                        </span>
                        <span className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-amber-400/70" />
                      </div>
                    </div>
                  )}

                  {/* العنوان العريض والبارز لكل صفحة */}
                  <div className="pt-4 pb-3 text-center border-b border-[#e2e8f0] bg-gradient-to-b from-[#f1f5f9]/60 to-transparent rounded-t-xl px-4">
                    <div className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#c4924c] mb-1.5">
                      <span className="w-6 h-px bg-[#c4924c]/40" />
                      <span>{activeBook.title} · الصفحة {currentPage.pageNumber}</span>
                      <span className="w-6 h-px bg-[#c4924c]/40" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-literary text-[#07243c] leading-snug drop-shadow-2xs">
                      {currentPage.title}
                    </h2>
                    <div className="text-[#dfa85b] text-sm font-serif mt-1">✦ ✦ ✦</div>
                  </div>

                  {/* صورة الصفحة إن وجدت */}
                  {currentPage.image && currentPageIndex !== 0 ? (
                    <div className="my-5 flex flex-col items-center justify-center">
                      <div 
                        onClick={() => setEnlargedPageImage(currentPage.image!)}
                        className="max-w-md w-full rounded-2xl overflow-hidden shadow-sm border border-[#cbd5e1] bg-white p-3 cursor-pointer group hover:shadow-md transition"
                        title="اضغط لتكبير الصورة"
                      >
                        <img
                          src={currentPage.image}
                          alt={currentPage.title}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('/images/')) {
                              target.src = target.src.replace('/images/', '/src/assets/images/');
                            }
                          }}
                          className="w-full h-auto max-h-[380px] object-contain mx-auto rounded-xl group-hover:scale-[1.01] transition"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setEnlargedPageImage(currentPage.image!)}
                          className="text-[#64748b] hover:text-[#0b385e] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3 text-[#c4924c]" />
                          <span>اضغط لتكبير الصورة</span>
                        </button>

                        {isAuthorMode && (
                          <>
                            <span className="text-gray-300">·</span>
                            <button
                              type="button"
                              onClick={() => setGalleryPickerTarget('current')}
                              className="text-[#0b385e] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-[#dfa85b]" />
                              <span>تغيير الصورة من المعرض</span>
                            </button>
                            <span className="text-gray-300">·</span>
                            <button
                              type="button"
                              onClick={handleRemoveCurrentImage}
                              className="text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>إزالة الصورة</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    isAuthorMode && (
                      <div className="my-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setGalleryPickerTarget('current')}
                          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#07243c] border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#c4924c]" />
                          <span>+ إضافة صورة توضيحية لهذه الصفحة من المعرض أو رفعها</span>
                        </button>
                      </div>
                    )
                  )}

                  {/* شريط الاستماع الصوتي لمحتوى الصفحة */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 pb-3 mb-2 border-b border-[#e2e8f0]/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTogglePageSpeech}
                        disabled={isPageLoadingVoice}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs ${
                          isPageSpeaking && !isPagePaused
                            ? 'bg-amber-400 text-[#07243c] ring-2 ring-amber-300 font-black'
                            : 'bg-[#0b385e] hover:bg-[#07243c] text-white'
                        }`}
                        title="استماع لمحتوى هذه الصفحة"
                      >
                        {isPageLoadingVoice ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>جاري تحضير الصوت...</span>
                          </>
                        ) : isPageSpeaking ? (
                          isPagePaused ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-[#07243c]" />
                              <span>متابعة الاستماع</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current text-[#07243c]" />
                              <span>إيقاف مؤقت</span>
                            </>
                          )
                        ) : (
                          <>
                            <Headphones className="w-4 h-4 text-[#dfa85b]" />
                            <span>استمع لهذه الصفحة</span>
                          </>
                        )}
                      </button>

                      {isPageSpeaking && (
                        <button
                          type="button"
                          onClick={stopPageAudio}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="إيقاف الاستماع"
                        >
                          إيقاف ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {isPageSpeaking && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{isPagePaused ? 'موقف مؤقتاً' : 'جاري قراءة الصفحة...'}</span>
                          <div className="flex items-center gap-0.5 h-3 px-1">
                            {[5, 12, 16, 8, 14].map((h, i) => (
                              <span
                                key={i}
                                style={{ height: `${h}px` }}
                                className={`w-0.5 rounded-full ${isPagePaused ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <span>السرعة:</span>
                        {[
                          { rate: 0.88, label: 'هادئ' },
                          { rate: 1.0, label: 'طبيعي' },
                        ].map((s) => (
                          <button
                            key={s.rate}
                            type="button"
                            onClick={() => {
                              setPageSpeechRate(s.rate);
                              if (isPageSpeaking) {
                                stopPageAudio();
                                setTimeout(() => handleTogglePageSpeech(), 100);
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              Math.abs(pageSpeechRate - s.rate) < 0.08
                                ? 'bg-[#dfa85b] text-[#07243c]'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Page Text */}
                  <div
                    style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.85 }}
                    className={`relative z-10 font-literary text-justify indent-6 whitespace-pre-line select-none transition-colors ${
                      readerTheme === 'dark' ? 'text-slate-200' : readerTheme === 'sepia' ? 'text-[#2a221a]' : 'text-[#1e293b]'
                    }`}
                  >
                    {currentPage.content}
                  </div>

                  {/* Share Page as Quote Card Button & Copyright Notice */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-[#e2e8f0] bg-gradient-to-r from-amber-50/70 to-slate-50 p-4 rounded-xl border border-amber-200/50 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs text-[#0b385e] font-bold">
                        <Sparkles className="w-4 h-4 text-[#dfa85b]" />
                        <span>مشاركة هذا المقطع ببطاقة مصممة:</span>
                      </div>
                      <p className="text-[11px] text-[#64748b]">
                        بطاقة أدبية راقية تحفظ حقوق الكاتب أ. نبيل بركات والرابط المعتمد {getSiteDomain()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsShareCardOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#0b385e] to-[#07243c] hover:from-[#082a47] hover:to-[#051a2c] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer border border-[#dfa85b]/40"
                      title="إنشاء بطاقة صورة راقية لهذا المقطع الأدبي لمشاركتها عبر واتساب ومنصات التواصل"
                    >
                      <Share2 className="w-4 h-4 text-[#dfa85b]" />
                      <span>مشاركة هذه الصفحة كبطاقة صورة مصممة</span>
                    </button>
                  </div>

                  {/* Author Official Literary Seal */}
                  <div className="relative z-10 flex items-center justify-center pt-2 pb-1">
                    <AuthorSeal size="sm" showText={true} />
                  </div>

                  {/* Legal Deposit & International ISBN Footnote at the bottom of every page */}
                  <div className="relative z-10 pt-3 pb-1 border-t border-dashed border-[#cbd5e1]/70 dark:border-slate-700/60 text-center select-none">
                    <div className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-[#64748b] dark:text-slate-400 font-medium">
                      <span className="font-semibold text-[#0b385e] dark:text-amber-200">
                        جميع الحقوق محفوظة للمؤلف والروائي أ. نبيل بركات © {activeBook.publicationYear || '2025'}
                      </span>
                      <span className="hidden sm:inline text-gray-300 dark:text-slate-600">·</span>
                      {activeBook.depositNumber && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <span className="text-[#c4924c] font-bold">رقم الإيداع:</span>
                          <span className="dir-ltr text-[#0b385e] dark:text-amber-100 font-semibold">{activeBook.depositNumber}</span>
                        </span>
                      )}
                      <span className="hidden sm:inline text-gray-300 dark:text-slate-600">·</span>
                      {activeBook.isbn && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <span className="text-[#c4924c] font-bold">الترقيم الدولي (ISBN):</span>
                          <span className="dir-ltr text-[#0b385e] dark:text-amber-100 font-semibold">{activeBook.isbn}</span>
                        </span>
                      )}
                      <span className="hidden md:inline text-gray-300 dark:text-slate-600">·</span>
                      <span className="text-[10px] sm:text-[11px] text-[#8292a4]">عضو الجمعية المصرية لكتاب القصة والرواية</span>
                    </div>
                  </div>

                  {/* Page Navigation */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#e2e8f0]">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPageIndex > 0) {
                          const prevIdx = currentPageIndex - 1;
                          setCurrentPageIndex(prevIdx);
                          scrollToReaderTop(true);
                          const p = samplePages[prevIdx];
                          if (p) showToast(`انتقلت إلى: ${p.title} (ص ${p.pageNumber})`);
                        }
                      }}
                      disabled={currentPageIndex === 0}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#edf4fb] text-[#0b385e] hover:bg-[#d9e8f6] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs border border-[#cbd5e1]"
                      title={currentPageIndex > 0 ? `المقطع السابق: ${samplePages[currentPageIndex - 1]?.title}` : ''}
                    >
                      <ChevronRight className="w-4 h-4 text-[#c4924c]" />
                      <span>المقطع السابق</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => scrollToReaderTop(true)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#0b385e] bg-white hover:bg-slate-100 border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="الرجوع إلى أعلى المقطع"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-[#c4924c]" />
                        <span>لأعلى الصفحة</span>
                      </button>

                      <span className="text-xs text-[#64748b] font-mono tabular-nums font-bold px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        {currentPageIndex + 1} / {samplePages.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentPageIndex < samplePages.length - 1) {
                          const nextIdx = currentPageIndex + 1;
                          setCurrentPageIndex(nextIdx);
                          scrollToReaderTop(true);
                          const p = samplePages[nextIdx];
                          if (p) showToast(`انتقلت إلى: ${p.title} (ص ${p.pageNumber})`);
                        }
                      }}
                      disabled={currentPageIndex === samplePages.length - 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0b385e] text-[#dfa85b] hover:bg-[#07243c] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs border border-[#dfa85b]/40"
                      title={currentPageIndex < samplePages.length - 1 ? `المقطع التالي: ${samplePages[currentPageIndex + 1]?.title}` : ''}
                    >
                      <span>المقطع التالي</span>
                      <ChevronLeft className="w-4 h-4 text-[#dfa85b]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#64748b]">
                  لا توجد عينات نصوص مضافة لهذا الكتاب حالياً.
                </div>
              )}
            </div>

            {/* LEFT SIDEBAR (Desktop/Laptop Only) - بقية مؤلفات الكاتب، ومضات أدبية، مشاركة وتواصل */}
            <aside className="hidden lg:block lg:col-span-3 space-y-5 select-none">
              
              {/* مؤلفات وروايات الكاتب الأخرى من الصفحة الرئيسية */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#c4924c]" />
                    <h4 className="font-bold text-xs text-[#07243c]">مؤلفات وروايات الكاتب</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">({books.length})</span>
                </div>

                <div className="space-y-2.5">
                  {books.map((b) => {
                    const isCurrent = b.id === activeBook.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setActiveBookId(b.id);
                          setCurrentPageIndex(0);
                          scrollToReaderTop(true);
                        }}
                        className={`p-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer group ${
                          isCurrent
                            ? 'bg-amber-50/90 border-amber-300 shadow-xs ring-2 ring-amber-300/40'
                            : 'hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="w-10 h-14 object-cover rounded-lg shadow-xs shrink-0 group-hover:scale-105 transition-transform bg-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className={`font-bold text-xs truncate ${isCurrent ? 'text-amber-900' : 'text-[#07243c]'}`}>
                            {b.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {b.subtitle}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400">
                            <span>{b.pagesCount} صفحة</span>
                            <span>·</span>
                            <span className="text-[#c4924c] font-bold">{isCurrent ? 'الرواية المعروضة' : 'اضغط للتصفح'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ومضة أدبية من قلم الكاتب */}
              <div className="bg-gradient-to-br from-[#07243c] to-[#0b385e] text-white rounded-3xl p-5 border border-[#dfa85b]/40 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#dfa85b]/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 text-xs font-bold text-[#f5cd72]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ومضة من صومعة الكاتب</span>
                </div>
                <p className="text-xs font-literary leading-relaxed text-slate-200">
                  « الكتابة ليست مجرد حروف تُسكب على الورق، بل هي نبض روح، وعمر يُهدى لمن يبحث عن النور بين ظلال الحكاية. »
                </p>
                <div className="text-left text-[10px] text-[#f5cd72] font-bold">
                  — أ. نبيل بركات
                </div>
              </div>

              {/* أدوات سريعة وتواصل مباشر */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsShareCardOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-[#07243c] hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#c4924c]" />
                  <span>مشاركة المقطع كبطاقة أدبية</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة للمكتبة والموقع</span>
                </button>
              </div>

            </aside>

          </div>
        </div>
      )}

          {/* TAB 2: Table of Contents */}
          {activeTab === 'toc' && (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="text-xs text-[#64748b] mb-2 font-medium">
                فهرس فصول وأبواب كتاب <span className="text-[#0b385e] font-bold">{activeBook.title}</span> (إجمالي {activeBook.pagesCount} صفحة):
              </div>
              <div className="divide-y divide-[#e2e8f0] bg-white border border-[#cbd5e1] rounded-xl overflow-hidden shadow-sm">
                {tableOfContents.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleJumpFromToc(item.pageNumber)}
                    className="p-4 flex items-start justify-between gap-4 hover:bg-[#edf4fb] transition cursor-pointer group"
                    title="اضغط للانتقال وقراءة هذا الفصل مباشرة"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#0b385e] group-hover:text-[#dfa85b] transition">
                        {item.chapter}
                      </div>
                      {item.summary && (
                        <p className="text-xs text-[#64748b]">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-700 font-bold hidden sm:inline group-hover:underline">
                        قراءة هذا الفصل ←
                      </span>
                      <div className="font-mono text-xs text-[#0b385e] group-hover:bg-[#0b385e] group-hover:text-white transition font-bold tabular-nums whitespace-nowrap bg-[#edf4fb] px-2.5 py-1 rounded">
                        ص {item.pageNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Multiple Images & Videos Gallery */}
          {activeTab === 'gallery' && (() => {
            const validGallery = (activeBook.galleryImages || [])
              .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
              .filter(
                (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
              );
            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
                  <div className="text-xs text-[#64748b]">
                    الصور واللوحات ومقاطع الفيديو التوثيقية المرفقة بكتاب <span className="text-[#0b385e] font-bold">{activeBook.title}</span> ({validGallery.length} وسائط):
                  </div>

                  {isAuthorMode && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>+ إضافة صورة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => galleryVideoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#0b385e] hover:bg-[#07243c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5 text-[#dfa85b]" />
                        <span>+ رفع فيديو (MP4/WebM)</span>
                      </button>
                    </div>
                  )}
                </div>

                {validGallery.length === 0 ? (
                  <div className="p-8 text-center bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-2xl space-y-3">
                    <div className="flex items-center justify-center gap-2 text-[#94a3b8]">
                      <ImageIcon className="w-7 h-7" />
                      <Film className="w-7 h-7" />
                    </div>
                    <p className="text-xs text-[#64748b]">
                      لا توجد صور أو فيديوهات إضافية في ألبوم هذا الكتاب حالياً.
                    </p>
                    {isAuthorMode && (
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="text-xs text-[#c4924c] font-bold hover:underline cursor-pointer"
                        >
                          + إضافة صورة
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => galleryVideoInputRef.current?.click()}
                          className="text-xs text-[#0b385e] font-bold hover:underline cursor-pointer"
                        >
                          + رفع مقطع فيديو
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {validGallery.map((mediaUrl, idx) => {
                      const isVid = isVideoMedia(mediaUrl);

                      return (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#cbd5e1] bg-slate-100 shadow-sm flex flex-col">
                          <div
                            className="relative aspect-[4/3] overflow-hidden cursor-pointer group/img bg-black flex items-center justify-center"
                            onClick={() => setEnlargedImageIndex(idx)}
                            title={isVid ? 'اضغط لتشغيل وتكبير الفيديو' : 'اضغط لتكبير الصورة'}
                          >
                            {isVid ? (
                              <>
                                <SmartVideoPlayer
                                  rawSrc={mediaUrl}
                                  playsInline
                                  muted
                                  preload="metadata"
                                  className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg group-hover/img:scale-110 transition">
                                    <Play className="w-6 h-6 fill-current ml-0.5" />
                                  </div>
                                </div>
                                <span className="absolute top-2.5 right-2.5 bg-black/80 text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded shadow">
                                  ▶ فيديو مرئي
                                </span>
                              </>
                            ) : (
                              <>
                                <img
                                  src={mediaUrl}
                                  alt={`${activeBook.title} - صورة ${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                                  <span className="px-3 py-1.5 bg-white/95 text-[#07243c] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>تكبير الصورة</span>
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Supervisor Only Admin Controls */}
                          {isAuthorMode && (
                            <div className="p-2 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between gap-1.5">
                              {!isVid ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookCover(activeBook.id, mediaUrl);
                                    showToast('تم تعيين هذه الصورة كغلاف أساسي للكتاب بنجاح!');
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#07243c] border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="اعتماد هذه الصورة كغلاف أساسي للكتاب"
                                >
                                  <Star className="w-3.5 h-3.5 text-[#c4924c] fill-[#c4924c]" />
                                  <span>تعيين كغلاف</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-bold px-1">
                                  فيديو المعرض
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  deleteBookGalleryImage(activeBook.id, idx);
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="حذف هذا العنصر من المعرض"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: Reader Reviews & Comments */}
          {activeTab === 'reviews' && (
            <div className="max-w-2xl mx-auto space-y-8">
              
              {/* Reviews List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#0b385e] flex items-center justify-between">
                  <span>آراء وانطباعات القراء ({(activeBook.comments || []).length})</span>
                </h3>

                {(activeBook.comments || []).length === 0 ? (
                  <p className="text-xs text-[#64748b] py-4 text-center">
                    كن أول من يكتب مراجعة لهذا الكتاب.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(activeBook.comments || []).map((comment) => (
                      <div key={comment.id} className="p-4 rounded-xl bg-white border border-[#d6e0ea] shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0b385e]">{comment.authorName}</span>
                            <span className="text-[11px] text-[#94a3b8] font-mono tabular-nums">· {comment.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < comment.rating ? 'fill-[#dfa85b] text-[#dfa85b]' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed">
                          {comment.content}
                        </p>

                        {isAuthorMode && (
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            {confirmDeleteBookCommentId === comment.id ? (
                              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                                <span className="text-[10px] text-rose-700 font-bold">تأكيد حذف المراجعة؟</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteBookComment(activeBook.id, comment.id);
                                    setConfirmDeleteBookCommentId(null);
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  احذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteBookCommentId(null)}
                                  className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteBookCommentId(comment.id)}
                                className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>حذف المراجعة</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleReviewSubmit} className="p-5 rounded-xl bg-[#f8fafc] border border-[#d6e0ea] space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#0b385e]">
                    أضف مراجعتك أو تعليقك حول الكتاب
                  </h4>
                  <p className="text-[11px] text-[#64748b]">
                    يسعد الكاتب أ. نبيل بركات بالاطلاع على ملاحظاتكم وقراءاتكم النقدية.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-700 font-semibold mb-1">اسمك الكريم</label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="مثال: د. عبد الله السالم"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white outline-none focus:border-[#0b385e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-700 font-semibold mb-1">تقييمك</label>
                    <div className="flex items-center gap-1.5 py-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating ? 'fill-[#dfa85b] text-[#dfa85b]' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono text-[#0b385e] font-bold mr-2">({reviewRating} من 5)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-700 font-semibold mb-1">نص المراجعة</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="اكتب هنا انطباعك أو رسالتك للكاتب..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white outline-none focus:border-[#0b385e] resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-lg transition"
                  >
                    نشر المراجعة
                  </button>
                </div>
              </form>

            </div>
          )}

        </main>

      {/* Enlarged Gallery Image Lightbox inside BookReaderModal */}
      {enlargedImageIndex !== null && (() => {
        const validGallery = (activeBook.galleryImages || [])
          .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
          .filter(
            (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
          );
        const currentImg = validGallery[enlargedImageIndex];
        if (!currentImg) return null;

        const prevIdx = (enlargedImageIndex - 1 + validGallery.length) % validGallery.length;
        const nextIdx = (enlargedImageIndex + 1) % validGallery.length;

        return (
          <div className="fixed inset-0 z-60 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-[#07243c] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#051a2c] border-b border-white/10 text-white">
                <div className="flex items-center gap-2.5">
                  {isVideoMedia(currentImg) ? (
                    <Video className="w-5 h-5 text-[#dfa85b]" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[#dfa85b]" />
                  )}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-literary">
                      {activeBook.title}
                    </h3>
                    <div className="text-[11px] text-slate-300">
                      {isVideoMedia(currentImg) ? 'فيديو من المعرض' : 'صورة من المعرض'} · عنصر {enlargedImageIndex + 1} من {validGallery.length}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEnlargedImageIndex(null)}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media View (Video or Image) */}
              <div className="relative flex-1 bg-black flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[350px]">
                {isVideoMedia(currentImg) ? (
                  <SmartVideoPlayer
                    rawSrc={currentImg}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-2xl bg-black"
                  />
                ) : (
                  <img
                    src={currentImg}
                    alt={`${activeBook.title} - ${enlargedImageIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  />
                )}

                {validGallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEnlargedImageIndex(prevIdx)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20 shadow-lg cursor-pointer"
                      title="السابق"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnlargedImageIndex(nextIdx)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20 shadow-lg cursor-pointer"
                      title="التالي"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-[#051a2c] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                {isAuthorMode && !isVideoMedia(currentImg) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookCover(activeBook.id, currentImg);
                      showToast(`تم تعيين هذه الصورة بنجاح كغلاف أساسي لكتاب "${activeBook.title}"!`);
                    }}
                    className="px-4 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>تعيين هذه الصورة كغلاف أساسي للكتاب ★</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {isAuthorMode && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteBookGalleryImage(activeBook.id, enlargedImageIndex);
                        setEnlargedImageIndex(null);
                      }}
                      className="px-3 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف من المعرض</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setEnlargedImageIndex(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer font-medium"
                  >
                    إغلاق
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Page Share Card Modal (Quote Card with Author Name & siteDomain) */}
      {isShareCardOpen && currentPage && (
        <PageShareCardModal
          bookTitle={activeBook.title}
          pageTitle={currentPage.title}
          pageNumber={currentPage.pageNumber}
          pageContent={currentPage.content}
          pageImage={currentPage.image}
          onClose={() => setIsShareCardOpen(false)}
        />
      )}

      {/* Enlarged Page Image Lightbox */}
      {enlargedPageImage && (
        <div className="fixed inset-0 z-60 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#07243c] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#051a2c] border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#dfa85b]" />
                <h3 className="text-sm font-bold font-literary">
                  صورة صفحة: {currentPage?.title} (صفحة {currentPage?.pageNumber})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedPageImage(null)}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative flex-1 bg-black flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[350px]">
              <img
                src={enlargedPageImage}
                alt="معاينة الصورة"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            <div className="p-3.5 bg-[#051a2c] border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setEnlargedPageImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer font-medium text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Image Picker Modal for Pages */}
      {galleryPickerTarget && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#07243c] border border-amber-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#051a2c] border-b border-white/10">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#dfa85b]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-literary">
                  اختيار صورة لصفحة الكتاب من المعرض
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGalleryPickerTarget(null)}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Picker Content Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                اضغط على أي صورة من اللوحات والمشاهد التوثيقية أدناه لتعيينها كصورة توضيحية لصفحة الكتاب:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {[
                  ...(activeBook.galleryImages || []).filter(
                    (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
                  ),
                  '/src/assets/images/broken_heart_art_1790583363158.jpg',
                  '/src/assets/images/heart_padlock_art_1790583394604.jpg',
                  '/src/assets/images/coffee_morning_art_1790583344356.jpg',
                  '/src/assets/images/two_silhouettes_art_1790583380464.jpg',
                  '/src/assets/images/book_cover_heritage_1790501223547.jpg',
                  '/src/assets/images/book_cover_whispers_1790501236880.jpg',
                  '/author.jpg',
                  ...photos.map((p) => p.imageUrl),
                ]
                  .filter((img, idx, arr) => arr.indexOf(img) === idx && img)
                  .map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (galleryPickerTarget === 'edit') {
                          setEditPageImage(imgUrl);
                        } else if (galleryPickerTarget === 'new') {
                          setNewPageImage(imgUrl);
                        } else if (galleryPickerTarget === 'current') {
                          const updatedPages = samplePages.map((p, idx) =>
                            idx === currentPageIndex ? { ...p, image: imgUrl } : p
                          );
                          updateBook(activeBook.id, { samplePages: updatedPages });
                          showToast('تم تعيين صورة هذه الصفحة بنجاح!');
                        }
                        setGalleryPickerTarget(null);
                      }}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-white/20 hover:border-[#dfa85b] cursor-pointer shadow-sm hover:shadow-lg transition transform hover:scale-[1.02] bg-slate-900"
                    >
                      <img
                        src={imgUrl}
                        alt={`خيار ${i + 1}`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-[#dfa85b] text-[#07243c] font-black text-xs rounded-lg shadow">
                          اختيار هذه الصورة
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-3.5 bg-[#051a2c] border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-slate-400">يمكنك أيضاً رفع صورة جديدة من جهازك عبر زر "رفع صورة" في النموذج.</span>
              <button
                type="button"
                onClick={() => setGalleryPickerTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Return & Switcher Banner */}
      <footer className="mt-auto bg-[#07243c] border-t border-[#0b385e] text-slate-300 py-3 px-4 sm:px-8 text-xs select-none">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>
              أنت تتصفح حالياً: <strong className="text-white font-literary">{activeBook.title}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              <span>إغلاق القراءة والعودة لكافة أقسام الموقع</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
