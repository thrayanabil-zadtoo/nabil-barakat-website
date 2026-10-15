export interface BookComment {
  id: string;
  authorName: string;
  date: string;
  content: string;
  rating: number;
}

export interface TableOfContentItem {
  chapter: string;
  pageNumber: number;
  summary?: string;
}

export interface SamplePageItem {
  pageNumber: number;
  title: string;
  content: string;
  image?: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  galleryImages: string[];
  publicationYear: string;
  publisher: string;
  isbn: string;
  pagesCount: number;
  genre: string;
  description: string;
  tableOfContents: TableOfContentItem[];
  samplePages: SamplePageItem[];
  purchaseOrDownloadLink?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  comments: BookComment[];
  isPinned?: boolean;
  order?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  platform: 'tiktok' | 'youtube' | 'direct';
  url: string;
  videoFileUrl?: string;
  category: string;
  date: string;
  duration?: string;
  likesCount?: string;
  commentsCount?: string;
  isPinned?: boolean;
  order?: number;
  bookId?: string;
  bookTitle?: string;
  chapterNumber?: number;
  chapterTitle?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  category: string;
  date: string;
  location: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  isPinned?: boolean;
  order?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  readTime: string;
  coverImage?: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  videoType?: 'direct' | 'tiktok' | 'youtube';
  source?: string;
  isPinned?: boolean;
  order?: number;
}

export interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  iconType: 'tiktok' | 'twitter' | 'instagram' | 'youtube' | 'book' | 'globe' | 'newspaper' | 'telegram' | 'facebook' | 'whatsapp' | 'linkedin';
}

export interface VisitorMessage {
  id: string;
  senderName: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
  authorReply?: string;
}

export interface VisitorComment {
  id: string;
  senderName: string;
  country: string;
  city?: string;
  content: string;
  date: string;
  targetSection: string;
  targetType: 'general' | 'book' | 'video' | 'photo' | 'news';
  targetId?: string;
  targetTitle?: string;
  isApproved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  likesCount?: number;
  authorReply?: string;
}

export interface AuthorProfile {
  name: string;
  title: string;
  motto: string;
  bio: string;
  extendedBio: string;
  portraitImage: string;
  headerBannerImage?: string;
  heroLandscapeImage: string;
  quoteBannerText: string;
  quoteBannerAuthor: string;
  stats: {
    booksCount: number;
    articlesCount: number;
    eventsCount: number;
    readersCount: string;
  };
  email: string;
  phone?: string;
  location: string;
  isPrivateSite: boolean;
  sitePasscode?: string;
}

export interface AnnouncementItem {
  id: string;
  badge: string;
  title: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  glowColor?: 'gold' | 'cyan' | 'emerald' | 'crimson' | 'purple';
  isActive: boolean;
  order?: number;
}
