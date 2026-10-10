import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Heart,
  CornerDownLeft,
  Share2,
  RefreshCw,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Trash2,
  Check,
} from 'lucide-react';

export const ContactAndGuestbookSection: React.FC = () => {
  const {
    sendMessage,
    comments,
    addVisitorComment,
    approveComment,
    rejectComment,
    replyToVisitorComment,
    deleteVisitorComment,
    likeComment,
    isAuthorMode,
    openShareModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'message' | 'guestbook'>('message');

  // Private Message state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  // Guestbook Comment state
  const [commenterName, setCommenterName] = useState('');
  const [commenterCountry, setCommenterCountry] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSectionTarget, setCommentSectionTarget] = useState('الصفحة الرئيسية');
  const [commentSuccessNotice, setCommentSuccessNotice] = useState(false);

  // Math challenge state
  const [mathNum1, setMathNum1] = useState(4);
  const [mathNum2, setMathNum2] = useState(8);
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  // Supervisor reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  const generateNewMathQuestion = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setMathNum1(n1);
    setMathNum2(n2);
    setUserMathAnswer('');
    setMathError(false);
  };

  useEffect(() => {
    generateNewMathQuestion();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !msgContent.trim()) return;

    sendMessage({
      senderName: senderName.trim(),
      email: senderEmail.trim(),
      subject: msgSubject.trim() || 'رسالة تواصل خاصة',
      message: msgContent.trim(),
    });

    setSenderName('');
    setSenderEmail('');
    setMsgSubject('');
    setMsgContent('');
    setMsgSentSuccess(true);
    setTimeout(() => setMsgSentSuccess(false), 6000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    setMathError(false);

    if (!commenterName.trim() || !commenterCountry.trim() || !commentText.trim()) {
      return;
    }

    // Verify arithmetic challenge
    const expected = mathNum1 + mathNum2;
    const userResult = parseInt(userMathAnswer.trim(), 10);

    if (isNaN(userResult) || userResult !== expected) {
      setMathError(true);
      generateNewMathQuestion();
      return;
    }

    addVisitorComment({
      senderName: commenterName.trim(),
      country: commenterCountry.trim(),
      content: commentText.trim(),
      targetSection: commentSectionTarget,
      targetType: 'general',
      targetTitle: commentSectionTarget,
    });

    setCommenterName('');
    setCommenterCountry('');
    setCommentText('');
    setUserMathAnswer('');
    setCommentSuccessNotice(true);
    generateNewMathQuestion();
  };

  const handleSendReply = (commentId: string) => {
    if (!replyText.trim()) return;
    replyToVisitorComment(commentId, replyText.trim());
    setReplyingToId(null);
    setReplyText('');
  };

  // Filter approved and pending comments
  const approvedComments = comments.filter((c) => c.isApproved || c.status === 'approved');
  const pendingComments = comments.filter(
    (c) => (c.status === 'pending' || !c.isApproved) && c.status !== 'rejected' && c.status !== 'approved'
  );

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto" dir="rtl">
      
      {/* Header */}
      <div className="text-center space-y-2 border-b border-[#d6e0ea] pb-5">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#c4924c] font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>منصة التواصل الآمن والمراسلة الأدبية</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0b385e] font-literary">
          التعليقات والمراسلة المباشرة
        </h2>
        <p className="text-xs sm:text-sm text-[#64748b] max-w-xl mx-auto">
          يسعد الكاتب أ. نبيل بركات بتلقي رسائلكم الخاصة، واستقبال كلماتكم وانطباعاتكم في سجل الزوار المعتمد.
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex justify-center">
        <div className="p-1 rounded-xl bg-white border border-[#d6e0ea] shadow-sm inline-flex items-center gap-1">
          <button
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'message'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>المراسلة الخاصة (سرية تماماً)</span>
          </button>

          <button
            onClick={() => setActiveTab('guestbook')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'guestbook'
                ? 'bg-[#0b385e] text-white shadow-sm'
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>سجل الزوار ({approvedComments.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Private Direct Message */}
      {activeTab === 'message' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#d6e0ea] shadow-sm space-y-5">
          
          <div className="p-4 rounded-xl bg-[#edf4fb] border border-[#c6daf0] flex items-start gap-3 text-xs text-[#1e3a5f]">
            <Lock className="w-4 h-4 text-[#0b385e] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">خصوصية تامة ومباشرة:</span> هذه الرسالة سرية ومحمية، ولا تُعرض على صفحات الموقع العامة. تصل رسالتك حصراً إلى صندوق بريد الأستاذ نبيل بركات في لوحة تحكمه الخاصة للاطلاع والرد عليها.
            </div>
          </div>

          {msgSentSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">تم إرسال رسالتك بأمان تام!</span> سيتولى الأستاذ نبيل بركات قراءتها والرد على بريدك الإلكتروني قريباً.
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">
                  الاسم الكريم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">
                  البريد الإلكتروني للرد <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">
                موضوع الرسالة
              </label>
              <input
                type="text"
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                placeholder="مثال: استفسار حول مؤلف، دعوة ثقافية، كلمة تقدير..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">
                نص الرسالة السرية <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
                placeholder="اكتب رسالتك وتفاصيل استفسارك هنا بكل أمان..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-[#64748b]">
                يتم إشعار الكاتب فور إرسال النموذج
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال الرسالة السرية</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* TAB 2: Visitor Guestbook & Comments */}
      {activeTab === 'guestbook' && (
        <div className="space-y-6">
          
          {/* Add Comment Form with Math Challenge & Approval Notice */}
          <form
            onSubmit={handleAddComment}
            className="p-6 rounded-2xl bg-white border border-[#d6e0ea] shadow-sm space-y-4"
          >
            <div className="space-y-1 border-b border-[#edf2f7] pb-3">
              <h3 className="text-sm font-bold text-[#0b385e] flex items-center justify-between">
                <span>أضف كلمة في سجل زوار الكاتب</span>
                <span className="text-[11px] font-semibold text-[#c4924c] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  خاضع للموافقة قبل النشر
                </span>
              </h3>
              <p className="text-xs text-[#64748b]">
                شارك انطباعك العام، تحيتك للأستاذ نبيل بركات، مع مراعاة أن التعليق يراجع ويعتمد قبل نشره للعامة.
              </p>
            </div>

            {/* Success Feedback */}
            {commentSuccessNotice && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم استلام تعليقك بنجاح!</span>
                </div>
                <p className="text-emerald-700 leading-relaxed pr-6">
                  شكراً لمشاركتك. سيظهر التعليق في هذا السجل فور مراجعته واعتماده من قبل أ. نبيل بركات.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name */}
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#0b385e]" />
                  <span>الاسم الكريم <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  placeholder="أدخل اسمك الكريم"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              {/* Country (Required) */}
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0b385e]" />
                  <span>البلد / الدولة <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={commenterCountry}
                  onChange={(e) => setCommenterCountry(e.target.value)}
                  placeholder="مثال: الأردن، مصر، السعودية..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              {/* Section Target */}
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">القسم المتعلق</label>
                <select
                  value={commentSectionTarget}
                  onChange={(e) => setCommentSectionTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                >
                  <option value="الصفحة الرئيسية">الصفحة الرئيسية</option>
                  <option value="مؤلفات الكتب">مؤلفات الكتب</option>
                  <option value="الفيديوهات ومقاطع التيكتوك">الفيديوهات ومقاطع التيكتوك</option>
                  <option value="الأخبار والمقالات">الأخبار والمقالات</option>
                  <option value="معرض الصور">معرض الصور</option>
                </select>
              </div>
            </div>

            {/* Comment Text */}
            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">
                نص التعليق أو الكلمة <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب هنا تحيتك أو رأيك الطيب..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
              />
            </div>

            {/* Math challenge before submission */}
            <div className="p-3 bg-[#f0f5fa] border border-[#d2e0ee] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0b385e] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#c4924c]" />
                  <span>مسألة أمان للتأكد من أنك لست روبوت (رقم حسابي) <span className="text-red-500">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={generateNewMathQuestion}
                  className="text-[11px] text-[#0b385e] hover:text-[#c4924c] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تغيير السؤال</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-[#cbd5e1] font-bold text-sm text-[#0b385e]">
                  {mathNum1} + {mathNum2} = ؟
                </div>
                <input
                  type="number"
                  required
                  value={userMathAnswer}
                  onChange={(e) => {
                    setUserMathAnswer(e.target.value);
                    setMathError(false);
                  }}
                  placeholder="أدخل الناتج الحسابي هنا..."
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg bg-white border ${
                    mathError ? 'border-red-500 bg-red-50/50' : 'border-[#cbd5e1]'
                  } text-gray-900 focus:outline-none focus:border-[#0b385e]`}
                />
              </div>

              {mathError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>الناتج الحسابي غير صحيح! يرجى إدخال الناتج الصحيح لإتمام الإرسال.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#64748b]">
                يخضع تعليقك لمراجعة واعتماد الكاتب قبل الظهور
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال التعليق للمراجعة</span>
              </button>
            </div>
          </form>

          {/* Supervisor Panel: Pending Comments for Approval */}
          {isAuthorMode && pendingComments.length > 0 && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-900">
                    لوحة تحكم المشرف: تعليقات واردة بانتظار اعتمادك ({pendingComments.length})
                  </h4>
                </div>
              </div>

              <div className="space-y-2.5">
                {pendingComments.map((pc) => (
                  <div key={pc.id} className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0b385e]">{pc.senderName}</span>
                        <span className="text-[11px] text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
                          {pc.country}
                        </span>
                        <span className="text-[10px] text-[#c4924c] bg-amber-50 px-2 py-0.5 rounded">
                          {pc.targetSection}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                        بانتظار موافقتك
                      </span>
                    </div>

                    <p className="text-[#334155] leading-relaxed bg-[#f8fafc] p-2.5 rounded-lg border border-slate-100">
                      {pc.content}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => approveComment(pc.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>موافقة ونشر للعامة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectComment(pc.id)}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="رفض وحذف هذا التعليق نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>رفض وحذف</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-[#94a3b8]">{pc.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Comments List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#0b385e] flex items-center justify-between">
              <span>سجل الكلمات المعتمدة والمنشورة</span>
              <span className="text-xs font-normal text-[#64748b] font-mono tabular-nums">
                ({approvedComments.length} تعليقات)
              </span>
            </h3>

            {approvedComments.length === 0 ? (
              <div className="p-8 bg-white border border-[#d6e0ea] rounded-2xl text-center text-xs text-[#94a3b8]">
                لا توجد تعليقات منشورة بعد. كن أول من يشارك في سجل الزوار!
              </div>
            ) : (
              approvedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-5 rounded-2xl bg-white border border-[#d6e0ea] shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Monogram Badge (clean initial, no strangers) */}
                      <div className="w-8 h-8 rounded-full bg-[#0b385e] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {comment.senderName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1e293b]">
                          {comment.senderName}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
                          {comment.country && <span>{comment.country}</span>}
                          <span aria-hidden="true">·</span>
                          <span className="text-[#0b385e] font-medium">{comment.targetSection}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          openShareModal({
                            title: `كلمة من ${comment.senderName} في سجل زوار أ. نبيل بركات`,
                            description: comment.content,
                            type: 'general',
                          })
                        }
                        className="p-1.5 text-[#64748b] hover:text-[#0b385e] rounded-lg transition"
                        title="مشاركة التعليق"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#c4924c]" />
                      </button>

                      <button
                        onClick={() => likeComment(comment.id)}
                        className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 bg-rose-50/70 px-2 py-0.5 rounded-full transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        <span>{comment.likesCount || 0}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] leading-relaxed pr-10">
                    {comment.content}
                  </p>

                  {/* Author Reply */}
                  {comment.authorReply && (
                    <div className="mr-8 mt-2 p-3 rounded-xl bg-[#f0f5fa] border-r-3 border-[#c4924c] space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#0b385e]">
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#c4924c]" />
                        <span>رد الكاتب أ. نبيل بركات:</span>
                      </div>
                      <p className="text-[#475569] leading-relaxed">
                        {comment.authorReply}
                      </p>
                    </div>
                  )}

                  {/* Supervisor Inline Reply & Delete */}
                  {isAuthorMode && (
                    <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(comment.id)}
                          className="text-xs text-[#0b385e] hover:underline font-bold cursor-pointer"
                        >
                          رد الكاتب على هذا التعليق
                        </button>

                        {confirmDeleteCommentId === comment.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                            <span className="text-[11px] text-rose-700 font-bold">تأكيد حذف التعليق؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteVisitorComment(comment.id);
                                setConfirmDeleteCommentId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                            >
                              نعم، احذف
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
                            onClick={() => setConfirmDeleteCommentId(comment.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف التعليق</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] text-[#94a3b8] font-mono">{comment.date}</span>
                    </div>
                  )}

                  {/* Reply Input Box for Author */}
                  {isAuthorMode && replyingToId === comment.id && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="اكتب ردك هنا..."
                        className="w-full p-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-[#0b385e]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1 text-xs text-slate-600"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleSendReply(comment.id)}
                          className="px-4 py-1 text-xs font-bold text-white bg-[#0b385e] rounded hover:bg-[#082a47]"
                        >
                          حفظ الرد
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
};
