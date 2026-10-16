import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  BookOpen,
  Video,
  Image as ImageIcon,
  Newspaper,
  Globe,
  Mail,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Lock,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Upload,
  Copy,
  Download,
  FileUp,
  RefreshCw,
  Cloud,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';
import { getSiteDomain, setCustomSiteDomain, DEFAULT_OFFICIAL_DOMAIN } from '../config/siteDomain';
import { downloadFileSafely } from '../utils/downloadHelper';

export const AuthorAdminModal: React.FC = () => {
  const {
    isAuthorMode,
    setIsAuthorMode,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    logoutSupervisor,
    authorProfile,
    updateAuthorProfile,
    books,
    addBook,
    deleteBook,
    videos,
    addVideo,
    deleteVideo,
    photos,
    addPhoto,
    deletePhoto,
    news,
    addNews,
    deleteNews,
    links,
    addLink,
    deleteLink,
    messages,
    markMessageRead,
    replyToMessage,
    deleteMessage,
    comments,
    approveComment,
    rejectComment,
    replyToVisitorComment,
    deleteVisitorComment,
    resetAllData,
    setEditingVideo,
    setEditingPhoto,
    setEditingBook,
    setEditingNews,
    setEditingLink,
    cvFeesEnabled,
    toggleCvFees,
    exportAllSiteData,
    importSiteData,
    showToast,
    isCloudSynced,
    syncAllToCloudNow,
    saveStatus,
    processAndUploadImage,
    copyToClipboardWithFeedback,
  } = useApp();

  const [copiedMediaId, setCopiedMediaId] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState(() => getSiteDomain());
  const backupFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importSiteData(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [activeTab, setActiveTab] = useState<
    'videos' | 'photos' | 'books' | 'news' | 'links' | 'messages' | 'comments' | 'settings'
  >('videos');

  // Book Builder State
  const [bTitle, setBTitle] = useState('');
  const [bSubtitle, setBSubtitle] = useState('');
  const [bCover, setBCover] = useState('/src/assets/images/book_reality_dream_1790502175783.jpg');
  const [bGalleryInput, setBGalleryInput] = useState('');
  const [bGalleryImages, setBGalleryImages] = useState<string[]>([
    '/src/assets/images/book_reality_dream_1790502175783.jpg',
    '/src/assets/images/cultural_salon_event_1790501249700.jpg',
  ]);
  const [bYear, setBYear] = useState('2025');
  const [bPublisher, setBPublisher] = useState('دار الآفاق الثقافية');
  const [bIsbn, setBIsbn] = useState('978-9957-41-802-1');
  const [bPages, setBPages] = useState(280);
  const [bGenre, setBGenre] = useState('رواية أدبية');
  const [bDesc, setBDesc] = useState('');

  // Video State (فيديو يجسد الروايات)
  const [vTitle, setVTitle] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vBookId, setVBookId] = useState<string>('book-1');
  const [vChapterNumber, setVChapterNumber] = useState<number | ''>(1);
  const [vChapterTitle, setVChapterTitle] = useState('');
  const [vCategory, setVCategory] = useState('رواية وقعت في فخ شيماء');
  const [vDesc, setVDesc] = useState('');
  const [vDuration, setVDuration] = useState('02:30');
  const [vLikes, setVLikes] = useState('1.5K');
  const [vComments, setVComments] = useState('180');

  // Photo State
  const [pTitle, setPTitle] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pCategory, setPCategory] = useState('حفلات توقيع');
  const [pLocation, setPLocation] = useState('المعرض الدولي');
  const [pCaption, setPCaption] = useState('');

  // Messages & Comments replies
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageReplyText, setMessageReplyText] = useState('');
  const [confirmDeleteMessageId, setConfirmDeleteMessageId] = useState<string | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [commentReplyText, setCommentReplyText] = useState('');
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  if (!isAuthorMode || !isAdminPanelOpen) return null;

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle.trim() || !vUrl.trim()) return;
    const parsed = parseVideoUrl(vUrl);
    const assignedBook = books.find((b) => b.id === vBookId);
    const bookTitle = assignedBook ? assignedBook.title : 'مؤلفات نبيل بركات';

    addVideo({
      title: vTitle.trim(),
      url: parsed.cleanUrl || vUrl.trim(),
      videoFileUrl: vUrl.startsWith('data:') ? vUrl : undefined,
      category: vCategory || `رواية ${bookTitle}`,
      bookId: vBookId,
      bookTitle,
      chapterNumber: vChapterNumber ? Number(vChapterNumber) : undefined,
      chapterTitle: vChapterTitle.trim() || undefined,
      description: vDesc.trim() || `تجسيد درامي ومرئي لفصول رواية «${bookTitle}» بقلم الكاتب أ. نبيل بركات.`,
      platform: 'direct',
      duration: vDuration || '02:30',
      likesCount: vLikes || '1.5K',
      commentsCount: vComments || '180',
    });
    setVTitle('');
    setVUrl('');
    setVDesc('');
    setVChapterTitle('');
    showToast('تمت إضافة الفصل والمشهد المرئي بنجاح وحفظه سحابياً');
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim() || !pUrl.trim()) return;
    addPhoto({
      title: pTitle.trim(),
      imageUrl: pUrl.trim(),
      category: pCategory,
      location: pLocation.trim() || 'المعرض الدولي',
      caption: pCaption.trim() || 'صورة توثيقية للأستاذ نبيل بركات',
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
    });
    setPTitle('');
    setPUrl('');
    setPCaption('');
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;
    addBook({
      title: bTitle.trim(),
      subtitle: bSubtitle.trim() || 'قصص من الحياة',
      coverImage: bCover.trim(),
      galleryImages: bGalleryImages,
      publicationYear: bYear,
      publisher: bPublisher.trim(),
      isbn: bIsbn.trim(),
      pagesCount: Number(bPages) || 280,
      genre: bGenre.trim(),
      description: bDesc.trim() || 'كتاب أدبي صادر عن الكاتب أ. نبيل بركات.',
      tableOfContents: [
        { chapter: 'المدخل', pageNumber: 7, summary: 'عتبات أولى' },
        { chapter: 'الفصل الأول', pageNumber: 30, summary: 'سرد الأحداث' },
      ],
      samplePages: [
        { pageNumber: 15, title: 'مقتطف', content: 'كانت الكلمات تنثال بحرية...' },
      ],
    });
    setBTitle('');
    setBSubtitle('');
    setBDesc('');
  };

  const unreadMessagesCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] border border-[#0b385e]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b385e] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#dfa85b]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                لوحة تحكم المشرف (إدارة وتعديل محتوى الموقع)
              </h2>
              <div className="text-xs text-[#cbe0f0]">
                الكاتب أ. نبيل بركات · صلاحيات كاملة لإضافة وتعديل وحذف أي عنصر
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={syncAllToCloudNow}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer ${
                saveStatus === 'saving'
                  ? 'bg-amber-600 text-white animate-pulse'
                  : saveStatus === 'saved'
                  ? 'bg-emerald-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-rose-600 text-white'
                  : isCloudSynced
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
              title="مزامنة فورية وحفظ سحابي لجميع البيانات على Firebase لتظهر لكافة الزوار حول العالم"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جارٍ الحفظ السحابي...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم الحفظ بنجاح ✓</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>فشل الحفظ ⚠️</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isCloudSynced ? 'سحابي متصل ✓' : 'مزامنة سحابية'}</span>
                </>
              )}
            </button>
            <button
              onClick={logoutSupervisor}
              className="text-xs bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
              title="تسجيل خروج المشرف بالكامل"
            >
              تسجيل خروج
            </button>
            <button
              onClick={() => setIsAdminPanelOpen(false)}
              className="p-1.5 hover:text-[#dfa85b] rounded-lg transition cursor-pointer"
              aria-label="إغلاق اللوحة"
              title="إغلاق لوحة التحكم ومتابعة التصفح في وضع المشرف"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'videos'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>فيديو يجسد الروايات ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'photos'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>مستودع الوسائط والمعرض ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'books'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>إدارة الكتب ({books.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'news'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>إدارة «صورة في خبر» ({news.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'links'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>الروابط ({links.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition relative ${
              activeTab === 'messages'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>الرسائل الخاصة ({messages.length})</span>
            {unreadMessagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'comments'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>التعليقات ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'settings'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#edf4fb]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الواجهة والبانر والبيانات</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* TAB 1: VIDEOS MANAGEMENT */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              
              {/* Add Video Form */}
              <form onSubmit={handleAddVideo} className="p-5 rounded-xl bg-[#f8fafc] border border-[#d6e0ea] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-[#0b385e] text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#dfa85b]" />
                    <span>إضافة وتجسيد فيديو جديد ضمن الروايات</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    مشاهدة حصرية مباشرة · محمي بعلامة مائية
                  </span>
                </div>

                {/* Novel and Chapter Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">الرواية التابع لها المشهد:</label>
                    <select
                      value={vBookId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setVBookId(bId);
                        const found = books.find((b) => b.id === bId);
                        if (found) {
                          setVCategory(`رواية ${found.title}`);
                          if (!vTitle) {
                            setVTitle(`رواية ${found.title} · الفصل ${vChapterNumber || 1}`);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-[#0b385e]"
                    >
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          رواية: {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">رقم الفصل:</label>
                    <input
                      type="number"
                      min="1"
                      value={vChapterNumber}
                      onChange={(e) => setVChapterNumber(e.target.value ? Number(e.target.value) : '')}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">عنوان الفصل أو المشهد:</label>
                    <input
                      type="text"
                      value={vChapterTitle}
                      onChange={(e) => setVChapterTitle(e.target.value)}
                      placeholder="مثال: البدايات الغامضة"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">عنوان الفيديو الكامل</label>
                    <input
                      type="text"
                      required
                      value={vTitle}
                      onChange={(e) => setVTitle(e.target.value)}
                      placeholder="مثال: رواية وقعت في فخ شيماء · الفصل الأول"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      ملف أو رابط الفيديو المباشر
                    </label>
                    <div className="space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-bold text-xs rounded-lg transition shadow-xs w-full justify-center">
                        <Upload className="w-4 h-4" />
                        <span>رفع فيديو من الجهاز (MP4/WebM)</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 80 * 1024 * 1024) {
                                showToast('حجم ملف الفيديو كبير جداً (أكبر من 80 ميجابايت).');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setVUrl(reader.result as string);
                                showToast('تم تجهيز ملف الفيديو للمشاهدة وحفظ الحقوق بنجاح');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        required
                        value={vUrl}
                        onChange={(e) => setVUrl(e.target.value)}
                        placeholder="رابط ملف فيديو مباشر (MP4) أو ملف مرفوع..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">المدة التقديرية</label>
                    <input
                      type="text"
                      value={vDuration}
                      onChange={(e) => setVDuration(e.target.value)}
                      placeholder="02:30"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">الوصف والمشهد الدرامي</label>
                  <input
                    type="text"
                    value={vDesc}
                    onChange={(e) => setVDesc(e.target.value)}
                    placeholder="نبذة عن تجسيد الفصل والأحداث الروائية..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    * يتم بث الفيديو بعلامة مائية رقمية لحفظ حقوق الملكية الفكرية، مع تعطيل إمكانية التحميل لجميع الزوار.
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0b385e] text-white font-bold rounded-lg hover:bg-[#082a47] cursor-pointer"
                  >
                    حفظ وتجسيد الفصل مرئياً
                  </button>
                </div>
              </form>

              {/* Videos List with Direct Edit Buttons */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0b385e] text-sm">فصول الروايات المرئية الحالية ({videos.length}):</h4>
                <div className="divide-y divide-gray-200 border rounded-xl overflow-hidden bg-white">
                  {videos.map((v) => (
                    <div key={v.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#07243c] font-black bg-[#dfa85b] px-2 py-0.5 rounded text-[10px]">
                            {v.chapterNumber ? `الفصل ${v.chapterNumber}` : 'مشهد'}
                          </span>
                          <span className="font-bold text-[#0b385e] text-sm">{v.title}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            محمي بعلامة مائية ©
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono truncate max-w-md">{v.url}</div>
                        <div className="text-[11px] text-[#c4924c]">
                          {v.bookTitle ? `رواية «${v.bookTitle}»` : v.category} · {v.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingVideo(v)}
                          className="px-3 py-1.5 bg-[#edf4fb] text-[#0b385e] hover:bg-[#d9e8f6] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => deleteVideo(v.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PHOTOS MANAGEMENT */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              
              {/* Add Photo Form */}
              <form onSubmit={handleAddPhoto} className="p-5 rounded-xl bg-[#f8fafc] border border-[#d6e0ea] space-y-3">
                <div className="font-bold text-[#0b385e] text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#dfa85b]" />
                  <span>إضافة صورة جديدة للألبوم</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">عنوان الصورة</label>
                    <input
                      type="text"
                      required
                      value={pTitle}
                      onChange={(e) => setPTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">رابط الصورة (URL)</label>
                    <input
                      type="text"
                      required
                      value={pUrl}
                      onChange={(e) => setPUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">المكان</label>
                    <input
                      type="text"
                      value={pLocation}
                      onChange={(e) => setPLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">شرح الصورة</label>
                  <input
                    type="text"
                    value={pCaption}
                    onChange={(e) => setPCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0b385e] text-white font-bold rounded-lg hover:bg-[#082a47]"
                  >
                    إضافة للألبوم
                  </button>
                </div>
              </form>

              {/* Photos List with Direct Edit Buttons */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0b385e] text-sm">الصور الحالية ({photos.length}):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="p-3 border rounded-xl bg-white space-y-2 flex flex-col justify-between">
                      <img src={p.imageUrl} alt="" className="w-full aspect-video object-cover rounded-lg" />
                      <div>
                        <div className="font-bold text-[#0b385e] truncate">{p.title}</div>
                        <div className="text-[11px] text-gray-500">{p.location} · {p.category}</div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingPhoto(p)}
                            className="px-2.5 py-1 bg-[#edf4fb] text-[#0b385e] hover:bg-[#d9e8f6] font-bold rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const url = p.videoUrl || p.imageUrl;
                              navigator.clipboard.writeText(url);
                              setCopiedMediaId(p.id);
                              showToast('تم نسخ رابط الصورة / الفيديو لاستخدامه لاحقاً');
                              setTimeout(() => setCopiedMediaId(null), 2500);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                            title="نسخ الرابط لاستخدامه لاحقاً"
                          >
                            {copiedMediaId === p.id ? (
                              <span className="text-emerald-700 font-bold">تم النسخ</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#c4924c]" />
                                <span>نسخ الرابط</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => deletePhoto(p.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: BOOKS MANAGEMENT */}
          {activeTab === 'books' && (
            <div className="space-y-6">
              
              {/* Add Book Form */}
              <form onSubmit={handleCreateBook} className="p-5 rounded-xl bg-[#f8fafc] border border-[#d6e0ea] space-y-3">
                <div className="font-bold text-[#0b385e] text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#dfa85b]" />
                  <span>إضافة كتاب جديد</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">عنوان الكتاب</label>
                    <input
                      type="text"
                      required
                      value={bTitle}
                      onChange={(e) => setBTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">العنوان الفرعي</label>
                    <input
                      type="text"
                      value={bSubtitle}
                      onChange={(e) => setBSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">صورة الغلاف (رابط أو رفع سحابي)</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        required
                        value={bCover}
                        onChange={(e) => setBCover(e.target.value)}
                        placeholder="رابط الصورة أو ارفعها..."
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboardWithFeedback(bCover, 'تم نسخ رابط الغلاف')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                        title="نسخ الرابط"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <label className="cursor-pointer px-3 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-bold text-xs rounded-lg whitespace-nowrap">
                        رفع
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const uploaded = await processAndUploadImage(file, {
                                maxWidth: 640,
                                maxHeight: 900,
                                quality: 0.72,
                                category: 'المؤلفات والكتب',
                                contextTitle: `غلاف: ${bTitle || 'كتاب جديد'}`,
                              });
                              setBCover(uploaded);
                            } catch {
                              // Handled
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0b385e] text-white font-bold rounded-lg hover:bg-[#082a47]"
                  >
                    نشر الكتاب
                  </button>
                </div>
              </form>

              {/* Books List with Direct Edit Buttons */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0b385e] text-sm">الكتب الحالية ({books.length}):</h4>
                <div className="divide-y divide-gray-200 border rounded-xl overflow-hidden bg-white">
                  {books.map((b) => (
                    <div key={b.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <img src={b.coverImage} alt="" className="w-10 h-14 object-cover rounded border" />
                        <div>
                          <div className="font-bold text-[#0b385e] text-sm">{b.title}</div>
                          <div className="text-[11px] text-gray-500">{b.subtitle} · {b.publicationYear} · {b.pagesCount} صفحة</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            copyToClipboardWithFeedback(b.coverImage, `تم نسخ رابط غلاف كتاب «${b.title}»`);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                          title="نسخ رابط الغلاف للمشرف"
                        >
                          <Copy className="w-3 h-3 text-[#c4924c]" />
                          <span>نسخ الغلاف</span>
                        </button>
                        <button
                          onClick={() => setEditingBook(b)}
                          className="px-3 py-1.5 bg-[#edf4fb] text-[#0b385e] hover:bg-[#d9e8f6] font-bold rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => deleteBook(b.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: NEWS MANAGEMENT */}
          {activeTab === 'news' && (
            <div className="space-y-3">
              <h4 className="font-bold text-[#0b385e] text-sm">الأخبار والمقالات الحالية ({news.length}):</h4>
              <div className="divide-y divide-gray-200 border rounded-xl overflow-hidden bg-white">
                {news.map((n) => (
                  <div key={n.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-[#0b385e] text-sm">{n.title}</div>
                      <div className="text-[11px] text-gray-500">{n.category} · {n.date}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingNews(n)}
                        className="px-3 py-1.5 bg-[#edf4fb] text-[#0b385e] hover:bg-[#d9e8f6] font-bold rounded-lg flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => deleteNews(n.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LINKS MANAGEMENT */}
          {activeTab === 'links' && (
            <div className="space-y-3">
              <h4 className="font-bold text-[#0b385e] text-sm">الروابط والمواقع الحالية ({links.length}):</h4>
              <div className="divide-y divide-gray-200 border rounded-xl overflow-hidden bg-white">
                {links.map((l) => (
                  <div key={l.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-[#0b385e] text-sm">{l.title}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{l.url}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLink(l)}
                        className="px-3 py-1.5 bg-[#edf4fb] text-[#0b385e] hover:bg-[#d9e8f6] font-bold rounded-lg flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => deleteLink(l.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MESSAGES INBOX */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              <h4 className="font-bold text-[#0b385e] text-sm">رسائل الزوار الخاصة السرية ({messages.length}):</h4>
              {messages.length === 0 ? (
                <div className="p-6 text-center text-gray-500 border rounded-xl">لا توجد رسائل جديدة.</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="p-4 border rounded-xl bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0b385e]">{m.senderName} ({m.email})</div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-xs">{m.date}</span>
                        {confirmDeleteMessageId === m.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                            <span className="text-[10px] text-rose-700 font-bold">تأكيد الحذف؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteMessage(m.id);
                                setConfirmDeleteMessageId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                            >
                              احذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMessageId(null)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMessageId(m.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف الرسالة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-800">الموضوع: {m.subject}</div>
                    <p className="text-gray-600 bg-slate-50 p-2.5 rounded border">{m.message}</p>
                    {m.authorReply ? (
                      <div className="text-[#0b385e] font-bold bg-[#edf4fb] p-2 rounded text-xs">
                        ردك: {m.authorReply}
                      </div>
                    ) : (
                      selectedMessageId === m.id && (
                        <div className="pt-2 space-y-2">
                          <textarea
                            rows={2}
                            value={messageReplyText}
                            onChange={(e) => setMessageReplyText(e.target.value)}
                            placeholder="اكتب رد الأستاذ نبيل..."
                            className="w-full p-2 border rounded-lg text-xs"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedMessageId(null)}
                              className="px-3 py-1 border rounded cursor-pointer"
                            >
                              إلغاء
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (messageReplyText.trim()) {
                                  replyToMessage(m.id, messageReplyText.trim());
                                  setMessageReplyText('');
                                  setSelectedMessageId(null);
                                }
                              }}
                              className="px-4 py-1 bg-[#0b385e] text-white rounded font-bold cursor-pointer"
                            >
                              إرسال الرد
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {!m.authorReply && selectedMessageId !== m.id && (
                          <button
                            type="button"
                            onClick={() => setSelectedMessageId(m.id)}
                            className="text-xs text-[#0b385e] font-bold hover:underline cursor-pointer"
                          >
                            كتابة رد على الرسالة
                          </button>
                        )}
                      </div>

                      {confirmDeleteMessageId === m.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                          <span className="text-[10px] text-rose-700 font-bold">تأكيد حذف الرسالة؟</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteMessage(m.id);
                              setConfirmDeleteMessageId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            احذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMessageId(null)}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMessageId(m.id)}
                          className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الرسالة</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 7: COMMENTS APPROVAL & MANAGEMENT */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="font-bold text-[#0b385e] text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#c4924c]" />
                    <span>إدارة واعتماد تعليقات الزوار ({comments.length})</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    التعليقات تخضع للموافقة المسبقة قبل ظهورها في الموقع.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {comments.filter((c) => !c.isApproved || c.status === 'pending').length} بانتظار الاعتماد
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {comments.filter((c) => c.isApproved || c.status === 'approved').length} منشورة
                  </span>
                </div>
              </div>

              {comments.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border rounded-xl bg-slate-50 text-xs">
                  لا توجد أي تعليقات حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => {
                    const isPending = !c.isApproved || c.status === 'pending';

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                          isPending
                            ? 'bg-amber-50/60 border-amber-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0b385e]">{c.senderName}</span>
                            {c.country && (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                {c.country}
                              </span>
                            )}
                            {c.targetSection && (
                              <span className="bg-blue-50 text-[#0b385e] px-2 py-0.5 rounded text-[11px] font-medium">
                                {c.targetSection}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPending
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isPending ? 'بانتظار الموافقة' : 'معتمد ومنشور'}
                            </span>
                            <span className="text-gray-400 font-mono text-[11px]">{c.date}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">
                          {c.content}
                        </p>

                        {/* Author Reply preview */}
                        {c.authorReply && (
                          <div className="text-xs text-[#0b385e] bg-[#edf4fb] p-2.5 rounded-lg border-r-2 border-[#c4924c]">
                            <span className="font-bold">ردك: </span>
                            <span>{c.authorReply}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <button
                                onClick={() => approveComment(c.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>موافقة ونشر الآن</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => rejectComment(c.id)}
                                className="px-2.5 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg font-medium"
                              >
                                إيقاف النشر (تعليق)
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCommentId(selectedCommentId === c.id ? null : c.id);
                                setCommentReplyText(c.authorReply || '');
                              }}
                              className="px-2.5 py-1 bg-[#f0f4f8] text-[#0b385e] hover:bg-[#e2eaf2] rounded-lg font-medium cursor-pointer"
                            >
                              {c.authorReply ? 'تعديل الرد' : 'إضافة رد'}
                            </button>
                          </div>

                          {confirmDeleteCommentId === c.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                              <span className="text-[10px] text-rose-700 font-bold">تأكيد الحذف؟</span>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteVisitorComment(c.id);
                                  setConfirmDeleteCommentId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                              >
                                احذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCommentId(null)}
                                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCommentId(c.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="حذف التعليق"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Inline Reply Box for Comment */}
                        {selectedCommentId === c.id && (
                          <div className="pt-2 border-t border-slate-200 space-y-2 bg-slate-50 p-2.5 rounded-lg">
                            <textarea
                              rows={2}
                              value={commentReplyText}
                              onChange={(e) => setCommentReplyText(e.target.value)}
                              placeholder="اكتب رد الأستاذ نبيل على هذا التعليق..."
                              className="w-full p-2 text-xs border rounded-lg bg-white outline-none focus:border-[#0b385e]"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setSelectedCommentId(null)}
                                className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (commentReplyText.trim()) {
                                    replyToVisitorComment(c.id, commentReplyText.trim());
                                    setSelectedCommentId(null);
                                  }
                                }}
                                className="px-4 py-1 bg-[#0b385e] hover:bg-[#07243c] text-white rounded-lg font-bold cursor-pointer shadow-xs"
                              >
                                حفظ الرد
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: SETTINGS & BANNER */}
          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="font-bold text-[#0b385e] text-sm">تعديل بيانات البانر والكاتب:</h4>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1">اسم الكاتب</label>
                <input
                  type="text"
                  value={authorProfile.name}
                  onChange={(e) => updateAuthorProfile({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">الصفة / اللقب</label>
                <input
                  type="text"
                  value={authorProfile.title}
                  onChange={(e) => updateAuthorProfile({ title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">شعار الكاتب (Motto)</label>
                <input
                  type="text"
                  value={authorProfile.motto}
                  onChange={(e) => updateAuthorProfile({ motto: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">رابط صورة الكاتب الشخصية</label>
                <input
                  type="text"
                  value={authorProfile.portraitImage}
                  onChange={(e) => updateAuthorProfile({ portraitImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">رابط بانر المناظر الطبيعية للواجهة</label>
                <input
                  type="text"
                  value={authorProfile.heroLandscapeImage}
                  onChange={(e) => updateAuthorProfile({ heroLandscapeImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">نص المقولة في البانر</label>
                <input
                  type="text"
                  value={authorProfile.quoteBannerText}
                  onChange={(e) => updateAuthorProfile({ quoteBannerText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              {/* CV Service Monetization Setting */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#0b385e] text-xs">
                      نظام رسوم خدمة مجانية C.V (منصة السيرة الذاتية)
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {cvFeesEnabled
                        ? 'النظام الحالي: وضع الرسوم مفعل (القوالب الاحترافية والذكاء الاصطناعي مقيدة للمشتركين).'
                        : 'النظام الحالي: مجاني 100% بدون أي رسوم (جميع القوالب والميزات مفتوحة ومجانية لكافة الزوار بعد التسجيل).'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleCvFees}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      cvFeesEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    <span>{cvFeesEnabled ? 'وضع الرسوم نشط 🔒' : 'الخدمة مجانية بالكامل 🎁'}</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-500">
                  * يمكنك التبديل بين جعل الخدمة مجانية بالكامل للجمهور أو تفعيل الرسوم بخاصية (Toggle) بنقرة واحدة.
                </div>
              </div>

              {/* Official Domain & Subdomain Setting */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#0b385e] text-xs">
                      رابط الموقع المعتمد ورموز الـ QR والسيرة الذاتية (Domain / Subdomain)
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      النطاق المعتمد الرسمي: <strong className="font-mono text-emerald-800 dir-ltr inline-block">nb.zadtoo.com</strong> (مرتبط بكافة رموز الـ QR والبطاقات والمشاركات)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      dir="ltr"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="nb.zadtoo.com"
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono text-xs text-left"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomSiteDomain(domainInput);
                      showToast(`تم اعتماد النطاق بنجاح (${domainInput || DEFAULT_OFFICIAL_DOMAIN})`);
                    }}
                    className="px-4 py-2 bg-[#0b385e] hover:bg-[#07243c] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    حفظ النطاق
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-500">النطاق المعتمد:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDomainInput('nb.zadtoo.com');
                      setCustomSiteDomain('nb.zadtoo.com');
                      showToast('تم اعتماد الرابط الرسمي: nb.zadtoo.com');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-400 rounded-md font-mono text-[10px] font-bold cursor-pointer transition shadow-2xs"
                  >
                    nb.zadtoo.com (المعتمد الرسمي الآن)
                  </button>
                </div>
              </div>

              {/* Production ZIP & Hosting Export Card */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-300 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>تحميل ملف الموقع الكامل المجهز للنشر على الاستضافة (Production ZIP)</span>
                    </h5>
                    <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                      يحتوي هذا الملف المضغوط على النسخة الكاملة والمجهزة فوراً للرفع المباشر إلى استضافتك (مثل cPanel داخل مجلد public_html). يضم كافة الروايات والكتب الأربعة كاملة بنصوصها وفهارسها، ومشغل الموسيقى، والصور، والتنسيقات، وملف التوجيه (.htaccess).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      downloadFileSafely(
                        '/Nabil_Barakat_Website_Production_Ready.zip',
                        'Nabil_Barakat_Website_Production_Ready.zip',
                        showToast
                      );
                    }}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تحميل ملف الاستضافة المجهز (Production Ready ZIP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      downloadFileSafely(
                        '/Nabil_Barakat_Website_Full_Source_Code.zip',
                        'Nabil_Barakat_Website_Full_Source_Code.zip',
                        showToast
                      );
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0b385e] border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-98"
                  >
                    <FileUp className="w-4 h-4 text-[#c4924c]" />
                    <span>تحميل الأكواد المصدرية الكاملة (Source Code ZIP)</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                  <p className="font-bold text-emerald-900 mb-1">طريقة التركيب على أي استضافة (cPanel / Apache):</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>افتح File Manager في لوحة تحكم الاستضافة ثم افتح مجلد public_html.</li>
                    <li>ارفع ملف Production Ready ZIP وفك الضغط داخله (Extract).</li>
                    <li>افتح رابط موقعك وستجد الموقع يعمل بكامل تصميمه ورواياته الأربعة مباشرة دون الحاجة لأي برمجة إضافية!</li>
                  </ol>
                </div>
              </div>

              {/* Device Synchronization & Backup Card (Transfer between Mobile & Laptop) */}
              <div className="p-4 bg-sky-50/80 rounded-xl border border-sky-200/90 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-[#0b385e] text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-sky-600" />
                      <span>مزامنة ونقل الأغلفة والبيانات بين الموبايل واللابتوب</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      💡 <strong>سبب عدم ظهور صور الأغلفة عند التبديل بين الهاتف واللابتوب:</strong> أن كل جهاز يحتفظ بالصور المرفوعة في ذاكرته المحلية المستقلة. لنقل كل الصور والأغلفة التي رفعتها من الموبايل إلى اللابتوب (أو العكس):
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Export Button */}
                  <button
                    type="button"
                    onClick={exportAllSiteData}
                    className="p-3 bg-white hover:bg-sky-50 border border-sky-300 rounded-xl text-xs font-bold text-[#0b385e] flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer group"
                  >
                    <Download className="w-4 h-4 text-sky-600 group-hover:-translate-y-0.5 transition-transform" />
                    <span>1. تصدير ملف النسخة من هذا الجهاز</span>
                  </button>

                  {/* Import Button */}
                  <div>
                    <input
                      type="file"
                      ref={backupFileInputRef}
                      onChange={handleImportBackup}
                      accept=".json,application/json"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backupFileInputRef.current?.click()}
                      className="w-full p-3 bg-gradient-to-r from-[#0b385e] to-[#07243c] hover:from-[#082a47] hover:to-[#051a2c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <FileUp className="w-4 h-4 text-amber-400" />
                      <span>2. استيراد الملف وتحديث الموقع هنا</span>
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-lg border border-sky-100">
                  📌 <strong>طريقة الاستخدام السريعة:</strong> من هاتفك اضغط (1. تصدير)، أرسل الملف بالواتساب لنفسك وافتحه على اللابتوب ثم اضغط (2. استيراد) فتظهر كل الصور والأغلفة المرفوعة فوراً.
                </p>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-gray-500">استعادة ضبط البيانات التأسيسية للموقع</span>
                <button
                  type="button"
                  onClick={resetAllData}
                  className="px-3 py-1.5 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 font-bold"
                >
                  استعادة الضبط
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
