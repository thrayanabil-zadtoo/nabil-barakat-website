import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthorProfile,
  Book,
  BookComment,
  LinkItem,
  NewsItem,
  PhotoItem,
  VideoItem,
  VisitorComment,
  VisitorMessage,
  AnnouncementItem,
} from '../types';
import {
  initialAuthorProfile,
  initialBooks,
  initialComments,
  initialLinks,
  initialMessages,
  initialNews,
  initialPhotos,
  initialVideos,
  initialAnnouncements,
} from '../data/initialData';
import { safeSetItem, cleanupLegacyStorage, loadFromIndexedDB } from '../utils/storageManager';
import { compressImage } from '../utils/imageCompressor';
import { isVideoMedia } from '../utils/mediaUtils';

interface AppContextType {
  authorProfile: AuthorProfile;
  updateAuthorProfile: (profile: Partial<AuthorProfile>) => void;

  books: Book[];
  addBook: (book: Omit<Book, 'id' | 'comments'>) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  setBookPdf: (bookId: string, pdfUrl: string, pdfFileName?: string) => void;
  setBookCover: (bookId: string, coverImage: string) => void;
  deleteBookGalleryImage: (bookId: string, imageIndex: number) => void;
  addBookGalleryImage: (bookId: string, imageUrl: string) => void;
  addBookComment: (bookId: string, comment: Omit<BookComment, 'id' | 'date'>) => void;
  deleteBookComment: (bookId: string, commentId: string) => void;
  togglePinBook: (id: string) => void;
  moveBookOrder: (id: string, direction: 'up' | 'down') => void;
  setBookPosition: (id: string, newPosition: number) => void;

  videos: VideoItem[];
  addVideo: (video: Omit<VideoItem, 'id' | 'date'>) => void;
  updateVideo: (id: string, video: Partial<VideoItem>) => void;
  deleteVideo: (id: string) => void;
  togglePinVideo: (id: string) => void;
  moveVideoOrder: (id: string, direction: 'up' | 'down') => void;
  setVideoPosition: (id: string, newPosition: number) => void;

  photos: PhotoItem[];
  addPhoto: (photo: Omit<PhotoItem, 'id'>) => void;
  updatePhoto: (id: string, photo: Partial<PhotoItem>) => void;
  deletePhoto: (id: string) => void;
  togglePinPhoto: (id: string) => void;
  movePhotoOrder: (id: string, direction: 'up' | 'down') => void;
  setPhotoPosition: (id: string, newPosition: number) => void;

  news: NewsItem[];
  addNews: (item: Omit<NewsItem, 'id' | 'date'>) => void;
  updateNews: (id: string, item: Partial<NewsItem>) => void;
  deleteNews: (id: string) => void;
  togglePinNews: (id: string) => void;
  moveNewsOrder: (id: string, direction: 'up' | 'down') => void;
  setNewsPosition: (id: string, newPosition: number) => void;

  links: LinkItem[];
  addLink: (link: Omit<LinkItem, 'id'>) => void;
  updateLink: (id: string, link: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;

  messages: VisitorMessage[];
  sendMessage: (msg: Omit<VisitorMessage, 'id' | 'date' | 'status'>) => void;
  markMessageRead: (id: string) => void;
  replyToMessage: (id: string, reply: string) => void;
  deleteMessage: (id: string) => void;

  comments: VisitorComment[];
  addVisitorComment: (comment: Omit<VisitorComment, 'id' | 'date' | 'isApproved' | 'status'>) => void;
  approveComment: (id: string) => void;
  rejectComment: (id: string) => void;
  toggleCommentApproval: (id: string) => void;
  replyToVisitorComment: (id: string, reply: string) => void;
  deleteVisitorComment: (id: string) => void;
  likeComment: (id: string) => void;

  // Share Modal
  shareModalItem: { title: string; url?: string; description?: string; image?: string; type?: string } | null;
  openShareModal: (item: { title: string; url?: string; description?: string; image?: string; type?: string }) => void;
  closeShareModal: () => void;

  // Comment Modal (for commenting on ANY item)
  commentModalTarget: { targetType: 'general' | 'book' | 'video' | 'photo' | 'news'; targetId?: string; targetTitle?: string } | null;
  openCommentModal: (target: { targetType: 'general' | 'book' | 'video' | 'photo' | 'news'; targetId?: string; targetTitle?: string }) => void;
  closeCommentModal: () => void;

  // CV Service monetization toggle
  cvFeesEnabled: boolean;
  toggleCvFees: () => void;

  // Header and author photo updater
  updateAuthorHeaderPhoto: (headerBannerImage: string, portraitImage?: string) => void;

  // Active navigation section
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Author Management mode & Supervisor Login
  isAuthorMode: boolean;
  setIsAuthorMode: (val: boolean) => void;
  isSupervisorLoggedIn: boolean;
  isVisitorPreviewMode: boolean;
  setIsVisitorPreviewMode: (val: boolean) => void;
  toggleVisitorPreview: () => void;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (val: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (val: boolean) => void;
  loginAsSupervisor: (user: string, pass: string) => { success: boolean; error?: string };
  logoutSupervisor: () => void;
  isUnlocked: boolean;
  setIsUnlocked: (val: boolean) => void;

  // Quick edit states for supervisor
  editingVideo: VideoItem | null;
  setEditingVideo: (v: VideoItem | null) => void;
  editingPhoto: PhotoItem | null;
  setEditingPhoto: (p: PhotoItem | null) => void;
  editingNews: NewsItem | null;
  setEditingNews: (n: NewsItem | null) => void;
  editingBook: Book | null;
  setEditingBook: (b: Book | null) => void;
  editingLink: LinkItem | null;
  setEditingLink: (l: LinkItem | null) => void;

  // Announcements Banner
  announcements: AnnouncementItem[];
  addAnnouncement: (item: Omit<AnnouncementItem, 'id'>) => void;
  updateAnnouncement: (id: string, updated: Partial<AnnouncementItem>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementActive: (id: string) => void;
  editingAnnouncement: AnnouncementItem | null;
  setEditingAnnouncement: (ann: AnnouncementItem | null) => void;
  isAnnouncementModalOpen: boolean;
  setIsAnnouncementModalOpen: (val: boolean) => void;

  // Toast notification
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Export & Import site data (for syncing between mobile & laptop)
  exportAllSiteData: () => void;
  importSiteData: (jsonString: string) => boolean;

  // Reset demo data
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up legacy storage and hydrate from IndexedDB on boot
  useEffect(() => {
    cleanupLegacyStorage();
    const hydrateFromIDB = async () => {
      try {
        const idbBooks = await loadFromIndexedDB<Book[]>('nabil_author_v4_books');
        if (idbBooks && Array.isArray(idbBooks) && idbBooks.length >= 3) {
          setBooks((current) => {
            const hasMorePages = idbBooks.some((ib) => {
              const cb = current.find((c) => c.id === ib.id);
              return cb && (ib.samplePages?.length || 0) > (cb.samplePages?.length || 0);
            });
            return hasMorePages ? idbBooks : current;
          });
        }
      } catch (err) {
        console.warn('IDB hydration check:', err);
      }
    };
    hydrateFromIDB();
  }, []);

  // Local storage helpers with version 4
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      // First check v4, then fallback to v3
      const saved = localStorage.getItem(`nabil_author_v4_${key}`) || localStorage.getItem(`nabil_author_v3_${key}`);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
        return { ...fallback, ...parsed };
      }
      return parsed;
    } catch {
      return fallback;
    }
  };

  const [authorProfile, setAuthorProfile] = useState<AuthorProfile>(() => {
    const loaded = loadState('profile', initialAuthorProfile);
    // Sanitize: ensure no ghost duplicate image in header background
    if (loaded.headerBannerImage?.includes('author') || loaded.headerBannerImage === loaded.portraitImage) {
      loaded.headerBannerImage = '';
    }
    // Ensure clean cropped official author image
    if (!loaded.portraitImage || loaded.portraitImage.includes('author_official')) {
      loaded.portraitImage = '/author.jpg';
    }
    return loaded;
  });
  const [books, setBooks] = useState<Book[]>(() => {
    let loaded = loadState('books', initialBooks);
    // Ensure book-2 ("رجل بلا لون") is present if missing, but preserve user modifications!
    if (Array.isArray(loaded)) {
      const book2Idx = loaded.findIndex((b) => b.id === 'book-2' || b.title.includes('رجل بلا لون'));
      const defaultBook2 = initialBooks.find((ib) => ib.id === 'book-2');
      if (defaultBook2) {
        if (book2Idx >= 0) {
          // If samplePages or tableOfContents are completely empty, initialize them; otherwise preserve user modifications!
          if (!loaded[book2Idx].samplePages || loaded[book2Idx].samplePages.length === 0) {
            loaded[book2Idx].samplePages = defaultBook2.samplePages;
          }
          if (!loaded[book2Idx].tableOfContents || loaded[book2Idx].tableOfContents.length === 0) {
            loaded[book2Idx].tableOfContents = defaultBook2.tableOfContents;
          }
        } else {
          loaded.splice(1, 0, defaultBook2);
        }
      }
    }
    if (
      !Array.isArray(loaded) ||
      loaded.length < 4 ||
      loaded[0]?.title === 'بين الواقع والحلم' ||
      loaded[0]?.title.includes('المؤلف الأول') ||
      !loaded[0]?.samplePages
    ) {
      return initialBooks;
    }
    // Clean up any old placeholder images, fix broken page image paths, and purge deleted 'زهرة' page
    return loaded.map((b) => {
      const cleanedGallery = (b.galleryImages || []).filter(
        (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
      );
      const isOldPlaceholder = b.coverImage?.includes('book_reality_dream');
      let finalCover = isOldPlaceholder
        ? '/src/assets/images/book_cover_heritage_1790501223547.jpg'
        : b.coverImage;

      // If the book has an uploaded image in gallery and current cover is generic heritage, adopt it as the cover!
      if (cleanedGallery.length > 0 && (finalCover.includes('book_cover_heritage') || finalCover.includes('book_reality_dream'))) {
        const customUpload = cleanedGallery.find(
          (img) => img.startsWith('data:') || img.startsWith('blob:') || !img.includes('assets/images')
        );
        if (customUpload) {
          finalCover = customUpload;
        }
      }

      // Purge deleted 'زهرة' page from book-4 if present in cache
      let rawPages = b.samplePages || [];
      let rawToc = b.tableOfContents || [];
      if (b.id === 'book-4') {
        rawPages = rawPages.filter((p) => !p.title.includes('زهرة') && p.pageNumber !== 6);
        rawToc = rawToc.filter((c) => !c.chapter.includes('زهرة') && c.pageNumber !== 6);
      }

      // Universal fallback for any book missing samplePages or tableOfContents
      if (rawPages.length === 0) {
        const defaultBook = initialBooks.find((ib) => ib.id === b.id);
        if (defaultBook?.samplePages && defaultBook.samplePages.length > 0) {
          rawPages = defaultBook.samplePages;
        }
      }
      if (rawToc.length === 0) {
        const defaultBook = initialBooks.find((ib) => ib.id === b.id);
        if (defaultBook?.tableOfContents && defaultBook.tableOfContents.length > 0) {
          rawToc = defaultBook.tableOfContents;
        }
      }

      // Automatically repair broken image paths in samplePages (e.g. /images/... -> /src/assets/images/...)
      const repairedSamplePages = rawPages.map((page) => {
        let img = page.image;
        if (img && img.startsWith('/images/')) {
          img = img.replace('/images/', '/src/assets/images/');
        }
        return {
          ...page,
          image: img,
        };
      });

      return {
        ...b,
        tableOfContents: rawToc,
        coverImage: finalCover,
        galleryImages: cleanedGallery,
        samplePages: repairedSamplePages,
        pdfUrl: undefined,
        pdfFileName: undefined,
      };
    });
  });
  const [videos, setVideos] = useState<VideoItem[]>(() => loadState('videos', initialVideos));
  const [photos, setPhotos] = useState<PhotoItem[]>(() => loadState('photos', initialPhotos));
  const [news, setNews] = useState<NewsItem[]>(() => loadState('news', initialNews));
  const [links, setLinks] = useState<LinkItem[]>(() => loadState('links', initialLinks));
  const [messages, setMessages] = useState<VisitorMessage[]>(() =>
    loadState('messages', initialMessages)
  );
  const [comments, setComments] = useState<VisitorComment[]>(() =>
    loadState('comments', initialComments)
  );
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    loadState('announcements', initialAnnouncements)
  );
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState<boolean>(false);

  const [activeSection, setActiveSection] = useState<string>('home');
  const [isAuthorMode, setIsAuthorMode] = useState<boolean>(() => {
    return localStorage.getItem('isSupervisorLoggedIn') === 'true';
  });
  const [isVisitorPreviewMode, setIsVisitorPreviewMode] = useState<boolean>(false);

  const toggleVisitorPreview = () => {
    setIsVisitorPreviewMode((prev) => {
      const next = !prev;
      if (next) {
        showToast('تم تفعيل وضع معاينة الزائر: جميع أزرار وتعديلات المشرف مخفية الآن عن الشاشة تماماً');
      } else {
        showToast('تمت العودة لوضع المشرف: أزرار التعديل وإدارة المحتوى ظاهرة لك الآن');
      }
      return next;
    });
  };
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CV Service monetization toggle (configurable by supervisor)
  const [cvFeesEnabled, setCvFeesEnabled] = useState<boolean>(() => {
    return localStorage.getItem('nabil_cv_fees_enabled') === 'true';
  });

  const toggleCvFees = () => {
    setCvFeesEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('nabil_cv_fees_enabled', next ? 'true' : 'false');
      showToast(next ? 'تم تفعيل نظام رسوم خدمة C.V (وضع الرسوم نشط)' : 'تم إيقاف الرسوم (خدمة C.V مجانية بالكامل 100% الآن)');
      return next;
    });
  };

  const loginAsSupervisor = (usernameInput: string, passwordInput: string) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (cleanUser === 'thrayanabil2026@gmail.com' && cleanPass === 'Tr@7177') {
      setIsAuthorMode(true);
      setIsVisitorPreviewMode(false);
      localStorage.setItem('isSupervisorLoggedIn', 'true');
      setIsLoginModalOpen(false);
      showToast('مرحباً بك يا أ. نبيل بركات.. تم تسجيل دخول المشرف بنجاح');
      return { success: true };
    } else {
      return {
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة. هذا الفضاء مخصص حصراً لإدارة المشرف.',
      };
    }
  };

  const logoutSupervisor = () => {
    setIsAuthorMode(false);
    setIsVisitorPreviewMode(false);
    setIsAdminPanelOpen(false);
    localStorage.removeItem('isSupervisorLoggedIn');
    showToast('تم تسجيل خروج المشرف وقفل صلاحيات الإدارة بنجاح');
  };

  // Quick edit states for supervisor
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Share Modal State
  const [shareModalItem, setShareModalItem] = useState<{
    title: string;
    url?: string;
    description?: string;
    image?: string;
    type?: string;
  } | null>(null);

  // Universal Comment Modal State
  const [commentModalTarget, setCommentModalTarget] = useState<{
    targetType: 'general' | 'book' | 'video' | 'photo' | 'news';
    targetId?: string;
    targetTitle?: string;
  } | null>(null);

  const openShareModal = (item: {
    title: string;
    url?: string;
    description?: string;
    image?: string;
    type?: string;
  }) => {
    setShareModalItem(item);
  };

  const closeShareModal = () => {
    setShareModalItem(null);
  };

  const openCommentModal = (target: {
    targetType: 'general' | 'book' | 'video' | 'photo' | 'news';
    targetId?: string;
    targetTitle?: string;
  }) => {
    setCommentModalTarget(target);
  };

  const closeCommentModal = () => {
    setCommentModalTarget(null);
  };

  const updateAuthorHeaderPhoto = async (headerBannerImage: string, portraitImage?: string) => {
    const optimizedBanner = headerBannerImage ? await compressImage(headerBannerImage, 1920, 1080, 0.82) : '';
    const optimizedPortrait = portraitImage ? await compressImage(portraitImage, 800, 800, 0.82) : undefined;
    setAuthorProfile((prev) => ({
      ...prev,
      headerBannerImage: optimizedBanner,
      portraitImage: optimizedPortrait || prev.portraitImage,
    }));
    showToast('تم تحديث صورة وبيانات الهيدر بنجاح!');
  };

  // Sync with LocalStorage & IndexedDB safely without crashing on quota
  useEffect(() => {
    safeSetItem('nabil_author_v4_profile', authorProfile);
  }, [authorProfile]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_books', books);
    setAuthorProfile((prev) => {
      if (prev.stats.booksCount !== books.length) {
        return {
          ...prev,
          stats: {
            ...prev.stats,
            booksCount: books.length,
          },
        };
      }
      return prev;
    });
  }, [books]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_videos', videos);
  }, [videos]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_photos', photos);
  }, [photos]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_news', news);
  }, [news]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_links', links);
  }, [links]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_messages', messages);
  }, [messages]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_comments', comments);
  }, [comments]);

  useEffect(() => {
    safeSetItem('nabil_author_v4_announcements', announcements);
  }, [announcements]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  const updateAuthorProfile = (profile: Partial<AuthorProfile>) => {
    setAuthorProfile((prev) => ({ ...prev, ...profile }));
    showToast('تم تحديث البيانات الشخصية للكاتب بنجاح');
  };

  // Books
  const addBook = (bookData: Omit<Book, 'id' | 'comments'>) => {
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}`,
      comments: [],
    };
    setBooks((prev) => {
      const next = [newBook, ...prev];
      safeSetItem('nabil_author_v4_books', next);
      return next;
    });
    showToast('تمت إضافة مؤلّف جديد إلى قائمة الكتب بنجاح');
  };

  const updateBook = (id: string, updated: Partial<Book>) => {
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updated } : b));
      safeSetItem('nabil_author_v4_books', next);
      return next;
    });
    showToast('تم حفظ تعديلات الكتاب في قاعدة البيانات');
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      safeSetItem('nabil_author_v4_books', next);
      return next;
    });
    showToast('تم حذف الكتاب من القائمة');
  };

  const setBookPdf = (bookId: string, pdfUrl: string, pdfFileName?: string) => {
    updateBook(bookId, { pdfUrl, pdfFileName });
    showToast('تم إرفاق وتحديث ملف PDF للكتاب بنجاح');
  };

  const setBookCover = async (bookId: string, coverImage: string) => {
    const optimizedCover = await compressImage(coverImage, 900, 1200, 0.82);
    setBooks((prev) => {
      return prev.map((b) => {
        if (b.id !== bookId) return b;
        const cleanedGallery = (b.galleryImages || []).filter(
          (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
        );
        const hasCover = cleanedGallery.includes(optimizedCover);
        const newGallery = hasCover ? cleanedGallery : [optimizedCover, ...cleanedGallery];
        return {
          ...b,
          coverImage: optimizedCover,
          galleryImages: newGallery,
        };
      });
    });
    showToast('تم اعتماد وتحديث صورة غلاف الكتاب بنجاح');
  };

  const deleteBookGalleryImage = (bookId: string, imageIndex: number) => {
    setBooks((prev) => {
      return prev.map((b) => {
        if (b.id !== bookId) return b;
        const newGallery = [...(b.galleryImages || [])];
        const removed = newGallery.splice(imageIndex, 1)[0];
        let newCover = b.coverImage;
        if (b.coverImage === removed) {
          const firstImage = newGallery.find((m) => !isVideoMedia(m));
          newCover = firstImage || '/src/assets/images/book_cover_heritage_1790501223547.jpg';
        }
        return {
          ...b,
          coverImage: newCover,
          galleryImages: newGallery,
        };
      });
    });
    showToast('تم حذف العنصر من معرض الكتاب بنجاح');
  };

  const addBookGalleryImage = async (bookId: string, mediaUrl: string) => {
    if (!mediaUrl) return;
    const isVideo = isVideoMedia(mediaUrl);
    let finalMedia = mediaUrl;
    if (!isVideo) {
      finalMedia = await compressImage(mediaUrl, 1200, 1200, 0.82);
    }
    setBooks((prev) => {
      return prev.map((b) => {
        if (b.id !== bookId) return b;
        const current = (b.galleryImages || []).filter(
          (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
        );
        return {
          ...b,
          galleryImages: [...current, finalMedia],
        };
      });
    });
    showToast(isVideo ? 'تمت إضافة الفيديو إلى معرض الكتاب بنجاح' : 'تمت إضافة الصورة إلى معرض الكتاب بنجاح');
  };

  const addBookComment = (bookId: string, commentData: Omit<BookComment, 'id' | 'date'>) => {
    const newComment: BookComment = {
      ...commentData,
      id: `bc-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId ? { ...b, comments: [newComment, ...b.comments] } : b
      )
    );
    showToast('شكراً لك! تم نشر تعليقك ومراجعتك للكتاب');
  };

  const deleteBookComment = (bookId: string, commentId: string) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, comments: (b.comments || []).filter((c) => c.id !== commentId) }
          : b
      )
    );
    showToast('تم حذف التعليق من الكتاب بنجاح');
  };

  const togglePinBook = (id: string) => {
    setBooks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const isNowPinned = !target.isPinned;
      const updated = { ...target, isPinned: isNowPinned };
      const rest = prev.filter((b) => b.id !== id);
      const next = isNowPinned ? [updated, ...rest] : [...rest, updated];
      showToast(isNowPinned ? `تم تثبيت كتاب "${target.title}" في المقدمة 📌` : `تم إلغاء تثبيت كتاب "${target.title}"`);
      return next;
    });
  };

  const moveBookOrder = (id: string, direction: 'up' | 'down') => {
    setBooks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      showToast(`تم تغيير ترتيب "${temp.title}" إلى المركز (${targetIdx + 1})`);
      return next;
    });
  };

  const setBookPosition = (id: string, newPosition: number) => {
    setBooks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const targetIdx = Math.max(0, Math.min(prev.length - 1, newPosition - 1));
      if (targetIdx === idx) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIdx, 0, item);
      showToast(`تم تغيير ترتيب "${item.title}" ليصبح في المركز (${targetIdx + 1})`);
      return next;
    });
  };

  // Videos
  const addVideo = (videoData: Omit<VideoItem, 'id' | 'date'>) => {
    const newVideo: VideoItem = {
      ...videoData,
      id: `vid-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    setVideos((prev) => [newVideo, ...prev]);
    showToast('تمت إضافة مقطع الفيديو بنجاح');
  };

  const updateVideo = (id: string, updated: Partial<VideoItem>) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
    showToast('تم تحديث بيانات الفيديو');
  };

  const deleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    showToast('تم إزالة الفيديو');
  };

  const togglePinVideo = (id: string) => {
    setVideos((prev) => {
      const idx = prev.findIndex((v) => v.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const isNowPinned = !target.isPinned;
      const updated = { ...target, isPinned: isNowPinned };
      const rest = prev.filter((v) => v.id !== id);
      const next = isNowPinned ? [updated, ...rest] : [...rest, updated];
      showToast(isNowPinned ? `تم تثبيت مقطع الفيديو في المقدمة 📌` : `تم إلغاء تثبيت مقطع الفيديو`);
      return next;
    });
  };

  const moveVideoOrder = (id: string, direction: 'up' | 'down') => {
    setVideos((prev) => {
      const idx = prev.findIndex((v) => v.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      showToast(`تم تغيير ترتيب الفيديو إلى المركز (${targetIdx + 1})`);
      return next;
    });
  };

  const setVideoPosition = (id: string, newPosition: number) => {
    setVideos((prev) => {
      const idx = prev.findIndex((v) => v.id === id);
      if (idx === -1) return prev;
      const targetIdx = Math.max(0, Math.min(prev.length - 1, newPosition - 1));
      if (targetIdx === idx) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIdx, 0, item);
      showToast(`تم تغيير ترتيب الفيديو ليصبح في المركز (${targetIdx + 1})`);
      return next;
    });
  };

  // Photos
  const addPhoto = async (photoData: Omit<PhotoItem, 'id'>) => {
    let optimizedUrl = photoData.imageUrl;
    if (optimizedUrl && optimizedUrl.startsWith('data:image/')) {
      optimizedUrl = await compressImage(optimizedUrl, 1280, 1280, 0.82);
    }
    const newPhoto: PhotoItem = {
      ...photoData,
      imageUrl: optimizedUrl,
      id: `p-${Date.now()}`,
    };
    setPhotos((prev) => [newPhoto, ...prev]);
    showToast('تمت إضافة الصورة إلى الألبوم بنجاح');
  };

  const updatePhoto = (id: string, updated: Partial<PhotoItem>) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('تم تحديث بيانات الصورة');
  };

  const deletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    showToast('تم حذف الصورة من الألبوم');
  };

  const togglePinPhoto = (id: string) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const isNowPinned = !target.isPinned;
      const updated = { ...target, isPinned: isNowPinned };
      const rest = prev.filter((p) => p.id !== id);
      const next = isNowPinned ? [updated, ...rest] : [...rest, updated];
      showToast(isNowPinned ? `تم تثبيت الصورة في المقدمة 📌` : `تم إلغاء تثبيت الصورة`);
      return next;
    });
  };

  const movePhotoOrder = (id: string, direction: 'up' | 'down') => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      showToast(`تم تغيير ترتيب الصورة إلى المركز (${targetIdx + 1})`);
      return next;
    });
  };

  const setPhotoPosition = (id: string, newPosition: number) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const targetIdx = Math.max(0, Math.min(prev.length - 1, newPosition - 1));
      if (targetIdx === idx) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIdx, 0, item);
      showToast(`تم تغيير ترتيب الصورة ليصبح في المركز (${targetIdx + 1})`);
      return next;
    });
  };

  // News
  const addNews = (newsData: Omit<NewsItem, 'id' | 'date'>) => {
    const newItem: NewsItem = {
      ...newsData,
      id: `n-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    setNews((prev) => [newItem, ...prev]);
    showToast('تم نشر الخبر أو المقال الأدبي بنجاح');
  };

  const updateNews = (id: string, updated: Partial<NewsItem>) => {
    setNews((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
    showToast('تم تحديث الخبر');
  };

  const deleteNews = (id: string) => {
    setNews((prev) => prev.filter((n) => n.id !== id));
    showToast('تم حذف الخبر أو المقال');
  };

  const togglePinNews = (id: string) => {
    setNews((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const isNowPinned = !target.isPinned;
      const updated = { ...target, isPinned: isNowPinned };
      const rest = prev.filter((n) => n.id !== id);
      const next = isNowPinned ? [updated, ...rest] : [...rest, updated];
      showToast(isNowPinned ? `تم تثبيت الخبر في المقدمة 📌` : `تم إلغاء تثبيت الخبر`);
      return next;
    });
  };

  const moveNewsOrder = (id: string, direction: 'up' | 'down') => {
    setNews((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      showToast(`تم تغيير ترتيب الخبر إلى المركز (${targetIdx + 1})`);
      return next;
    });
  };

  const setNewsPosition = (id: string, newPosition: number) => {
    setNews((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const targetIdx = Math.max(0, Math.min(prev.length - 1, newPosition - 1));
      if (targetIdx === idx) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIdx, 0, item);
      showToast(`تم تغيير ترتيب الخبر ليصبح في المركز (${targetIdx + 1})`);
      return next;
    });
  };

  // Links
  const addLink = (linkData: Omit<LinkItem, 'id'>) => {
    const newLink: LinkItem = {
      ...linkData,
      id: `l-${Date.now()}`,
    };
    setLinks((prev) => [newLink, ...prev]);
    showToast('تمت إضافة الرابط الجديد بنجاح');
  };

  const updateLink = (id: string, updated: Partial<LinkItem>) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    showToast('تم تحديث الرابط');
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    showToast('تم حذف الرابط');
  };

  // Announcements
  const addAnnouncement = (itemData: Omit<AnnouncementItem, 'id'>) => {
    const newItem: AnnouncementItem = {
      ...itemData,
      id: `ann-${Date.now()}`,
    };
    setAnnouncements((prev) => [newItem, ...prev]);
    showToast('تمت إضافة الإعلان الجديد بنجاح');
  };

  const updateAnnouncement = (id: string, updated: Partial<AnnouncementItem>) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    showToast('تم حفظ تعديلات الإعلان');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('تم حذف الإعلان بنجاح');
  };

  const toggleAnnouncementActive = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
    showToast('تم تغيير حالة تفعيل الإعلان');
  };

  // Messages
  const sendMessage = (msgData: Omit<VisitorMessage, 'id' | 'date' | 'status'>) => {
    const newMsg: VisitorMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'unread',
    };
    setMessages((prev) => [newMsg, ...prev]);
    showToast('تم إرسال رسالتك بأمان إلى الأستاذ نبيل بركات. شكراً لاهتمامك ومراسلتك.');
  };

  const markMessageRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: m.status === 'unread' ? 'read' : m.status } : m))
    );
  };

  const replyToMessage = (id: string, reply: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, authorReply: reply, status: 'replied' } : m))
    );
    showToast('تم تسجيل رد الكاتب وإرساله');
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('تم حذف الرسالة من صندوق الوارد');
  };

  // Comments
  const addVisitorComment = (commentData: Omit<VisitorComment, 'id' | 'date' | 'isApproved' | 'status'>) => {
    const newCom: VisitorComment = {
      ...commentData,
      id: `vcom-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      isApproved: false, // Subject to approval before publishing!
      status: 'pending',
      likesCount: 0,
    };
    setComments((prev) => [newCom, ...prev]);
    showToast('تم استلام تعليقك بنجاح! سيتم نشره فور مراجعته واعتماده من قبل أ. نبيل بركات.');
  };

  const approveComment = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isApproved: true, status: 'approved' } : c))
    );
    showToast('تم اعتماد ونشر التعليق بنجاح');
  };

  const rejectComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    showToast('تم رفض وحذف التعليق بنجاح');
  };

  const toggleCommentApproval = (id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isApproved: !c.isApproved,
              status: !c.isApproved ? 'approved' : 'pending',
            }
          : c
      )
    );
  };

  const likeComment = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likesCount: (c.likesCount || 0) + 1 } : c))
    );
  };

  const replyToVisitorComment = (id: string, reply: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, authorReply: reply } : c))
    );
    showToast('تم حفظ رد الكاتب على التعليق');
  };

  const deleteVisitorComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    showToast('تم حذف التعليق');
  };

  const exportAllSiteData = () => {
    try {
      const backupData = {
        app: 'nabil_barakat_site',
        version: '4.0',
        exportDate: new Date().toISOString(),
        authorProfile,
        books,
        videos,
        photos,
        news,
        links,
        announcements,
        comments,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nabil_barakat_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تصدير ملف النسخة الاحتياطية بنجاح! يمكنك إرساله للابتوب واستيراده.');
    } catch (err) {
      console.error('Export error:', err);
      showToast('تعذر تصدير البيانات، يرجى المحاولة لاحقاً');
    }
  };

  const importSiteData = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        showToast('صيغة ملف النسخة الاحتياطية غير صالحة');
        return false;
      }
      if (data.authorProfile) setAuthorProfile(data.authorProfile);
      if (Array.isArray(data.books)) setBooks(data.books);
      if (Array.isArray(data.videos)) setVideos(data.videos);
      if (Array.isArray(data.photos)) setPhotos(data.photos);
      if (Array.isArray(data.news)) setNews(data.news);
      if (Array.isArray(data.links)) setLinks(data.links);
      if (Array.isArray(data.announcements)) setAnnouncements(data.announcements);
      if (Array.isArray(data.comments)) setComments(data.comments);

      showToast('تم استيراد كافة البيانات والأغلفة بنجاح وتحديث الموقع على هذا الجهاز!');
      return true;
    } catch (err) {
      console.error('Import error:', err);
      showToast('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      return false;
    }
  };

  const resetAllData = () => {
    setAuthorProfile(initialAuthorProfile);
    setBooks(initialBooks);
    setVideos(initialVideos);
    setPhotos(initialPhotos);
    setNews(initialNews);
    setLinks(initialLinks);
    setMessages(initialMessages);
    setComments(initialComments);
    showToast('تمت استعادة البيانات التأسيسية للموقع بنجاح');
  };

  return (
    <AppContext.Provider
      value={{
        authorProfile,
        updateAuthorProfile,
        books,
        addBook,
        updateBook,
        deleteBook,
        setBookPdf,
        setBookCover,
        deleteBookGalleryImage,
        addBookGalleryImage,
        addBookComment,
        deleteBookComment,
        togglePinBook,
        moveBookOrder,
        setBookPosition,
        videos,
        addVideo,
        updateVideo,
        deleteVideo,
        togglePinVideo,
        moveVideoOrder,
        setVideoPosition,
        photos,
        addPhoto,
        updatePhoto,
        deletePhoto,
        togglePinPhoto,
        movePhotoOrder,
        setPhotoPosition,
        news,
        addNews,
        updateNews,
        deleteNews,
        togglePinNews,
        moveNewsOrder,
        setNewsPosition,
        links,
        addLink,
        updateLink,
        deleteLink,
        messages,
        sendMessage,
        markMessageRead,
        replyToMessage,
        deleteMessage,
        comments,
        addVisitorComment,
        approveComment,
        rejectComment,
        toggleCommentApproval,
        replyToVisitorComment,
        deleteVisitorComment,
        likeComment,
        shareModalItem,
        openShareModal,
        closeShareModal,
        commentModalTarget,
        openCommentModal,
        closeCommentModal,
        updateAuthorHeaderPhoto,
        cvFeesEnabled,
        toggleCvFees,
        activeSection,
        setActiveSection,
        isAuthorMode: isAuthorMode && !isVisitorPreviewMode,
        setIsAuthorMode,
        isSupervisorLoggedIn: isAuthorMode,
        isVisitorPreviewMode,
        setIsVisitorPreviewMode,
        toggleVisitorPreview,
        isAdminPanelOpen,
        setIsAdminPanelOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginAsSupervisor,
        logoutSupervisor,
        isUnlocked,
        setIsUnlocked,
        editingVideo,
        setEditingVideo,
        editingPhoto,
        setEditingPhoto,
        editingNews,
        setEditingNews,
        editingBook,
        setEditingBook,
        editingLink,
        setEditingLink,
        announcements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        toggleAnnouncementActive,
        editingAnnouncement,
        setEditingAnnouncement,
        isAnnouncementModalOpen,
        setIsAnnouncementModalOpen,
        toastMessage,
        showToast,
        exportAllSiteData,
        importSiteData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
