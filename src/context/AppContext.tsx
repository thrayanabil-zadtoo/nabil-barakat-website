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
  AuthorPost,
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
  initialAuthorPosts,
  officialBookAccreditations,
} from '../data/initialData';
import { safeSetItem, cleanupLegacyStorage, loadFromIndexedDB } from '../utils/storageManager';
import { compressImage } from '../utils/imageCompressor';
import { uploadImageToCloud } from '../utils/cloudStorageHelper';
import { uploadVideoToServer } from '../utils/videoUploadHelper';
import { isVideoMedia } from '../utils/mediaUtils';
import { parseVideoUrl } from '../utils/videoUtils';
import {
  subscribeToCloudSiteData,
  saveSiteDataToCloud,
  fetchCloudSiteData,
  deleteCommunityPostFromCloud,
  deletePhotoFromCloud,
  syncSinglePostStatsToCloud,
  isCloudQuotaExceeded,
  resetCloudQuotaFlag,
  setCloudQuotaListener,
  getLocalDeletedPhotoIds,
  getLocalDeletedPostIds,
  SyncedSiteData,
} from '../utils/firebaseSync';
import { sortCommunityPostsNewestFirst } from '../utils/communityPostColors';
import { normalizePhotoCategory, normalizePhotosList } from '../utils/photoCategories';
import {
  generateInitialCommunityPostStats,
  getCommunityPostStats,
  getLocalPostLikeState,
  setLocalPostLikeState,
} from '../utils/dynamicStats';
import {
  hasSeededNotificationRegistry,
  seedBaselineContentIds,
  notifySingleNewContent,
  notifyNewContentFromSync,
} from '../utils/contentNotifications';

interface AppContextType {
  authorProfile: AuthorProfile;
  updateAuthorProfile: (profile: Partial<AuthorProfile>) => void;

  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  executeCloudSave: (payload: Partial<SyncedSiteData>, successMessage: string, actionDesc?: string) => Promise<boolean>;

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
  addPhoto: (photo: Omit<PhotoItem, 'id'>) => Promise<boolean>;
  updatePhoto: (id: string, photo: Partial<PhotoItem>) => Promise<boolean>;
  deletePhoto: (id: string) => Promise<boolean>;
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
  commentModalTarget: { targetType: 'general' | 'book' | 'video' | 'photo' | 'news' | 'post'; targetId?: string; targetTitle?: string } | null;
  openCommentModal: (target: { targetType: 'general' | 'book' | 'video' | 'photo' | 'news' | 'post'; targetId?: string; targetTitle?: string }) => void;
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
  loginAsSupervisor: (user: string, pass: string) => { success: boolean; error?: string; attempts?: number; isBlocked?: boolean; remainingSeconds?: number };
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
  isAnnouncementBannerVisible: boolean;
  toggleAnnouncementBannerVisibility: () => void;

  // Add Book Modal state
  isAddBookModalOpen: boolean;
  setIsAddBookModalOpen: (val: boolean) => void;

  // Author Facebook-style Posts / Thoughts Feed
  authorPosts: AuthorPost[];
  addAuthorPost: (post: Omit<AuthorPost, 'id' | 'date'>) => Promise<boolean>;
  updateAuthorPost: (id: string, updated: Partial<AuthorPost>) => Promise<boolean>;
  deleteAuthorPost: (id: string) => Promise<boolean>;
  toggleLikeAuthorPost: (id: string, forceLike?: boolean) => boolean;
  recordPostView: (id: string) => void;
  openCommunityPost: (postId: string) => void;

  // Toast notification
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Export & Import site data (for syncing between mobile & laptop)
  exportAllSiteData: () => void;
  importSiteData: (jsonString: string) => boolean;

  // Reset demo data
  resetAllData: () => void;

  // Cloud Sync Status & Actions
  isCloudSynced: boolean;
  syncAllToCloudNow: () => Promise<void>;

  // Upload status and visual progress indicator
  uploadStatus: UploadStatusState | null;
  setUploadStatus: (status: UploadStatusState | null) => void;
  processAndUploadImage: (
    file: File,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      category?: string;
      contextTitle?: string;
      bookId?: string;
    }
  ) => Promise<string>;
  processAndUploadVideo: (
    file: File,
    options?: {
      contextTitle?: string;
      bookId?: string;
    }
  ) => Promise<string>;
  copyToClipboardWithFeedback: (text: string, message?: string) => void;
  refreshAndBypassCache: (forceHardReload?: boolean) => Promise<void>;
  autoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  autoRefreshIntervalSeconds: number;
  setAutoRefreshIntervalSeconds: (sec: number) => void;
}

export interface UploadStatusState {
  isUploading: boolean;
  progress: number;
  fileName: string;
  stage: 'processing' | 'saving_cloud' | 'completed' | 'error';
  stageText: string;
  resultUrl: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const isBook5DeletedManually = () => {
  try {
    return localStorage.getItem('nabil_deleted_book5_poetry_v1') === 'true';
  } catch {
    return false;
  }
};

const ensurePoetryBook5Present = (list: Book[]): Book[] => {
  if (!Array.isArray(list)) return initialBooks;
  if (isBook5DeletedManually()) return list;
  const hasBook5 = list.some(
    (b) => b && (b.id === 'book-5' || b.title?.includes('امرأة أعادت برمجة قلبي'))
  );
  if (hasBook5) return list;
  const defaultBook5 = initialBooks.find((ib) => ib.id === 'book-5');
  return defaultBook5 ? [...list, defaultBook5] : list;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up legacy storage and hydrate from IndexedDB on boot
  useEffect(() => {
    cleanupLegacyStorage();
    try {
      // Purge old video cache versions to prevent old/broken file URLs from resurrecting
      localStorage.removeItem('nabil_author_v4_videos');
      localStorage.removeItem('nabil_author_v3_videos');
    } catch {}

    const hydrateFromIDB = async () => {
      try {
        const idbBooks = await loadFromIndexedDB<Book[]>('nabil_author_v4_books');
        if (idbBooks && Array.isArray(idbBooks) && idbBooks.length > 0) {
          const sanitizedIdbBooks = ensurePoetryBook5Present(
            idbBooks.map((b) => {
              const official =
                officialBookAccreditations[b.id] ||
                (b.title.includes('شيماء') ? officialBookAccreditations['book-1'] :
                 b.title.includes('رجل بلا لون') ? officialBookAccreditations['book-2'] :
                 b.title.includes('اعترافات') ? officialBookAccreditations['book-3'] :
                 b.title.includes('عاشق') ? officialBookAccreditations['book-4'] : null);
              if (official) {
                return {
                  ...b,
                  depositNumber: official.depositNumber,
                  isbn: official.isbn,
                  publisher: official.publisher,
                  publicationYear: official.publicationYear,
                };
              }
              return b;
            })
          );
          setBooks(sanitizedIdbBooks);
          safeSetItem('nabil_author_v4_books', sanitizedIdbBooks);
        }
        const idbProfile = await loadFromIndexedDB<AuthorProfile>('nabil_author_v4_profile');
        if (idbProfile && idbProfile.name) {
          setAuthorProfile((prev) => ({ ...prev, ...idbProfile }));
        }
        const idbPhotos = await loadFromIndexedDB<PhotoItem[]>('nabil_author_v4_photos');
        if (idbPhotos && Array.isArray(idbPhotos)) {
          const normalized = normalizePhotosList(idbPhotos).filter((p) => !getLocalDeletedPhotoIds().has(p.id));
          setPhotos(normalized);
          photosRef.current = normalized;
        }
        const idbVideos = await loadFromIndexedDB<VideoItem[]>('nabil_author_v5_videos');
        if (idbVideos && Array.isArray(idbVideos) && idbVideos.length > 0) {
          setVideos(idbVideos);
        }
        const idbNews = await loadFromIndexedDB<NewsItem[]>('nabil_author_v4_news');
        if (idbNews && Array.isArray(idbNews)) {
          setNews(idbNews);
        }
        const idbPosts = await loadFromIndexedDB<AuthorPost[]>('nabil_author_v4_author_posts');
        if (idbPosts && Array.isArray(idbPosts) && idbPosts.length > 0) {
          const sorted = sortCommunityPostsNewestFirst(idbPosts.filter((p) => p && p.id && !getLocalDeletedPostIds().has(p.id)));
          setAuthorPosts(sorted);
          authorPostsRef.current = sorted;
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
    // Sanitize bio to reflect official title "روائي وشاعر"
    if (loaded.bio) {
      if (loaded.bio.includes('كاتب روائي وشاعر')) {
        loaded.bio = loaded.bio.replace(/كاتب روائي وشاعر/g, 'روائي وشاعر');
      }
      if (loaded.bio.includes('كاتب وروائي ومفكر')) {
        loaded.bio = loaded.bio.replace(/كاتب وروائي ومفكر/g, 'روائي وشاعر');
      }
    }
    if (loaded.extendedBio) {
      if (loaded.extendedBio.includes('الكاتب والروائي والمفكر')) {
        loaded.extendedBio = loaded.extendedBio.replace(/الكاتب والروائي والمفكر/g, 'الكاتب الروائي والشاعر');
      }
      if (loaded.extendedBio.includes('الكاتب الروائي') && !loaded.extendedBio.includes('والشاعر')) {
        loaded.extendedBio = loaded.extendedBio.replace('الكاتب الروائي', 'الكاتب الروائي والشاعر');
      }
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
    if (!Array.isArray(loaded) || loaded.length === 0) {
      return initialBooks;
    }
    loaded = ensurePoetryBook5Present(loaded);
    // Clean up any old placeholder images, fix broken page image paths, and purge deleted 'زهرة' page
    return loaded.map((b) => {
      const cleanedGallery = (b.galleryImages || []).filter(
        (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
      );
      const isOldPlaceholder = b.coverImage?.includes('book_reality_dream');
      let finalCover = isOldPlaceholder
        ? '/src/assets/images/book_cover_heritage_1790501223547.jpg'
        : b.coverImage;

      // Guard: If cover was accidentally corrupted into a video URL, restore a proper literary cover
      if (
        !finalCover ||
        isVideoMedia(finalCover) ||
        finalCover.includes('.mp4') ||
        finalCover.includes('.webm') ||
        finalCover.includes('mixkit')
      ) {
        finalCover =
          b.id === 'book-1'
            ? '/src/assets/images/book_cover_whispers_1790501236880.jpg'
            : '/src/assets/images/book_cover_heritage_1790501223547.jpg';
      }

      // If the book has an uploaded image in gallery and current cover is generic heritage, adopt it as the cover!
      if (
        cleanedGallery.length > 0 &&
        (finalCover.includes('book_cover_heritage') || finalCover.includes('book_reality_dream'))
      ) {
        const customUpload = cleanedGallery.find(
          (img) =>
            !isVideoMedia(img) &&
            !img.includes('.mp4') &&
            !img.includes('.webm') &&
            !img.includes('mixkit') &&
            (img.startsWith('data:image/') || img.startsWith('blob:') || !img.includes('assets/images'))
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

      // Sync official legal deposit number, ISBN, publisher, and year
      const defaultBook = initialBooks.find((ib) => ib.id === b.id);
      const official =
        officialBookAccreditations[b.id] ||
        (b.title.includes('شيماء') ? officialBookAccreditations['book-1'] :
         b.title.includes('رجل بلا لون') ? officialBookAccreditations['book-2'] :
         b.title.includes('اعترافات') ? officialBookAccreditations['book-3'] :
         b.title.includes('عاشق') ? officialBookAccreditations['book-4'] : null);

      const depositNumber = official ? official.depositNumber : (b.depositNumber ?? defaultBook?.depositNumber ?? '');
      const isbn = official ? official.isbn : (b.isbn ?? defaultBook?.isbn ?? '');
      const publisher = official?.publisher || b.publisher || defaultBook?.publisher || 'مؤسسة دار الهلال للنشر';
      const publicationYear = official?.publicationYear || b.publicationYear || defaultBook?.publicationYear || '2025';

      return {
        ...b,
        depositNumber,
        isbn,
        publisher,
        publicationYear,
        tableOfContents: rawToc,
        coverImage: finalCover,
        galleryImages: cleanedGallery,
        samplePages: repairedSamplePages,
      };
    });
  });

  const booksRef = React.useRef<Book[]>(books);
  useEffect(() => {
    booksRef.current = books;
  }, [books]);
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    const raw = localStorage.getItem('nabil_author_v5_videos');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((v: any) => v && !v.url?.includes('mixkit.co'));
        }
      } catch {}
    }
    return initialVideos;
  });
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    normalizePhotosList(loadState('photos', initialPhotos)).filter((p) => !getLocalDeletedPhotoIds().has(p.id))
  );
  const photosRef = React.useRef<PhotoItem[]>(photos);
  const pendingLocalPhotoIdsRef = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

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
  const [isAnnouncementBannerVisible, setIsAnnouncementBannerVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nabil_announcement_banner_visible');
      if (stored !== null) return stored === 'true';
    }
    // Default to false (hidden) as explicitly requested by author
    return false;
  });

  const toggleAnnouncementBannerVisibility = () => {
    setIsAnnouncementBannerVisible((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabil_announcement_banner_visible', String(next));
      }
      showToast(next ? '✓ تم إظهار الشريط الإعلاني في أعلى الموقع' : '✓ تم إخفاء الشريط الإعلاني تماماً عن الظهور');
      return next;
    });
  };

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState<boolean>(false);
  const [authorPosts, setAuthorPosts] = useState<AuthorPost[]>(() =>
    sortCommunityPostsNewestFirst(
      loadState('author_posts', initialAuthorPosts)
        .filter((p: AuthorPost) => p && p.id && !getLocalDeletedPostIds().has(p.id))
        .map((p: AuthorPost) => {
          const localLiked = getLocalPostLikeState(p.id);
          return localLiked !== null ? { ...p, isLiked: localLiked } : p;
        })
    )
  );
  const authorPostsRef = React.useRef<AuthorPost[]>(authorPosts);
  const pendingLocalPostIdsRef = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    authorPostsRef.current = authorPosts;
  }, [authorPosts]);

  const getInitialSection = (): string => {
    if (typeof window !== 'undefined') {
      if ((window as any).__INITIAL_SECTION__) {
        return (window as any).__INITIAL_SECTION__;
      }

      const rawPath = (window.location.pathname || '').toLowerCase();
      const rawHash = (window.location.hash || '').toLowerCase();
      const rawSearch = (window.location.search || '').toLowerCase();

      if (
        rawPath.includes('community') ||
        rawPath.includes('مجتمع') ||
        rawHash.includes('community') ||
        rawHash.includes('مجتمع') ||
        rawSearch.includes('community') ||
        rawSearch.includes('post=')
      ) {
        return 'community';
      }
      if (
        rawPath.includes('license') ||
        rawPath.includes('تراخيص') ||
        rawHash.includes('license') ||
        rawHash.includes('تراخيص') ||
        rawSearch.includes('license')
      ) {
        return 'licenses';
      }
      if (rawPath.includes('book') || rawHash.includes('book') || rawSearch.includes('book')) {
        return 'books';
      }
      if (rawPath.includes('video') || rawHash.includes('video') || rawSearch.includes('video')) {
        return 'videos';
      }
      if (rawPath.includes('photo') || rawHash.includes('photo') || rawSearch.includes('photo')) {
        return 'photos';
      }
      if (rawPath.includes('news') || rawHash.includes('news') || rawSearch.includes('news')) {
        return 'news';
      }
      if (rawPath.includes('link') || rawHash.includes('link') || rawSearch.includes('link')) {
        return 'links';
      }
      if (rawPath.includes('contact') || rawHash.includes('contact') || rawSearch.includes('contact')) {
        return 'contact';
      }
      if (rawPath.includes('cv') || rawHash.includes('cv') || rawSearch.includes('cv')) {
        return 'cv';
      }
    }
    return 'home';
  };

  const [activeSection, setActiveSectionInternal] = useState<string>(getInitialSection);

  const setActiveSection = (section: string) => {
    setActiveSectionInternal(section);
    if (typeof window !== 'undefined') {
      try {
        if (section === 'home') {
          if (window.location.pathname !== '/' || (window.location.hash && !window.location.hash.startsWith('#cv-'))) {
            history.pushState(null, '', '/');
          }
        } else {
          const targetPath = `/${section}`;
          if (window.location.pathname !== targetPath && !window.location.hash.startsWith('#cv-')) {
            history.pushState({ section }, '', targetPath);
          }
        }
      } catch {
        if (section === 'home') {
          window.location.hash = '';
        } else {
          window.location.hash = section;
        }
      }
    }
  };

  const openCommunityPost = (postId: string) => {
    setActiveSectionInternal('community');
    if (typeof window !== 'undefined') {
      const targetUrl = `/community?post=${encodeURIComponent(postId)}`;
      try {
        history.pushState({ section: 'community', postId }, '', targetUrl);
      } catch {
        window.location.hash = `community?post=${encodeURIComponent(postId)}`;
      }
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nb:focus-post', { detail: { postId } }));
      }, 60);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = getInitialSection();
    if (initial && initial !== 'home') {
      setActiveSectionInternal(initial);
    }
    const handleUrlSync = () => {
      const resolved = getInitialSection();
      setActiveSectionInternal(resolved);
    };
    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener('hashchange', handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('hashchange', handleUrlSync);
    };
  }, []);
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

  // Upload visual progress and link status
  const [uploadStatus, setUploadStatus] = useState<UploadStatusState | null>(null);

  const copyToClipboardWithFeedback = (text: string, message?: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      showToast(message || 'تم نسخ رابط الصورة بنجاح إلى الحافظة');
    } catch {
      showToast('تم تحديد الرابط، يرجى نسخه');
    }
  };

  // Firebase Cloud Synchronization State
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const isCloudHydrated = React.useRef<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const executeCloudSave = async (
    payload: Partial<SyncedSiteData>,
    successMessage: string,
    actionDesc = 'التعديلات'
  ): Promise<boolean> => {
    setSaveStatus('saving');
    showToast(`جارٍ حفظ ${actionDesc} سحابياً على Firebase...`);
    try {
      const ok = await saveSiteDataToCloud(payload, true);
      if (ok) {
        setSaveStatus('saved');
        setIsCloudSynced(true);
        showToast(`✓ ${successMessage}`);
        setTimeout(() => setSaveStatus('idle'), 3000);
        return true;
      } else {
        setSaveStatus('error');
        if (isCloudQuotaExceeded()) {
          setIsCloudSynced(false);
          showToast('⚠️ تم استهلاك الحصة اليومية المجانية لقاعدة البيانات؛ تتجدد غداً أو عبر الترقية من لوحة Firebase.');
        } else {
          showToast(`⚠️ تعذر إتمام الحفظ السحابي لـ ${actionDesc}. يرجى التحقق من الاتصال بالإنترنت.`);
        }
        return false;
      }
    } catch (err: any) {
      setSaveStatus('error');
      console.error('executeCloudSave error:', err);
      showToast(`❌ فشل الحفظ: ${err?.message || 'خطأ في الاتصال بالسحابة'}`);
      return false;
    }
  };

  const sanitizeBooksList = (inputBooks: Book[]): Book[] => {
    return ensurePoetryBook5Present(
      inputBooks.map((b) => {
        const official =
          officialBookAccreditations[b.id] ||
          (b.title?.includes('شيماء') ? officialBookAccreditations['book-1'] :
           b.title?.includes('رجل بلا لون') ? officialBookAccreditations['book-2'] :
           b.title?.includes('اعترافات') ? officialBookAccreditations['book-3'] :
           b.title?.includes('عاشق') ? officialBookAccreditations['book-4'] : null);
        if (official) {
          return {
            ...b,
            depositNumber: official.depositNumber,
            isbn: official.isbn,
            publisher: official.publisher,
            publicationYear: official.publicationYear,
          };
        }
        return b;
      })
    );
  };

  const mergeIncomingPhotos = (incomingCloudPhotos: PhotoItem[]): PhotoItem[] => {
    const deletedIds = getLocalDeletedPhotoIds();
    const normalizedCloud = normalizePhotosList(incomingCloudPhotos).filter((p) => !deletedIds.has(p.id));
    const prevMap = new Map<string, PhotoItem>();
    photosRef.current.forEach((p) => {
      if (p && p.id) prevMap.set(p.id, p);
    });

    const cloudIds = new Set(normalizedCloud.map((p) => p.id));
    cloudIds.forEach((id) => pendingLocalPhotoIdsRef.current.delete(id));

    // Preserve any locally created/pending photos not yet reflected in incoming cloud snapshot
    const pendingLocal = photosRef.current.filter(
      (p) => p && p.id && !deletedIds.has(p.id) && pendingLocalPhotoIdsRef.current.has(p.id) && !cloudIds.has(p.id)
    );

    const enrichedCloud = normalizedCloud.map((cp) => {
      const prevLocal = prevMap.get(cp.id);
      const imageUrl = cp.imageUrl || prevLocal?.imageUrl || '';
      return {
        ...cp,
        imageUrl,
        category: normalizePhotoCategory(cp.category),
      };
    });

    const merged = normalizePhotosList([...pendingLocal, ...enrichedCloud]);
    photosRef.current = merged;
    setPhotos(merged);
    safeSetItem('nabil_author_v4_photos', merged);
    return merged;
  };

  const mergeIncomingPosts = (incomingCloudPosts: AuthorPost[]): AuthorPost[] => {
    const deletedIds = getLocalDeletedPostIds();
    const prevMap = new Map<string, AuthorPost>();
    authorPostsRef.current.forEach((p) => {
      if (p && p.id) prevMap.set(p.id, p);
    });

    const cloudMap = new Map<string, AuthorPost>();
    incomingCloudPosts.forEach((p) => {
      if (p && p.id && !deletedIds.has(p.id)) {
        pendingLocalPostIdsRef.current.delete(p.id);
        cloudMap.set(p.id, p);
      }
    });

    const finalMap = new Map<string, AuthorPost>();

    // Preserve locally drafted pending posts not yet present in cloud snapshot
    authorPostsRef.current.forEach((p) => {
      if (p && p.id && !deletedIds.has(p.id) && pendingLocalPostIdsRef.current.has(p.id) && !cloudMap.has(p.id)) {
        finalMap.set(p.id, p);
      }
    });

    cloudMap.forEach((cp, id) => {
      const prevLocal = prevMap.get(id);
      const localLiked = getLocalPostLikeState(id);
      finalMap.set(id, {
        ...(prevLocal || {}),
        ...cp,
        imageUrl: cp.imageUrl || prevLocal?.imageUrl,
        audioUrl: cp.audioUrl || prevLocal?.audioUrl,
        isLiked: localLiked !== null ? localLiked : Boolean(prevLocal?.isLiked ?? cp.isLiked),
      });
    });

    const merged = sortCommunityPostsNewestFirst(Array.from(finalMap.values()));
    authorPostsRef.current = merged;
    setAuthorPosts(merged);
    safeSetItem('nabil_author_v4_author_posts', merged);
    return merged;
  };

  // Subscribe to real-time changes from Firebase Firestore (single stream, zero duplicate initial reads)
  useEffect(() => {
    const wasRegistryInitializedOnBoot = hasSeededNotificationRegistry();
    seedBaselineContentIds({
      books: booksRef.current,
      videos,
      photos: photosRef.current,
      news,
      announcements,
      links,
      authorPosts: authorPostsRef.current,
    });

    setCloudQuotaListener(() => {
      setIsCloudSynced(false);
      setSaveStatus('error');
      if (localStorage.getItem('isSupervisorLoggedIn') === 'true') {
        showToast('⚠️ تم استهلاك الحصة اليومية المجانية لقاعدة البيانات، تتجدد تلقائياً غداً أو بعد الترقية.');
      }
    });

    const bootedSnapshots = new Set<string>();

    // Real-time updates subscription (handles both initial hydration and live changes without polling)
    const unsubscribe = subscribeToCloudSiteData((cloudData, source) => {
      if (cloudData && Object.keys(cloudData).length > 0) {
        const isFirstSnapshotForSource = source ? !bootedSnapshots.has(source) : false;
        if (source) bootedSnapshots.add(source);
        // Only trigger notifications during initial boot if this device already had a seeded registry;
        // fresh browsers/devices silently seed baseline IDs across every first source snapshot.
        const canNotifyLive = wasRegistryInitializedOnBoot ? true : !isFirstSnapshotForSource;

        if (!canNotifyLive) {
          seedBaselineContentIds(cloudData);
        }

        if (cloudData.authorProfile) {
          setAuthorProfile((prev) => {
            const next = { ...prev, ...cloudData.authorProfile };
            safeSetItem('nabil_author_v4_profile', next);
            return next;
          });
        }
        if (cloudData.books && Array.isArray(cloudData.books) && cloudData.books.length > 0) {
          const sanitized = sanitizeBooksList(cloudData.books);
          if (canNotifyLive) notifyNewContentFromSync('book', sanitized);
          setBooks(sanitized);
          booksRef.current = sanitized;
          safeSetItem('nabil_author_v4_books', sanitized);
        }
        const liveVideos = cloudData.videos;
        if (liveVideos && Array.isArray(liveVideos)) {
          const cleanCloud = liveVideos.filter((v: any) => v && !v.url?.includes('mixkit.co'));
          if (canNotifyLive) notifyNewContentFromSync('video', cleanCloud);
          setVideos(cleanCloud);
          safeSetItem('nabil_author_v5_videos', cleanCloud);
        }
        if (cloudData.photos && Array.isArray(cloudData.photos)) {
          const mergedPhotos = mergeIncomingPhotos(cloudData.photos);
          if (canNotifyLive) notifyNewContentFromSync('photo', mergedPhotos);
        }
        if (cloudData.news && Array.isArray(cloudData.news)) {
          if (canNotifyLive) notifyNewContentFromSync('news', cloudData.news);
          setNews(cloudData.news);
          safeSetItem('nabil_author_v4_news', cloudData.news);
        }
        if (cloudData.links && Array.isArray(cloudData.links)) {
          if (canNotifyLive) notifyNewContentFromSync('link', cloudData.links);
          setLinks(cloudData.links);
          safeSetItem('nabil_author_v4_links', cloudData.links);
        }
        if (cloudData.announcements && Array.isArray(cloudData.announcements)) {
          if (canNotifyLive) notifyNewContentFromSync('announcement', cloudData.announcements);
          setAnnouncements(cloudData.announcements);
          safeSetItem('nabil_author_v4_announcements', cloudData.announcements);
        }
        if (cloudData.authorPosts && Array.isArray(cloudData.authorPosts)) {
          const mergedPosts = mergeIncomingPosts(cloudData.authorPosts);
          if (canNotifyLive) notifyNewContentFromSync('post', mergedPosts);
        }
        // Explicitly do NOT trigger push notifications for comments, replies, or visitor messages
        if (cloudData.comments && Array.isArray(cloudData.comments)) {
          setComments(cloudData.comments);
          safeSetItem('nabil_author_v4_comments', cloudData.comments);
        }
        if (cloudData.messages && Array.isArray(cloudData.messages)) {
          setMessages(cloudData.messages);
          safeSetItem('nabil_author_v4_messages', cloudData.messages);
        }
        setIsCloudSynced(true);
        isCloudHydrated.current = true;
      }
    });

    return () => {
      setCloudQuotaListener(null);
      unsubscribe();
    };
  }, []);

  // Auto-refresh configuration (local IDB keep-alive only; cloud updates arrive via live onSnapshot with zero polling cost)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    return localStorage.getItem('nabil_auto_refresh_enabled') !== 'false';
  });
  const [autoRefreshIntervalSeconds, setAutoRefreshIntervalSeconds] = useState<number>(() => {
    return parseInt(localStorage.getItem('nabil_auto_refresh_sec') || '60', 10);
  });

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('nabil_auto_refresh_enabled', next ? 'true' : 'false');
      showToast(
        next
          ? '✓ تم تفعيل التحديث التلقائي المحلي والمزامنة اللحظية دون استهلاك إضافي للسحابة'
          : 'تم إيقاف التحديث الدوري المحلي (تظل المزامنة اللحظية نشطة)'
      );
      return next;
    });
  };

  // Keep local IndexedDB hydrated periodically without issuing redundant Firestore network reads
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      loadFromIndexedDB<VideoItem[]>('nabil_author_v5_videos')
        .then((idbV) => {
          if (idbV && Array.isArray(idbV) && idbV.length > 0) {
            setVideos((prev) => (JSON.stringify(prev) !== JSON.stringify(idbV) ? idbV : prev));
          }
        })
        .catch(() => {});

      loadFromIndexedDB<Book[]>('nabil_author_v4_books')
        .then((idbB) => {
          if (idbB && Array.isArray(idbB) && idbB.length > 0) {
            const sanitized = sanitizeBooksList(idbB);
            setBooks((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
                booksRef.current = sanitized;
                return sanitized;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, Math.max(30, autoRefreshIntervalSeconds) * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshIntervalSeconds]);

  const refreshAndBypassCache = async (forceHardReload = false) => {
    showToast('جاري تحديث الصفحة وجلب أحدث البيانات المباشرة وتجاوز كاش المتصفح...');

    // 1. Delete all browser CacheStorage instances (service workers / PWA caches)
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (err) {
        console.warn('CacheStorage purge notice:', err);
      }
    }

    // 2. Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }

    // 3. Hydrate from IndexedDB first (guarantees local additions/edits are always preserved)
    try {
      const idbVideos = await loadFromIndexedDB<VideoItem[]>('nabil_author_v5_videos');
      if (idbVideos && Array.isArray(idbVideos) && idbVideos.length > 0) {
        setVideos(idbVideos);
      }
      const idbBooks = await loadFromIndexedDB<Book[]>('nabil_author_v4_books');
      if (idbBooks && Array.isArray(idbBooks) && idbBooks.length > 0) {
        setBooks(idbBooks);
        booksRef.current = idbBooks;
      }
      const idbPhotos = await loadFromIndexedDB<PhotoItem[]>('nabil_author_v4_photos');
      if (idbPhotos && Array.isArray(idbPhotos) && idbPhotos.length > 0) {
        const normalizedIdb = normalizePhotosList(idbPhotos).filter((p) => !getLocalDeletedPhotoIds().has(p.id));
        setPhotos(normalizedIdb);
        photosRef.current = normalizedIdb;
      }
      const idbPosts = await loadFromIndexedDB<AuthorPost[]>('nabil_author_v4_author_posts');
      if (idbPosts && Array.isArray(idbPosts) && idbPosts.length > 0) {
        const sortedIdbPosts = sortCommunityPostsNewestFirst(idbPosts.filter((p) => p && p.id && !getLocalDeletedPostIds().has(p.id)));
        setAuthorPosts(sortedIdbPosts);
        authorPostsRef.current = sortedIdbPosts;
      }
    } catch {
      // ignore
    }

    // 4. Fetch live Cloud Firestore data (manual explicit refresh)
    resetCloudQuotaFlag();
    try {
      const fresh = await fetchCloudSiteData();
      if (fresh && Object.keys(fresh).length > 0) {
        if (fresh.videos && Array.isArray(fresh.videos)) {
          const cleanV = fresh.videos.filter((v: any) => v && !v.url?.includes('mixkit.co'));
          setVideos(cleanV);
          safeSetItem('nabil_author_v5_videos', cleanV);
        }
        if (fresh.books && Array.isArray(fresh.books)) {
          const sanitized = sanitizeBooksList(fresh.books);
          setBooks(sanitized);
          booksRef.current = sanitized;
          safeSetItem('nabil_author_v4_books', sanitized);
        }
        if (fresh.photos && Array.isArray(fresh.photos)) {
          mergeIncomingPhotos(fresh.photos);
        }
        if (fresh.authorPosts && Array.isArray(fresh.authorPosts)) {
          mergeIncomingPosts(fresh.authorPosts);
        }
        if (fresh.news && Array.isArray(fresh.news)) {
          setNews(fresh.news);
          safeSetItem('nabil_author_v4_news', fresh.news);
        }
        if (fresh.links && Array.isArray(fresh.links)) {
          setLinks(fresh.links);
          safeSetItem('nabil_author_v4_links', fresh.links);
        }
        if (fresh.announcements && Array.isArray(fresh.announcements)) {
          setAnnouncements(fresh.announcements);
          safeSetItem('nabil_author_v4_announcements', fresh.announcements);
        }
        if (fresh.authorProfile) {
          setAuthorProfile((prev) => ({ ...prev, ...fresh.authorProfile }));
          safeSetItem('nabil_author_v4_profile', fresh.authorProfile);
        }
        setIsCloudSynced(true);
        isCloudHydrated.current = true;
      }
    } catch {
      // ignore
    }

    if (isCloudQuotaExceeded()) {
      showToast('⚠️ تم استهلاك الحصة اليومية المجانية لقاعدة البيانات، تتجدد غداً أو عبر الترقية من لوحة Firebase.');
    } else {
      showToast('✓ تم تحديث الصفحة وتجاوز الكاش بنجاح!');
    }

    if (forceHardReload && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  const syncAllToCloudNow = async () => {
    resetCloudQuotaFlag();
    try {
      showToast('جاري حفظ ومزامنة كافة بيانات وكتب ومنشورات الموقع سحابياً على Firebase...');

      // If this browser hasn't received cloud state yet, merge cloud items first so we never overwrite newer remote posts/photos
      let postsToSync = authorPostsRef.current;
      let photosToSync = photosRef.current;
      if (!isCloudHydrated.current) {
        const cloudFirst = await fetchCloudSiteData().catch(() => null);
        if (cloudFirst) {
          if (Array.isArray(cloudFirst.photos)) {
            photosToSync = mergeIncomingPhotos(cloudFirst.photos);
          }
          if (Array.isArray(cloudFirst.authorPosts)) {
            postsToSync = mergeIncomingPosts(cloudFirst.authorPosts);
          }
        }
      }

      const ok = await saveSiteDataToCloud({
        authorProfile,
        books: booksRef.current,
        videos,
        photos: photosToSync,
        news,
        links,
        announcements,
        comments,
        messages,
        authorPosts: postsToSync,
      }, true);
      if (ok) {
        setIsCloudSynced(true);
        isCloudHydrated.current = true;
        showToast('تم الحفظ السحابي بنجاح! التعديلات ظاهرة الآن لجميع زوار الموقع حول العالم.');
      } else if (isCloudQuotaExceeded()) {
        setIsCloudSynced(false);
        showToast('⚠️ تعذرت المزامنة: تم استهلاك الحصة اليومية المجانية لقاعدة البيانات، تتجدد غداً أو بعد الترقية.');
      } else {
        showToast('تعذر الحفظ السحابي لبعض العناصر، يُرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة.');
      }
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الحفظ السحابي.');
    }
  };

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
    const now = Date.now();
    const storedBlockTime = parseInt(localStorage.getItem('nabil_login_blocked_until') || '0', 10);

    // If currently blocked, prevent attempts
    if (storedBlockTime > now) {
      const remainingMinutes = Math.ceil((storedBlockTime - now) / 60000);
      return {
        success: false,
        isBlocked: true,
        remainingSeconds: Math.ceil((storedBlockTime - now) / 1000),
        error: `⛔ تم حظر تسجيل الدخول مؤقتاً لتكرار إدخال كلمة المرور بشكل خاطئ (3 محاولات فاشلة). يُرجى الانتظار ${remainingMinutes} دقيقة لحين انتهاء الحظر الأمني.`,
      };
    }

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (cleanUser === 'thrayanabil2026@gmail.com' && cleanPass === 'Tr@7177') {
      setIsAuthorMode(true);
      setIsVisitorPreviewMode(false);
      localStorage.setItem('isSupervisorLoggedIn', 'true');
      localStorage.removeItem('nabil_login_failed_attempts');
      localStorage.removeItem('nabil_login_blocked_until');
      setIsLoginModalOpen(false);
      showToast('مرحباً بك يا أ. نبيل بركات.. تم تسجيل دخول المشرف بنجاح');
      return { success: true };
    } else {
      const currentAttempts = parseInt(localStorage.getItem('nabil_login_failed_attempts') || '0', 10);
      const newAttempts = currentAttempts + 1;
      localStorage.setItem('nabil_login_failed_attempts', String(newAttempts));

      if (newAttempts === 1) {
        return {
          success: false,
          attempts: 1,
          isBlocked: false,
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة. (المحاولة الأولى من 3)',
        };
      } else if (newAttempts === 2) {
        return {
          success: false,
          attempts: 2,
          isBlocked: false,
          error: '⚠️ تنبيه أمني عاجل: كلمة المرور غير صحيحة (المحاولة 2 من 3). سيتم حظرك ومنع تسجيل الدخول بعد المحاولة الثالثة مباشرة!',
        };
      } else {
        // Block user for 15 minutes after 3rd attempt
        const blockDurationMs = 15 * 60 * 1000;
        const blockUntil = now + blockDurationMs;
        localStorage.setItem('nabil_login_blocked_until', String(blockUntil));
        return {
          success: false,
          attempts: 3,
          isBlocked: true,
          remainingSeconds: 15 * 60,
          error: '⛔ تم حظرك تلقائياً ومنع تسجيل الدخول بعد المحاولة الثالثة الخاطئة! تم قفل النظام لحماية لوحة التحكم لمدة 15 دقيقة.',
        };
      }
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
    targetType: 'general' | 'book' | 'video' | 'photo' | 'news' | 'post';
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
    targetType: 'general' | 'book' | 'video' | 'photo' | 'news' | 'post';
    targetId?: string;
    targetTitle?: string;
  }) => {
    setCommentModalTarget(target);
  };

  const closeCommentModal = () => {
    setCommentModalTarget(null);
  };

  const updateAuthorHeaderPhoto = async (headerBannerImage: string, portraitImage?: string) => {
    const optimizedBanner = headerBannerImage ? await compressImage(headerBannerImage, 1200, 700, 0.75) : '';
    const optimizedPortrait = portraitImage ? await compressImage(portraitImage, 600, 600, 0.75) : undefined;
    setAuthorProfile((prev) => {
      const next = {
        ...prev,
        headerBannerImage: optimizedBanner,
        portraitImage: optimizedPortrait || prev.portraitImage,
      };
      safeSetItem('nabil_author_v4_profile', next);
      saveSiteDataToCloud({ authorProfile: next }, true);
      return next;
    });
    showToast('تم تحديث صورة وبيانات الهيدر وحفظها سحابياً!');
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
    setAuthorProfile((prev) => {
      const next = { ...prev, ...profile };
      safeSetItem('nabil_author_v4_profile', next);
      executeCloudSave({ authorProfile: next }, 'تم حفظ وتحديث البيانات الشخصية للكاتب سحابياً بنجاح', 'بيانات الكاتب');
      return next;
    });
  };

  // Helper: Ensures any image from books is automatically synchronized into the Photo Gallery
  const ensureBookImageInGallery = (bookTitle: string, imageUrl: string, syncCloud = false) => {
    if (!imageUrl || imageUrl.includes('book_reality_dream') || isVideoMedia(imageUrl)) return;
    if (photosRef.current.some((p) => p.imageUrl === imageUrl)) return;

    const newPhotoItem: PhotoItem = {
      id: `photo-book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `غلاف/مؤلف: ${bookTitle}`,
      caption: `صورة غلاف / مرفق كتاب «${bookTitle}» - للكاتب أ. نبيل بركات`,
      imageUrl,
      category: 'المؤلفات والكتب',
      location: 'مكتبة المؤلفات الأدبية',
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      isPinned: false,
      mediaType: 'image',
    };

    const nextPhotos = normalizePhotosList([newPhotoItem, ...photosRef.current]);
    pendingLocalPhotoIdsRef.current.add(newPhotoItem.id);
    photosRef.current = nextPhotos;
    setPhotos(nextPhotos);
    safeSetItem('nabil_author_v4_photos', nextPhotos);
    if (syncCloud) {
      executeCloudSave({ photos: nextPhotos }, 'تم حفظ وتضمين صورة الغلاف في المعرض سحابياً', 'معرض الصور').then((ok) => {
        if (ok) pendingLocalPhotoIdsRef.current.delete(newPhotoItem.id);
      });
    }
  };

  // Visual upload helper with progress, cloud storage, and copyable link generation
  const processAndUploadImage = async (
    file: File,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      category?: string;
      contextTitle?: string;
      bookId?: string;
    }
  ): Promise<string> => {
    let currentFileName = file.name || 'image.jpg';

    setUploadStatus({
      isUploading: true,
      progress: 20,
      fileName: currentFileName,
      stage: 'processing',
      stageText: 'جاري تهيئة الصورة وتسميتها سحابياً بحسب تاريخ اليوم...',
      resultUrl: null,
    });

    try {
      const targetFolder =
        options?.category === 'منشورات الكاتب'
          ? 'community'
          : options?.bookId || options?.category === 'المؤلفات والكتب'
          ? 'books'
          : 'photos';

      const uploadResult = await uploadImageToCloud(
        file,
        targetFolder,
        (progress, stageText) => {
          setUploadStatus((prev) => ({
            isUploading: progress < 100,
            progress,
            fileName: prev?.fileName || currentFileName,
            stage: progress < 100 ? 'saving_cloud' : 'completed',
            stageText,
            resultUrl: prev?.resultUrl || null,
          }));
        },
        {
          maxWidth: options?.maxWidth,
          maxHeight: options?.maxHeight,
          quality: options?.quality,
          maxDataUrlLength: 220_000,
        }
      );

      const finalUrl = uploadResult.url;
      const finalFileName = uploadResult.fileName;
      const finalDisplayName = uploadResult.displayName;

      const isBookRelated =
        options?.bookId || options?.category === 'المؤلفات والكتب' || options?.contextTitle?.includes('كتاب');
      if (isBookRelated && !options?.contextTitle?.includes('غلاف')) {
        ensureBookImageInGallery(options?.contextTitle || `مؤلف: ${finalDisplayName}`, finalUrl, false);
      }

      setUploadStatus({
        isUploading: false,
        progress: 100,
        fileName: finalFileName,
        stage: 'completed',
        stageText: `اكتمل الرفع والحفظ السحابي بنجاح! الاسم السحابي: ${finalDisplayName}`,
        resultUrl: finalUrl,
      });

      showToast(`تم رفع الصورة وحفظها سحابياً باسم «${finalDisplayName}»`);
      return finalUrl;
    } catch (err) {
      console.error('processAndUploadImage error:', err);
      setUploadStatus({
        isUploading: false,
        progress: 0,
        fileName: currentFileName,
        stage: 'error',
        stageText: 'تعذر رفع أو معالجة الصورة، يرجى المحاولة مجدداً.',
        resultUrl: null,
      });
      showToast('تعذر رفع أو معالجة الصورة');
      throw err;
    }
  };

  // Visual video upload helper with live network upload progress to server
  const processAndUploadVideo = async (
    file: File,
    options?: {
      contextTitle?: string;
      bookId?: string;
    }
  ): Promise<string> => {
    const currentFileName = file.name || 'video.mp4';
    const totalMb = (file.size / (1024 * 1024)).toFixed(1);

    if (file.size > 150 * 1024 * 1024) {
      showToast('حجم ملف الفيديو يتجاوز الحد الأقصى (150 ميجابايت)');
      throw new Error('حجم ملف الفيديو يتجاوز 150 ميجابايت');
    }

    setUploadStatus({
      isUploading: true,
      progress: 5,
      fileName: currentFileName,
      stage: 'processing',
      stageText: `بدء تهيئة الرفع الفعلي لملف الفيديو (${totalMb} ميجابايت)...`,
      resultUrl: null,
    });

    try {
      const uploadResult = await uploadVideoToServer(file, (progress, stageText) => {
        setUploadStatus({
          isUploading: progress < 100,
          progress,
          fileName: currentFileName,
          stage: progress < 100 ? 'saving_cloud' : 'completed',
          stageText,
          resultUrl: null,
        });
      });

      const finalUrl = uploadResult.url;
      const finalFileName = uploadResult.fileName;

      setUploadStatus({
        isUploading: false,
        progress: 100,
        fileName: finalFileName,
        stage: 'completed',
        stageText: `✓ اكتمل رفع وحفظ الفيديو سحابياً بنجاح! (${uploadResult.sizeMb} ميجابايت)`,
        resultUrl: finalUrl,
      });

      showToast(`تم رفع وحفظ ملف الفيديو بنجاح (${uploadResult.sizeMb} ميجابايت)`);
      return finalUrl;
    } catch (err: any) {
      console.error('processAndUploadVideo error:', err);
      setUploadStatus({
        isUploading: false,
        progress: 0,
        fileName: currentFileName,
        stage: 'error',
        stageText: err?.message || 'تعذر رفع ملف الفيديو، يرجى التحقق من اتصال الإنترنت.',
        resultUrl: null,
      });
      showToast(err?.message || 'فشل رفع ملف الفيديو');
      throw err;
    }
  };

  // Books
  const addBook = async (bookData: Omit<Book, 'id' | 'comments'>) => {
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}`,
      comments: [],
    };
    const nextBooksList = [newBook, ...booksRef.current];
    booksRef.current = nextBooksList;
    setBooks(nextBooksList);
    safeSetItem('nabil_author_v4_books', nextBooksList);

    if (newBook.coverImage) {
      ensureBookImageInGallery(newBook.title, newBook.coverImage);
    }
    notifySingleNewContent('book', newBook);
    await executeCloudSave({ books: nextBooksList }, 'تمت إضافة الكتاب الجديد وحفظه سحابياً بنجاح', 'الكتاب الجديد');
  };

  const updateBook = async (id: string, updated: Partial<Book>) => {
    const currentBooks = booksRef.current;
    const nextBooksList = currentBooks.map((b) => (b.id === id ? { ...b, ...updated } : b));
    booksRef.current = nextBooksList;
    setBooks(nextBooksList);
    safeSetItem('nabil_author_v4_books', nextBooksList);

    const target = currentBooks.find((b) => b.id === id);
    const title = updated.title || target?.title || 'أحد المؤلفات';
    if (updated.coverImage) {
      ensureBookImageInGallery(title, updated.coverImage, false);
    }
    if (updated.galleryImages) {
      updated.galleryImages.forEach((img) => {
        if (!isVideoMedia(img)) ensureBookImageInGallery(title, img, false);
      });
    }
    await executeCloudSave({ books: nextBooksList }, `تم حفظ تعديلات كتاب «${title}» في قاعدة البيانات السحابية بنجاح`, `تعديلات «${title}»`);
  };

  const deleteBook = async (id: string) => {
    if (id === 'book-5') {
      try {
        localStorage.setItem('nabil_deleted_book5_poetry_v1', 'true');
      } catch {}
    }
    const nextBooksList = booksRef.current.filter((b) => b.id !== id);
    booksRef.current = nextBooksList;
    setBooks(nextBooksList);
    safeSetItem('nabil_author_v4_books', nextBooksList);
    await executeCloudSave({ books: nextBooksList }, 'تم حذف الكتاب وتحديث قاعدة البيانات السحابية بنجاح', 'حذف الكتاب');
  };

  const setBookPdf = (bookId: string, pdfUrl: string, pdfFileName?: string) => {
    updateBook(bookId, { pdfUrl, pdfFileName });
    showToast('تم إرفاق وتحديث ملف PDF للكتاب بنجاح');
  };

  const setBookCover = async (bookId: string, coverImage: string) => {
    const currentBooks = booksRef.current;
    const targetBook = currentBooks.find((b) => b.id === bookId);
    const bookTitle = targetBook ? targetBook.title : 'أحد المؤلفات';

    const nextBooksList = currentBooks.map((b) => {
      if (b.id !== bookId) return b;
      // Filter out duplicate coverImage from galleryImages so it is not duplicated in document
      const cleanedGallery = (b.galleryImages || []).filter(
        (img) => img !== coverImage && !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
      );
      return {
        ...b,
        coverImage,
        galleryImages: cleanedGallery,
      };
    });

    booksRef.current = nextBooksList;
    setBooks(nextBooksList);
    safeSetItem('nabil_author_v4_books', nextBooksList);

    ensureBookImageInGallery(bookTitle, coverImage, false);
    await executeCloudSave(
      { books: nextBooksList },
      `تم اعتماد وتحديث غلاف رواية «${bookTitle}» سحابياً بنجاح`,
      `غلاف رواية «${bookTitle}»`
    );
  };

  const deleteBookGalleryImage = async (bookId: string, imageIndex: number) => {
    const currentBooks = booksRef.current;
    const nextBooksList = currentBooks.map((b) => {
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

    booksRef.current = nextBooksList;
    setBooks(nextBooksList);
    safeSetItem('nabil_author_v4_books', nextBooksList);
    await saveSiteDataToCloud({ books: nextBooksList }, true);
    showToast('تم حذف العنصر من معرض الكتاب بنجاح');
  };

  const addBookGalleryImage = async (bookId: string, mediaUrl: string) => {
    if (!mediaUrl) return;
    const currentBooks = booksRef.current;
    const targetBook = currentBooks.find((b) => b.id === bookId);
    const bookTitle = targetBook ? targetBook.title : 'أحد المؤلفات';
    const isVideo = isVideoMedia(mediaUrl);

    const nextBooksList = currentBooks.map((b) => {
      if (b.id !== bookId) return b;
      const current = (b.galleryImages || []).filter(
        (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
      );
      if (current.includes(mediaUrl)) return b;
      return {
        ...b,
        galleryImages: [...current, mediaUrl],
      };
    });

    booksRef.current = nextBooksList;
    setBooks(nextBooksList);
    safeSetItem('nabil_author_v4_books', nextBooksList);

    if (!isVideo) {
      ensureBookImageInGallery(bookTitle, mediaUrl);
    }
    await saveSiteDataToCloud({ books: nextBooksList }, true);
    showToast(
      isVideo
        ? 'تمت إضافة الفيديو إلى معرض الكتاب وحفظه سحابياً'
        : 'تمت إضافة الصورة إلى معرض الكتاب وحفظها سحابياً وفي المعرض'
    );
  };

  const addBookComment = (bookId: string, commentData: Omit<BookComment, 'id' | 'date'>) => {
    const newComment: BookComment = {
      ...commentData,
      id: `bc-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    const next = booksRef.current.map((b) =>
      b.id === bookId ? { ...b, comments: [newComment, ...(b.comments || [])] } : b
    );
    booksRef.current = next;
    setBooks(next);
    safeSetItem('nabil_author_v4_books', next);
    saveSiteDataToCloud({ books: next }, true);
    showToast('شكراً لك! تم نشر تعليقك ومراجعتك للكتاب');
  };

  const deleteBookComment = (bookId: string, commentId: string) => {
    const next = booksRef.current.map((b) =>
      b.id === bookId ? { ...b, comments: (b.comments || []).filter((c) => c.id !== commentId) } : b
    );
    booksRef.current = next;
    setBooks(next);
    safeSetItem('nabil_author_v4_books', next);
    saveSiteDataToCloud({ books: next }, true);
    showToast('تم حذف التعليق من الكتاب بنجاح');
  };

  const togglePinBook = (id: string) => {
    const prev = booksRef.current;
    const idx = prev.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const target = prev[idx];
    const isNowPinned = !target.isPinned;
    const updated = { ...target, isPinned: isNowPinned };
    const rest = prev.filter((b) => b.id !== id);
    const next = isNowPinned ? [updated, ...rest] : [...rest, updated];
    booksRef.current = next;
    setBooks(next);
    safeSetItem('nabil_author_v4_books', next);
    saveSiteDataToCloud({ books: next }, true);
    showToast(isNowPinned ? `تم تثبيت كتاب "${target.title}" في المقدمة 📌` : `تم إلغاء تثبيت كتاب "${target.title}"`);
  };

  const moveBookOrder = (id: string, direction: 'up' | 'down') => {
    const prev = booksRef.current;
    const idx = prev.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= prev.length) return;
    const next = [...prev];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    booksRef.current = next;
    setBooks(next);
    safeSetItem('nabil_author_v4_books', next);
    saveSiteDataToCloud({ books: next }, true);
    showToast(`تم تغيير ترتيب "${temp.title}" إلى المركز (${targetIdx + 1})`);
  };

  const setBookPosition = (id: string, newPosition: number) => {
    const prev = booksRef.current;
    const idx = prev.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const targetIdx = Math.max(0, Math.min(prev.length - 1, newPosition - 1));
    if (targetIdx === idx) return;
    const next = [...prev];
    const [item] = next.splice(idx, 1);
    next.splice(targetIdx, 0, item);
    booksRef.current = next;
    setBooks(next);
    safeSetItem('nabil_author_v4_books', next);
    saveSiteDataToCloud({ books: next }, true);
    showToast(`تم تغيير ترتيب "${item.title}" ليصبح في المركز (${targetIdx + 1})`);
  };

  // Videos
  const addVideo = (videoData: Omit<VideoItem, 'id' | 'date'>) => {
    const rawUrl = (videoData.url || '').trim();
    const parsed = parseVideoUrl(rawUrl);
    const cleanUrl = parsed.cleanUrl || rawUrl;
    const isStream = parsed.platform === 'youtube' || parsed.platform === 'vimeo' || parsed.platform === 'tiktok' || parsed.platform === 'drive';

    const newVideo: VideoItem = {
      ...videoData,
      url: cleanUrl,
      videoFileUrl: isStream ? undefined : videoData.videoFileUrl,
      platform: parsed.platform !== 'unknown' ? parsed.platform : (videoData.platform || 'direct'),
      id: `vid-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    setVideos((prev) => {
      const next = [newVideo, ...prev.filter((v) => v.id !== newVideo.id)];
      safeSetItem('nabil_author_v5_videos', next);
      executeCloudSave({ videos: next }, 'تم حفظ وتثبيت الفيديو سحابياً', 'الفيديو');
      return next;
    });
    notifySingleNewContent('video', newVideo);
  };

  const updateVideo = (id: string, updated: Partial<VideoItem>) => {
    let nextUpdated = { ...updated };
    if (updated.url) {
      const parsed = parseVideoUrl(updated.url);
      const isStream = parsed.platform === 'youtube' || parsed.platform === 'vimeo' || parsed.platform === 'tiktok' || parsed.platform === 'drive';
      nextUpdated.url = parsed.cleanUrl || updated.url;
      if (parsed.platform !== 'unknown') {
        nextUpdated.platform = parsed.platform;
      }
      if (isStream) {
        nextUpdated.videoFileUrl = undefined;
      }
    }

    setVideos((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, ...nextUpdated } : v));
      safeSetItem('nabil_author_v5_videos', next);
      executeCloudSave({ videos: next }, 'تم تحديث بيانات الفيديو وحفظها سحابياً', 'تعديل الفيديو');
      return next;
    });
  };

  const deleteVideo = (id: string) => {
    setVideos((prev) => {
      const next = prev.filter((v) => v.id !== id);
      safeSetItem('nabil_author_v5_videos', next);
      executeCloudSave({ videos: next }, 'تم إزالة الفيديو وتحديث السحابة', 'حذف الفيديو');
      return next;
    });
  };

  const togglePinVideo = (id: string) => {
    setVideos((prev) => {
      const idx = prev.findIndex((v) => v.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const isNowPinned = !target.isPinned;
      const updated = { ...target, isPinned: isNowPinned };
      const rest = prev.filter((b) => b.id !== id);
      const next = isNowPinned ? [updated, ...rest] : [...rest, updated];
      safeSetItem('nabil_author_v5_videos', next);
      safeSetItem('nabil_author_v4_videos', next);
      executeCloudSave({ videos: next }, isNowPinned ? `تم تثبيت مقطع الفيديو في المقدمة 📌` : `تم إلغاء تثبيت مقطع الفيديو`);
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
      safeSetItem('nabil_author_v5_videos', next);
      safeSetItem('nabil_author_v4_videos', next);
      executeCloudSave({ videos: next }, `تم تغيير ترتيب الفيديو إلى المركز (${targetIdx + 1})`);
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
      safeSetItem('nabil_author_v5_videos', next);
      safeSetItem('nabil_author_v4_videos', next);
      executeCloudSave({ videos: next }, `تم تغيير ترتيب الفيديو ليصبح في المركز (${targetIdx + 1})`);
      return next;
    });
  };

  // Photos
  const addPhoto = async (photoData: Omit<PhotoItem, 'id'>): Promise<boolean> => {
    let optimizedUrl = photoData.imageUrl;
    if (optimizedUrl && optimizedUrl.startsWith('data:image/')) {
      optimizedUrl = await compressImage(optimizedUrl, 900, 1100, 0.78, 220_000);
    }
    const newPhoto: PhotoItem = {
      ...photoData,
      category: normalizePhotoCategory(photoData.category),
      imageUrl: optimizedUrl,
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    pendingLocalPhotoIdsRef.current.add(newPhoto.id);
    const next = normalizePhotosList([newPhoto, ...photosRef.current]);
    photosRef.current = next;
    setPhotos(next);
    safeSetItem('nabil_author_v4_photos', next);

    const saved = await executeCloudSave({ photos: next }, 'تمت إضافة الصورة إلى الألبوم وحفظها سحابياً', 'الصورة');
    if (saved) {
      pendingLocalPhotoIdsRef.current.delete(newPhoto.id);
      notifySingleNewContent('photo', newPhoto);
    }
    return saved;
  };

  const updatePhoto = async (id: string, updated: Partial<PhotoItem>): Promise<boolean> => {
    const normalizedUpdated: Partial<PhotoItem> = {
      ...updated,
      ...(updated.category !== undefined ? { category: normalizePhotoCategory(updated.category) } : {}),
    };
    if (normalizedUpdated.imageUrl && normalizedUpdated.imageUrl.startsWith('data:image/')) {
      normalizedUpdated.imageUrl = await compressImage(normalizedUpdated.imageUrl, 900, 1100, 0.78, 220_000);
    }
    pendingLocalPhotoIdsRef.current.add(id);
    const next = normalizePhotosList(photosRef.current.map((p) => (p.id === id ? { ...p, ...normalizedUpdated } : p)));
    photosRef.current = next;
    setPhotos(next);
    safeSetItem('nabil_author_v4_photos', next);
    const saved = await executeCloudSave({ photos: next }, 'تم تحديث بيانات الصورة وحفظها سحابياً', 'تعديل الصورة');
    if (saved) pendingLocalPhotoIdsRef.current.delete(id);
    return saved;
  };

  const deletePhoto = async (id: string): Promise<boolean> => {
    pendingLocalPhotoIdsRef.current.delete(id);
    await deletePhotoFromCloud(id);
    const next = normalizePhotosList(photosRef.current.filter((p) => p.id !== id));
    photosRef.current = next;
    setPhotos(next);
    safeSetItem('nabil_author_v4_photos', next);
    return executeCloudSave({ photos: next }, 'تم حذف الصورة من الألبوم وتحديث السحابة', 'حذف الصورة');
  };

  const togglePinPhoto = (id: string) => {
    const prev = photosRef.current;
    const idx = prev.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const target = prev[idx];
    const isNowPinned = !target.isPinned;
    const updated = { ...target, isPinned: isNowPinned };
    const rest = prev.filter((p) => p.id !== id);
    const next = normalizePhotosList(isNowPinned ? [updated, ...rest] : [...rest, updated]);
    photosRef.current = next;
    setPhotos(next);
    safeSetItem('nabil_author_v4_photos', next);
    executeCloudSave({ photos: next }, isNowPinned ? `تم تثبيت الصورة في المقدمة 📌` : `تم إلغاء تثبيت الصورة`);
  };

  const movePhotoOrder = (id: string, direction: 'up' | 'down') => {
    const prev = photosRef.current;
    const idx = prev.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= prev.length) return;
    const next = [...prev];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    photosRef.current = next;
    setPhotos(next);
    safeSetItem('nabil_author_v4_photos', next);
    executeCloudSave({ photos: next }, `تم تغيير ترتيب الصورة إلى المركز (${targetIdx + 1})`);
  };

  const setPhotoPosition = (id: string, newPosition: number) => {
    const prev = photosRef.current;
    const idx = prev.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const targetIdx = Math.max(0, Math.min(prev.length - 1, newPosition - 1));
    if (targetIdx === idx) return;
    const next = [...prev];
    const [item] = next.splice(idx, 1);
    next.splice(targetIdx, 0, item);
    photosRef.current = next;
    setPhotos(next);
    safeSetItem('nabil_author_v4_photos', next);
    executeCloudSave({ photos: next }, `تم تغيير ترتيب الصورة ليصبح في المركز (${targetIdx + 1})`);
  };

  // News
  const addNews = (newsData: Omit<NewsItem, 'id' | 'date'>) => {
    const newItem: NewsItem = {
      ...newsData,
      id: `n-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    setNews((prev) => {
      const next = [newItem, ...prev];
      safeSetItem('nabil_author_v4_news', next);
      executeCloudSave({ news: next }, 'تم نشر وحفظ المقال أو الخبر سحابياً بنجاح', 'الخبر الأدبي');
      return next;
    });
    notifySingleNewContent('news', newItem);
  };

  const updateNews = (id: string, updated: Partial<NewsItem>) => {
    setNews((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...updated } : n));
      safeSetItem('nabil_author_v4_news', next);
      executeCloudSave({ news: next }, 'تم حفظ وتحديث المقال الأدبي سحابياً بنجاح', 'تعديل الخبر');
      return next;
    });
  };

  const deleteNews = (id: string) => {
    setNews((prev) => {
      const next = prev.filter((n) => n.id !== id);
      safeSetItem('nabil_author_v4_news', next);
      executeCloudSave({ news: next }, 'تم حذف المقال الأدبي وتحديث السحابة', 'حذف الخبر');
      return next;
    });
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
      safeSetItem('nabil_author_v4_news', next);
      executeCloudSave({ news: next }, isNowPinned ? `تم تثبيت الخبر في المقدمة 📌` : `تم إلغاء تثبيت الخبر`);
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
      safeSetItem('nabil_author_v4_news', next);
      executeCloudSave({ news: next }, `تم تغيير ترتيب الخبر إلى المركز (${targetIdx + 1})`);
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
      safeSetItem('nabil_author_v4_news', next);
      executeCloudSave({ news: next }, `تم تغيير ترتيب الخبر ليصبح في المركز (${targetIdx + 1})`);
      return next;
    });
  };

  // Links
  const addLink = (linkData: Omit<LinkItem, 'id'>) => {
    const newLink: LinkItem = {
      ...linkData,
      id: `l-${Date.now()}`,
    };
    setLinks((prev) => {
      const next = [newLink, ...prev];
      safeSetItem('nabil_author_v4_links', next);
      executeCloudSave({ links: next }, 'تمت إضافة الرابط وحفظه سحابياً بنجاح', 'الرابط الجديد');
      return next;
    });
    notifySingleNewContent('link', newLink);
  };

  const updateLink = (id: string, updated: Partial<LinkItem>) => {
    setLinks((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...updated } : l));
      safeSetItem('nabil_author_v4_links', next);
      executeCloudSave({ links: next }, 'تم تحديث الرابط وحفظه سحابياً', 'تعديل الرابط');
      return next;
    });
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id);
      safeSetItem('nabil_author_v4_links', next);
      executeCloudSave({ links: next }, 'تم حذف الرابط وتحديث السحابة', 'حذف الرابط');
      return next;
    });
  };

  // Announcements
  const addAnnouncement = (itemData: Omit<AnnouncementItem, 'id'>) => {
    const newItem: AnnouncementItem = {
      ...itemData,
      id: `ann-${Date.now()}`,
    };
    setAnnouncements((prev) => {
      const next = [newItem, ...prev];
      safeSetItem('nabil_author_v4_announcements', next);
      executeCloudSave({ announcements: next }, 'تم نشر الإعلان الجديد وحفظه سحابياً', 'الإعلان');
      return next;
    });
    notifySingleNewContent('announcement', newItem);
  };

  const updateAnnouncement = (id: string, updated: Partial<AnnouncementItem>) => {
    setAnnouncements((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updated } : a));
      safeSetItem('nabil_author_v4_announcements', next);
      executeCloudSave({ announcements: next }, 'تم حفظ تعديلات الإعلان سحابياً', 'تعديل الإعلان');
      return next;
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => {
      const next = prev.filter((a) => a.id !== id);
      safeSetItem('nabil_author_v4_announcements', next);
      executeCloudSave({ announcements: next }, 'تم حذف الإعلان وتحديث السحابة', 'حذف الإعلان');
      return next;
    });
  };

  const toggleAnnouncementActive = (id: string) => {
    setAnnouncements((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
      safeSetItem('nabil_author_v4_announcements', next);
      executeCloudSave({ announcements: next }, 'تم تغيير حالة تفعيل الإعلان سحابياً', 'حالة الإعلان');
      return next;
    });
  };

  // Messages (never trigger browser push notifications per author preference)
  const sendMessage = (msgData: Omit<VisitorMessage, 'id' | 'date' | 'status'>) => {
    const newMsg: VisitorMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'unread',
    };
    setMessages((prev) => {
      const next: VisitorMessage[] = [newMsg, ...prev];
      safeSetItem('nabil_author_v4_messages', next);
      void saveSiteDataToCloud({ messages: next });
      return next;
    });
    showToast('تم إرسال رسالتك بأمان إلى الأستاذ نبيل بركات. شكراً لاهتمامك ومراسلتك.');
  };

  const markMessageRead = (id: string) => {
    setMessages((prev) => {
      const next: VisitorMessage[] = prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'unread' ? ('read' as const) : m.status } : m
      );
      safeSetItem('nabil_author_v4_messages', next);
      void saveSiteDataToCloud({ messages: next });
      return next;
    });
  };

  const replyToMessage = (id: string, reply: string) => {
    setMessages((prev) => {
      const next: VisitorMessage[] = prev.map((m) =>
        m.id === id ? { ...m, authorReply: reply, status: 'replied' as const } : m
      );
      safeSetItem('nabil_author_v4_messages', next);
      void saveSiteDataToCloud({ messages: next });
      return next;
    });
    showToast('تم تسجيل رد الكاتب وإرساله');
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => {
      const next: VisitorMessage[] = prev.filter((m) => m.id !== id);
      safeSetItem('nabil_author_v4_messages', next);
      void saveSiteDataToCloud({ messages: next });
      return next;
    });
    showToast('تم حذف الرسالة من صندوق الوارد');
  };

  // Comments (never trigger browser push notifications per author preference)
  const addVisitorComment = (commentData: Omit<VisitorComment, 'id' | 'date' | 'isApproved' | 'status'>) => {
    const newCom: VisitorComment = {
      ...commentData,
      id: `vcom-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      isApproved: false, // Subject to approval before publishing!
      status: 'pending',
      likesCount: 0,
    };
    setComments((prev) => {
      const next: VisitorComment[] = [newCom, ...prev];
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
    showToast('تم استلام تعليقك بنجاح! سيتم نشره فور مراجعته واعتماده من قبل أ. نبيل بركات.');
  };

  const approveComment = (id: string) => {
    setComments((prev) => {
      const next: VisitorComment[] = prev.map((c) =>
        c.id === id ? { ...c, isApproved: true, status: 'approved' as const } : c
      );
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
    showToast('تم اعتماد ونشر التعليق بنجاح');
  };

  const rejectComment = (id: string) => {
    setComments((prev) => {
      const next: VisitorComment[] = prev.filter((c) => c.id !== id);
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
    showToast('تم رفض وحذف التعليق بنجاح');
  };

  const toggleCommentApproval = (id: string) => {
    setComments((prev) => {
      const next: VisitorComment[] = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isApproved: !c.isApproved,
              status: !c.isApproved ? ('approved' as const) : ('pending' as const),
            }
          : c
      );
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
  };

  const likeComment = (id: string) => {
    setComments((prev) => {
      const next: VisitorComment[] = prev.map((c) =>
        c.id === id ? { ...c, likesCount: (c.likesCount || 0) + 1 } : c
      );
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
  };

  const replyToVisitorComment = (id: string, reply: string) => {
    setComments((prev) => {
      const next: VisitorComment[] = prev.map((c) =>
        c.id === id ? { ...c, authorReply: reply } : c
      );
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
    showToast('تم حفظ رد الكاتب على التعليق');
  };

  const deleteVisitorComment = (id: string) => {
    setComments((prev) => {
      const next: VisitorComment[] = prev.filter((c) => c.id !== id);
      safeSetItem('nabil_author_v4_comments', next);
      void saveSiteDataToCloud({ comments: next });
      return next;
    });
    showToast('تم حذف التعليق');
  };

  // Author Posts (مجتمع الكاتب والقصائد الأدبية)
  const addAuthorPost = async (postData: Omit<AuthorPost, 'id' | 'date'>): Promise<boolean> => {
    const nowMs = Date.now();
    const initialStats = generateInitialCommunityPostStats();
    const viewsCount =
      typeof postData.viewsCount === 'number' && postData.viewsCount >= 50
        ? postData.viewsCount
        : initialStats.viewsCount;
    const likesCount =
      typeof postData.likesCount === 'number' && postData.likesCount >= 50
        ? postData.likesCount
        : initialStats.likesCount;

    let optimizedImageUrl = postData.imageUrl;
    if (optimizedImageUrl && optimizedImageUrl.startsWith('data:image/')) {
      optimizedImageUrl = await compressImage(optimizedImageUrl, 900, 1100, 0.78, 220_000);
    }

    const newPost: AuthorPost = {
      ...postData,
      imageUrl: optimizedImageUrl,
      id: `post-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: nowMs,
      date: new Date(nowMs).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      viewsCount,
      likesCount,
      isLiked: false,
    };

    pendingLocalPostIdsRef.current.add(newPost.id);
    const next = sortCommunityPostsNewestFirst([newPost, ...authorPostsRef.current]);
    authorPostsRef.current = next;
    setAuthorPosts(next);
    safeSetItem('nabil_author_v4_author_posts', next);

    const saved = await executeCloudSave(
      { authorPosts: next },
      'تم نشر المنشور في قسم المجتمع وحفظه سحابياً لجميع القراء ✓',
      'منشور المجتمع'
    );
    if (saved) {
      pendingLocalPostIdsRef.current.delete(newPost.id);
      notifySingleNewContent('post', newPost);
    }
    return saved;
  };

  const updateAuthorPost = async (id: string, updated: Partial<AuthorPost>): Promise<boolean> => {
    const nextUpdated = { ...updated };
    if (nextUpdated.imageUrl && nextUpdated.imageUrl.startsWith('data:image/')) {
      nextUpdated.imageUrl = await compressImage(nextUpdated.imageUrl, 900, 1100, 0.78, 220_000);
    }
    pendingLocalPostIdsRef.current.add(id);
    const next = sortCommunityPostsNewestFirst(
      authorPostsRef.current.map((p) => (p.id === id ? { ...p, ...nextUpdated } : p))
    );
    authorPostsRef.current = next;
    setAuthorPosts(next);
    safeSetItem('nabil_author_v4_author_posts', next);
    const saved = await executeCloudSave({ authorPosts: next }, 'تم تحديث المنشور في قسم المجتمع سحابياً', 'تعديل منشور المجتمع');
    if (saved) pendingLocalPostIdsRef.current.delete(id);
    return saved;
  };

  const deleteAuthorPost = async (id: string): Promise<boolean> => {
    pendingLocalPostIdsRef.current.delete(id);
    await deleteCommunityPostFromCloud(id);
    const next = sortCommunityPostsNewestFirst(authorPostsRef.current.filter((p) => p.id !== id));
    authorPostsRef.current = next;
    setAuthorPosts(next);
    safeSetItem('nabil_author_v4_author_posts', next);
    return executeCloudSave({ authorPosts: next }, 'تم حذف المنشور وتحديث السحابة', 'حذف المنشور');
  };

  const viewSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingViewPostIdsRef = React.useRef<Set<string>>(new Set());

  const toggleLikeAuthorPost = (id: string, forceLike?: boolean): boolean => {
    const prev = authorPostsRef.current;
    const target = prev.find((p) => p.id === id);
    if (!target) return true;

    const currentLiked = Boolean(target.isLiked);
    const isLikedNow = forceLike ? true : !currentLiked;

    // If double-tapping an already-liked post, keep the heart filled without altering count
    if (forceLike && currentLiked) {
      setLocalPostLikeState(id, true);
      return true;
    }

    setLocalPostLikeState(id, isLikedNow);

    let updatedLikesCount: number | undefined;
    const next = prev.map((p) => {
      if (p.id === id) {
        const computed = getCommunityPostStats(p);
        const currentCount = typeof p.likesCount === 'number' && p.likesCount >= 50 ? p.likesCount : computed.baseLikes;
        const currentViews = typeof p.viewsCount === 'number' && p.viewsCount >= 50 ? p.viewsCount : computed.baseViews;
        updatedLikesCount = isLikedNow ? currentCount + 1 : Math.max(50, currentCount - 1);
        return {
          ...p,
          isLiked: isLikedNow,
          viewsCount: currentViews,
          likesCount: updatedLikesCount,
        };
      }
      return p;
    });
    authorPostsRef.current = next;
    setAuthorPosts(next);
    safeSetItem('nabil_author_v4_author_posts', next);
    if (updatedLikesCount !== undefined && isCloudHydrated.current && !isCloudQuotaExceeded()) {
      void syncSinglePostStatsToCloud(id, { likesCount: updatedLikesCount });
    }
    return isLikedNow;
  };

  const recordPostView = (id: string) => {
    if (!id || typeof window === 'undefined') return;
    try {
      const seenKey = `nabil_viewed_post_${id}`;
      if (sessionStorage.getItem(seenKey) === '1') return;
      sessionStorage.setItem(seenKey, '1');
    } catch {
      // Proceed even if sessionStorage is restricted
    }

    let changed = false;
    const next = authorPostsRef.current.map((p) => {
      if (p.id === id) {
        changed = true;
        const computed = getCommunityPostStats(p);
        const currentViews = typeof p.viewsCount === 'number' && p.viewsCount >= 50 ? p.viewsCount : computed.baseViews;
        return {
          ...p,
          viewsCount: currentViews + 1,
        };
      }
      return p;
    });
    if (!changed) return;
    authorPostsRef.current = next;
    setAuthorPosts(next);
    safeSetItem('nabil_author_v4_author_posts', next);

    pendingViewPostIdsRef.current.add(id);
    if (viewSyncTimerRef.current) clearTimeout(viewSyncTimerRef.current);
    viewSyncTimerRef.current = setTimeout(() => {
      if (!isCloudHydrated.current || isCloudQuotaExceeded()) return;
      const idsToFlush = Array.from(pendingViewPostIdsRef.current);
      pendingViewPostIdsRef.current.clear();
      idsToFlush.forEach((postId) => {
        const post = authorPostsRef.current.find((p) => p.id === postId);
        if (post && typeof post.viewsCount === 'number') {
          void syncSinglePostStatsToCloud(postId, { viewsCount: post.viewsCount });
        }
      });
    }, 10000);
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
        authorPosts,
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
      if (Array.isArray(data.authorPosts)) setAuthorPosts(sortCommunityPostsNewestFirst(data.authorPosts));

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
        isAnnouncementBannerVisible,
        toggleAnnouncementBannerVisibility,
        isAddBookModalOpen,
        setIsAddBookModalOpen,
        authorPosts,
        addAuthorPost,
        updateAuthorPost,
        deleteAuthorPost,
        toggleLikeAuthorPost,
        recordPostView,
        openCommunityPost,
        toastMessage,
        showToast,
        exportAllSiteData,
        importSiteData,
        resetAllData,
        isCloudSynced,
        syncAllToCloudNow,
        saveStatus,
        executeCloudSave,
        uploadStatus,
        setUploadStatus,
        processAndUploadImage,
        processAndUploadVideo,
        copyToClipboardWithFeedback,
        refreshAndBypassCache,
        autoRefreshEnabled,
        toggleAutoRefresh,
        autoRefreshIntervalSeconds,
        setAutoRefreshIntervalSeconds,
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
