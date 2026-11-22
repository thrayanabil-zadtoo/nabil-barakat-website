import { Book, BookVisibility } from '../types';

export function getBookVisibility(book?: Pick<Book, 'id' | 'visibility'> | null): BookVisibility {
  if (book?.visibility === 'public' || book?.visibility === 'cover_only' || book?.visibility === 'hidden') {
    return book.visibility;
  }
  return book?.id === 'book-5' ? 'cover_only' : 'public';
}

export function isBookHiddenFromVisitors(book?: Pick<Book, 'id' | 'visibility'> | null): boolean {
  return getBookVisibility(book) === 'hidden';
}

export function isBookContentHiddenFromVisitors(book?: Pick<Book, 'id' | 'visibility'> | null): boolean {
  const visibility = getBookVisibility(book);
  return visibility === 'cover_only' || visibility === 'hidden';
}

export function getVisibleBooksForViewer(books: Book[], isAuthorMode: boolean): Book[] {
  if (isAuthorMode) return books;
  return books.filter((b) => !isBookHiddenFromVisitors(b));
}

export const BOOK_VISIBILITY_OPTIONS: {
  value: BookVisibility;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'hidden',
    label: 'مخفي بالكامل عن الزوار (مسودة)',
    shortLabel: 'مخفي بالكامل 🔒',
    description: 'لا يظهر للزوار نهائياً حتى تنهي الكتابة وتوثق الحقوق الفكرية.',
  },
  {
    value: 'cover_only',
    label: 'إظهار الغلاف فقط (قريباً النشر)',
    shortLabel: 'الغلاف فقط (قريباً) 🖼️',
    description: 'يرى الزوار الغلاف وعبارة «قريباً سيتم نشر المحتوى» مع إخفاء جميع الفصول والنصوص.',
  },
  {
    value: 'public',
    label: 'منشور ومتاح للجميع',
    shortLabel: 'ظاهر للجميع 👁️',
    description: 'تظهر الرواية وكافة فصولها ومحتوياتها وصورها لجميع القراء والزوار.',
  },
];
