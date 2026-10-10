import React, { useState } from 'react';
import { CvData, CvExperience, CvEducation, CvSkill, CvLanguageItem, CvCourse, CvProject } from '../../types/cv';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  Languages,
  Award,
  FolderGit2,
  FileCheck,
  QrCode,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CvEditorProps {
  cv: CvData;
  onChange: (updated: CvData) => void;
  isProUser: boolean;
  onOpenAuthModal: () => void;
}

export const CvEditor: React.FC<CvEditorProps> = ({
  cv,
  onChange,
  isProUser,
  onOpenAuthModal,
}) => {
  const isAr = cv.lang === 'ar';
  const [activeAccordion, setActiveAccordion] = useState<string>('personal');

  const toggleSection = (id: string) => {
    setActiveAccordion((prev) => (prev === id ? '' : id));
  };

  const updatePersonalInfo = (field: keyof CvData['personalInfo'], value: string) => {
    onChange({
      ...cv,
      personalInfo: {
        ...cv.personalInfo,
        [field]: value,
      },
    });
  };

  // AI assistant polish for summary
  const handleAiPolishSummary = () => {
    if (!isProUser) {
      onOpenAuthModal();
      return;
    }
    const role = cv.personalInfo.jobTitle || (isAr ? 'متخصص محترف' : 'Professional');
    const enhancedAr = `${role} متميز ومتحمس بخبرة عملية وسجل حافل بالإنجازات. أتمتع بمهارات تواصل وحل مشكلات قوية، وقدرة عالية على قيادة المبادرات والتعاون ضمن فرق العمل المتعددة لتقديم أعلى قيمة للمؤسسة والعملاء.`;
    const enhancedEn = `Accomplished and driven ${role} with a proven track record of delivering impactful results. Known for strong analytical, communication, and problem-solving skills, with a passion for innovation, operational efficiency, and team collaboration.`;
    onChange({
      ...cv,
      summary: isAr ? enhancedAr : enhancedEn,
    });
  };

  // Experience handlers
  const addExperience = () => {
    const newExp: CvExperience = {
      id: 'exp_' + Date.now(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    onChange({
      ...cv,
      experiences: [...cv.experiences, newExp],
    });
  };

  const updateExperience = (id: string, field: keyof CvExperience, value: any) => {
    onChange({
      ...cv,
      experiences: cv.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const deleteExperience = (id: string) => {
    onChange({
      ...cv,
      experiences: cv.experiences.filter((exp) => exp.id !== id),
    });
  };

  // Education handlers
  const addEducation = () => {
    const newEdu: CvEducation = {
      id: 'edu_' + Date.now(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: '',
    };
    onChange({
      ...cv,
      education: [...cv.education, newEdu],
    });
  };

  const updateEducation = (id: string, field: keyof CvEducation, value: any) => {
    onChange({
      ...cv,
      education: cv.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const deleteEducation = (id: string) => {
    onChange({
      ...cv,
      education: cv.education.filter((edu) => edu.id !== id),
    });
  };

  // Skills handlers
  const [newSkillName, setNewSkillName] = useState('');
  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const newSkill: CvSkill = {
      id: 'sk_' + Date.now(),
      name: newSkillName.trim(),
    };
    onChange({
      ...cv,
      skills: [...cv.skills, newSkill],
    });
    setNewSkillName('');
  };

  const deleteSkill = (id: string) => {
    onChange({
      ...cv,
      skills: cv.skills.filter((sk) => sk.id !== id),
    });
  };

  // Languages handlers
  const addLanguage = () => {
    const newLang: CvLanguageItem = {
      id: 'lang_' + Date.now(),
      name: '',
      proficiency: isAr ? 'جيد جداً' : 'Fluent',
    };
    onChange({
      ...cv,
      languages: [...cv.languages, newLang],
    });
  };

  const updateLanguage = (id: string, field: keyof CvLanguageItem, value: string) => {
    onChange({
      ...cv,
      languages: cv.languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    });
  };

  const deleteLanguage = (id: string) => {
    onChange({
      ...cv,
      languages: cv.languages.filter((l) => l.id !== id),
    });
  };

  // Projects handlers
  const addProject = () => {
    const newProj: CvProject = {
      id: 'prj_' + Date.now(),
      title: '',
      description: '',
    };
    onChange({
      ...cv,
      projects: [...cv.projects, newProj],
    });
  };

  const updateProject = (id: string, field: keyof CvProject, value: string) => {
    onChange({
      ...cv,
      projects: cv.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const deleteProject = (id: string) => {
    onChange({
      ...cv,
      projects: cv.projects.filter((p) => p.id !== id),
    });
  };

  // Courses handlers
  const addCourse = () => {
    const newCourse: CvCourse = {
      id: 'c_' + Date.now(),
      name: '',
      issuer: '',
      date: '',
    };
    onChange({
      ...cv,
      courses: [...cv.courses, newCourse],
    });
  };

  const updateCourse = (id: string, field: keyof CvCourse, value: string) => {
    onChange({
      ...cv,
      courses: cv.courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  const deleteCourse = (id: string) => {
    onChange({
      ...cv,
      courses: cv.courses.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. PERSONAL INFORMATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <User className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'المعلومات الشخصية وبيانات الاتصال' : 'Personal & Contact Information'}</span>
          </div>
          {activeAccordion === 'personal' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'personal' && (
          <div className="p-4 space-y-3.5 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={cv.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder={isAr ? 'مثال: محمد أحمد العلي' : 'e.g. John Doe'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e] focus:ring-1 focus:ring-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'المسمى الوظيفي *' : 'Professional Title *'}
                </label>
                <input
                  type="text"
                  value={cv.personalInfo.jobTitle}
                  onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                  placeholder={isAr ? 'مثال: مهندس برمجيات / مدير تسويق' : 'e.g. Software Engineer'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e] focus:ring-1 focus:ring-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={cv.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'رقم الهاتف / الجوال' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={cv.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'المدينة / الدولة' : 'City & Country'}
                </label>
                <input
                  type="text"
                  value={cv.personalInfo.cityCountry}
                  onChange={(e) => updatePersonalInfo('cityCountry', e.target.value)}
                  placeholder={isAr ? 'الرياض، المملكة العربية السعودية' : 'London, United Kingdom'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'رابط LinkedIn (اختياري)' : 'LinkedIn Profile'}
                </label>
                <input
                  type="text"
                  value={cv.personalInfo.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'رابط الموقع الشخصي أو معرض الأعمال (اختياري)' : 'Website / Portfolio'}
              </label>
              <input
                type="text"
                value={cv.personalInfo.website || ''}
                onChange={(e) => updatePersonalInfo('website', e.target.value)}
                placeholder="myportfolio.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. PROFESSIONAL SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('summary')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <Sparkles className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'الملخص والنبذة المهنية' : 'Professional Summary'}</span>
          </div>
          {activeAccordion === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'summary' && (
          <div className="p-4 space-y-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {isAr
                  ? 'اكتب نبذة مختصرة وجذابة عن خبراتك وطموحاتك المهنية.'
                  : 'Write a compelling brief summary highlighting your experience and career aspirations.'}
              </span>
              <button
                type="button"
                onClick={handleAiPolishSummary}
                className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="تحسين وصياغة احترافية بالذكاء الاصطناعي"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAr ? 'صياغة بالذكاء الاصطناعي ✨' : 'AI Polish ✨'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={cv.summary}
              onChange={(e) => onChange({ ...cv, summary: e.target.value })}
              placeholder={
                isAr
                  ? 'مهندس برمجيات بخبرة 5 سنوات في تطوير تطبيقات الويب، شغوف ببناء حلول رقمية موثوقة وعالية الأداء...'
                  : 'Experienced professional with a track record of delivering high quality results...'
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e] leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 3. WORK EXPERIENCES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('experience')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <Briefcase className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'الخبرات والمسار الوظيفي' : 'Work Experience'} ({cv.experiences.length})</span>
          </div>
          {activeAccordion === 'experience' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'experience' && (
          <div className="p-4 space-y-4 border-t border-slate-200">
            {cv.experiences.map((exp, idx) => (
              <div key={exp.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b385e]">
                    {isAr ? `الوظيفة #${idx + 1}` : `Job #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteExperience(exp.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                    title="حذف هذه الوظيفة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'المسمى الوظيفي' : 'Position / Title'}
                    </label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      placeholder={isAr ? 'مثال: مدير مشروعات' : 'e.g. Project Manager'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'اسم الشركة / المؤسسة' : 'Company'}
                    </label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder={isAr ? 'مثال: شركة آفاق التقنية' : 'e.g. Acme Corp'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'تاريخ البدء' : 'Start Date'}
                    </label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      placeholder="2021"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'تاريخ الانتهاء' : 'End Date'}
                    </label>
                    <input
                      type="text"
                      disabled={exp.current}
                      value={exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      placeholder="2024"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id={`current_${exp.id}`}
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                    className="rounded text-[#0b385e]"
                  />
                  <label htmlFor={`current_${exp.id}`} className="text-xs text-slate-700 cursor-pointer">
                    {isAr ? 'أعمل هنا حالياً (حتى الآن)' : 'I currently work here'}
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {isAr ? 'المهام والإنجازات البارزة' : 'Key Responsibilities & Achievements'}
                  </label>
                  <textarea
                    rows={2}
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder={
                      isAr
                        ? 'إدارة فريق عمل من 6 أفراد، رفع كفاءة الإنتاج بنسبة 30%، وتطبيق منهجيات Agile...'
                        : 'Led cross-functional initiatives and enhanced operational workflows...'
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#0b385e] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة خبرة عملية أخرى' : 'Add Another Experience'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. EDUCATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('education')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <GraduationCap className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'التعليم والمؤهلات' : 'Education'} ({cv.education.length})</span>
          </div>
          {activeAccordion === 'education' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'education' && (
          <div className="p-4 space-y-4 border-t border-slate-200">
            {cv.education.map((edu, idx) => (
              <div key={edu.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b385e]">
                    {isAr ? `المؤهل #${idx + 1}` : `Degree #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteEducation(edu.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'الدرجة العلمية' : 'Degree'}
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      placeholder={isAr ? 'بكالوريوس / ماجستير' : 'B.Sc / M.Sc'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'التخصص الدراسي' : 'Field of Study'}
                    </label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                      placeholder={isAr ? 'هندسة حاسب / إدارة أعمال' : 'Computer Science'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'اسم الجامعة أو المعهد' : 'University / Institution'}
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      placeholder={isAr ? 'جامعة الملك سعود' : 'Harvard University'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isAr ? 'سنة التخرج' : 'Graduation Year'}
                    </label>
                    <input
                      type="text"
                      value={edu.graduationYear}
                      onChange={(e) => updateEducation(edu.id, 'graduationYear', e.target.value)}
                      placeholder="2020"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addEducation}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#0b385e] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة مؤهل تعليمي آخر' : 'Add Another Degree'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. SKILLS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('skills')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <FolderGit2 className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'المهارات والقدرات' : 'Skills'} ({cv.skills.length})</span>
          </div>
          {activeAccordion === 'skills' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'skills' && (
          <div className="p-4 space-y-3 border-t border-slate-200">
            <form onSubmit={addSkill} className="flex gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder={isAr ? 'اكتب مهارة واضغط إضافة (مثل: Photoshop, إدارة الوقت)' : 'Type skill & press Add'}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0b385e] hover:bg-[#07243c] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة' : 'Add'}</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {cv.skills.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200"
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => deleteSkill(s.id)}
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. LANGUAGES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('languages')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <Languages className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'اللغات' : 'Languages'} ({cv.languages.length})</span>
          </div>
          {activeAccordion === 'languages' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'languages' && (
          <div className="p-4 space-y-3 border-t border-slate-200">
            {cv.languages.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={l.name}
                  onChange={(e) => updateLanguage(l.id, 'name', e.target.value)}
                  placeholder={isAr ? 'اسم اللغة (مثل: العربية)' : 'Language (e.g. English)'}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={l.proficiency}
                  onChange={(e) => updateLanguage(l.id, 'proficiency', e.target.value)}
                  placeholder={isAr ? 'المستوى (طليق / متوسط)' : 'Proficiency (e.g. Fluent)'}
                  className="w-32 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => deleteLanguage(l.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLanguage}
              className="text-xs text-[#0b385e] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة لغة' : 'Add Language'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. COURSES & CERTIFICATES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('courses')}
          className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800 text-xs sm:text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#0b385e]">
            <FileCheck className="w-4 h-4 text-[#c4924c]" />
            <span>{isAr ? 'الدورات والشهادات المهنية' : 'Certifications & Courses'} ({cv.courses.length})</span>
          </div>
          {activeAccordion === 'courses' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {activeAccordion === 'courses' && (
          <div className="p-4 space-y-3 border-t border-slate-200">
            {cv.courses.map((c) => (
              <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCourse(c.id, 'name', e.target.value)}
                    placeholder={isAr ? 'اسم الدورة أو الشهادة' : 'Course / Certificate Name'}
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => deleteCourse(c.id)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={c.issuer}
                    onChange={(e) => updateCourse(c.id, 'issuer', e.target.value)}
                    placeholder={isAr ? 'الجهة المانحة' : 'Issuer (e.g. Google)'}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={c.date}
                    onChange={(e) => updateCourse(c.id, 'date', e.target.value)}
                    placeholder={isAr ? 'السنة / التاريخ' : 'Year / Date'}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addCourse}
              className="text-xs text-[#0b385e] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة دورة أو شهادة' : 'Add Certificate'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 8. QR CODE EMBEDDING TOGGLE */}
      <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[#0b385e]" />
          <div>
            <div className="text-xs font-bold text-[#0b385e]">
              {isAr ? 'إضافة رمز QR الذكي للسيرة الذاتية' : 'Include Smart QR Code'}
            </div>
            <div className="text-[11px] text-slate-500">
              {isAr
                ? 'يسمح لأصحاب العمل بمسح الرمز والاطلاع على سيرتك الذاتية الإلكترونية فوراً.'
                : 'Allows recruiters to scan and view your live interactive profile.'}
            </div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={cv.includeQrCode}
            onChange={(e) => onChange({ ...cv, includeQrCode: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0b385e]"></div>
        </label>
      </div>
    </div>
  );
};
