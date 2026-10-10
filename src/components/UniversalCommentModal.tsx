import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  MessageSquare,
  Send,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Heart,
  CornerDownLeft,
  User,
  MapPin,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const UniversalCommentModal: React.FC = () => {
  const {
    commentModalTarget,
    closeCommentModal,
    comments,
    addVisitorComment,
    approveComment,
    rejectComment,
    deleteVisitorComment,
    likeComment,
    isAuthorMode,
  } = useApp();

  // Confirmation state for deleting
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  // Form Fields
  const [senderName, setSenderName] = useState('');
  const [country, setCountry] = useState('');
  const [content, setContent] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');

  // Math Verification (رقم حسابي / مسألة أمان للتأكد من النتيجة)
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(7);
  const [mathError, setMathError] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const generateNewMathQuestion = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const n2 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    setNum1(n1);
    setNum2(n2);
    setMathAnswer('');
    setMathError(false);
  };

  useEffect(() => {
    if (commentModalTarget) {
      generateNewMathQuestion();
      setIsSubmittedSuccess(false);
      setMathError(false);
    }
  }, [commentModalTarget]);

  if (!commentModalTarget) return null;

  const targetType = commentModalTarget.targetType;
  const targetId = commentModalTarget.targetId;
  const targetTitle = commentModalTarget.targetTitle || 'المحتوى المحدد';

  // Filter comments for this target
  const targetComments = comments.filter((c) => {
    if (targetId) {
      return c.targetId === targetId || (c.targetTitle && c.targetTitle === targetTitle);
    }
    if (targetType === 'general') {
      return c.targetType === 'general' || !c.targetType;
    }
    return c.targetType === targetType;
  });

  // Approved comments to show to visitors
  const approvedComments = targetComments.filter((c) => c.isApproved || c.status === 'approved');
  // Pending comments (visible to author supervisor)
  const pendingComments = targetComments.filter(
    (c) => (c.status === 'pending' || !c.isApproved) && c.status !== 'rejected' && c.status !== 'approved'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMathError(false);

    // Validate fields
    if (!senderName.trim() || !country.trim() || !content.trim()) {
      return;
    }

    // Verify arithmetic calculation
    const expected = num1 + num2;
    const userResult = parseInt(mathAnswer.trim(), 10);

    if (isNaN(userResult) || userResult !== expected) {
      setMathError(true);
      generateNewMathQuestion();
      return;
    }

    // Submit comment - strictly pending approval
    addVisitorComment({
      senderName: senderName.trim(),
      country: country.trim(),
      content: content.trim(),
      targetSection: targetTitle,
      targetType: targetType,
      targetId: targetId,
      targetTitle: targetTitle,
    });

    setIsSubmittedSuccess(true);
    setContent('');
    setMathAnswer('');
  };

  const getTargetTypeBadge = () => {
    switch (targetType) {
      case 'book':
        return 'كتاب ومؤلف';
      case 'video':
        return 'فيديو';
      case 'photo':
        return 'صورة';
      case 'news':
        return 'خبر ومقال';
      default:
        return 'سجل الزوار';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      onClick={closeCommentModal}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#d6e0ea] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b385e] to-[#082a47] px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dfa85b]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">التعليقات والمشاركات</h3>
              <p className="text-xs text-blue-100/80 truncate max-w-[280px]">
                {getTargetTypeBadge()}: {targetTitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeCommentModal}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Target Reference Info */}
          <div className="bg-[#f0f5fa] border border-[#d2e0ee] rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-[#c4924c] font-bold block">
                المحتوى المعلق عليه:
              </span>
              <h4 className="font-bold text-[#0b385e] text-sm">
                {targetTitle}
              </h4>
            </div>
            <span className="px-2.5 py-1 bg-white border border-[#cbd5e1] rounded-lg text-xs font-semibold text-[#475569] shrink-0">
              {approvedComments.length} تعليق معتمد
            </span>
          </div>

          {/* Pending Alert Notice for User */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>تنويه:</strong> تخضع كافة التعليقات للمراجعة والاعتماد المسبق من قبل 
              <strong> الكاتب أ. نبيل بركات </strong> قبل نشرها للعامة، وذلك للحفاظ على بيئة أدبية نقية وهادفة.
            </p>
          </div>

          {/* Success Message After Submission */}
          {isSubmittedSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-900 space-y-1 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>تم إرسال تعليقك بنجاح!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed pr-7">
                شكراً لمشاركتك الكريمة يا {senderName || 'صديقنا'}. تعليقك الآن قيد المراجعة وسيظهر للجميع فور اعتماده من الأستاذ نبيل بركات.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmittedSuccess(false)}
                className="text-xs text-emerald-800 underline font-semibold pt-1 pr-7 inline-block"
              >
                إضافة تعليق آخر
              </button>
            </div>
          )}

          {/* Comment Form */}
          {!isSubmittedSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-bold text-[#0b385e] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c4924c]" />
                <span>أضف رأيك أو تعليقك</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#334155] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#0b385e]" />
                    <span>الاسم الكامل <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="أدخل اسمك الكريم"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b] focus:outline-none focus:border-[#0b385e]"
                  />
                </div>

                {/* Country (Required by user) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#334155] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0b385e]" />
                    <span>البلد / الدولة <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="مثال: مصر، السعودية، الأردن..."
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b] focus:outline-none focus:border-[#0b385e]"
                  />
                </div>
              </div>

              {/* Comment Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#334155] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#0b385e]" />
                  <span>نص التعليق <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب انطباعك، وجهة نظرك، أو رسالتك الأدبية هنا..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b] focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              {/* Math Verification Challenge (الرقم الحسابي للتأكيد) */}
              <div className="p-3 bg-[#f1f6fb] border border-[#cfdfee] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0b385e] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#c4924c]" />
                    <span>سؤال التحقق البشري (مسألة حسابية) <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={generateNewMathQuestion}
                    className="text-[11px] text-[#0b385e] hover:text-[#c4924c] flex items-center gap-1 transition-colors"
                    title="تغيير المسألة الحسابية"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>مسألة أخرى</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="bg-white border-2 border-[#0b385e]/30 px-3 py-2 rounded-lg font-bold text-sm text-[#0b385e] tracking-wider text-center select-none shadow-inner">
                    ما هو ناتج: {num1} + {num2} = ؟
                  </div>

                  <div className="flex-1">
                    <input
                      type="number"
                      required
                      value={mathAnswer}
                      onChange={(e) => {
                        setMathAnswer(e.target.value);
                        setMathError(false);
                      }}
                      placeholder="أدخل الناتج الحسابي هنا..."
                      className={`w-full bg-white border ${
                        mathError ? 'border-red-500 bg-red-50/50' : 'border-[#cbd5e1]'
                      } rounded-xl px-3 py-2 text-xs text-[#1e293b] focus:outline-none focus:border-[#0b385e]`}
                    />
                  </div>
                </div>

                {mathError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 pt-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>النتيجة الحسابية غير صحيحة! تم تجديد المسألة، يرجى كتابة الناتج الصحيح.</span>
                  </p>
                )}
                <p className="text-[11px] text-[#64748b]">
                  يطلب الموقع حل هذه المسألة الحسابية لمنع التعليقات الآلية والرسائل المزعجة.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال التعليق للمراجعة والاعتماد</span>
              </button>
            </form>
          )}

          {/* Supervisor View of Pending Comments if in Author Mode */}
          {isAuthorMode && pendingComments.length > 0 && (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>لوحة المشرف: تعليقات جديدة بانتظار موافقتك ({pendingComments.length})</span>
                </span>
              </div>

              <div className="space-y-2">
                {pendingComments.map((pc) => (
                  <div key={pc.id} className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0b385e]">{pc.senderName}</span>
                        <span className="text-[11px] text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
                          {pc.country}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                        بانتظار الاعتماد
                      </span>
                    </div>

                    <p className="text-[#334155] leading-relaxed bg-[#f8fafc] p-2 rounded border border-slate-100">
                      {pc.content}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => approveComment(pc.id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>موافقة ونشر الآن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectComment(pc.id)}
                        className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="رفض وحذف التعليق"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>رفض وحذف</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Approved Comments */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#475569] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#0b385e]" />
              <span>التعليقات المنشورة ({approvedComments.length})</span>
            </h4>

            {approvedComments.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#cbd5e1] rounded-xl text-xs text-[#94a3b8] bg-[#f8fafc]">
                لا توجد تعليقات منشورة بعد على هذا المحتوى. كن أول من يشارك برأيه!
              </div>
            ) : (
              <div className="space-y-2.5">
                {approvedComments.map((com) => (
                  <div
                    key={com.id}
                    className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Elegant initial badge (no arbitrary strangers' portraits!) */}
                        <div className="w-7 h-7 rounded-full bg-[#0b385e] text-white flex items-center justify-center font-bold text-xs">
                          {com.senderName ? com.senderName.charAt(0) : 'ق'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0b385e] text-xs">
                              {com.senderName}
                            </span>
                            {com.country && (
                              <span className="text-[10px] text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded">
                                {com.country}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#94a3b8] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {com.date}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => likeComment(com.id)}
                        className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-50" />
                        <span>{com.likesCount || 0}</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#334155] leading-relaxed pr-9">
                      {com.content}
                    </p>

                    {/* Author Reply if available */}
                    {com.authorReply && (
                      <div className="mr-8 mt-2 p-2.5 rounded-lg bg-[#f0f5fa] border-r-2 border-[#c4924c] space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#0b385e]">
                          <CornerDownLeft className="w-3 h-3 text-[#c4924c]" />
                          <span>رد الكاتب أ. نبيل بركات:</span>
                        </div>
                        <p className="text-[#475569] leading-relaxed">
                          {com.authorReply}
                        </p>
                      </div>
                    )}

                    {/* Supervisor delete control */}
                    {isAuthorMode && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                        {confirmDeleteCommentId === com.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                            <span className="text-[10px] text-rose-700 font-bold">تأكيد حذف التعليق؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteVisitorComment(com.id);
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
                            onClick={() => setConfirmDeleteCommentId(com.id)}
                            className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف التعليق</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
