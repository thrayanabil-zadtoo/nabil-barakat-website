import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CvData } from '../../types/cv';
import { getCvPublicUrl } from '../../config/siteDomain';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface CvPreviewProps {
  cv: CvData;
  publicMode?: boolean;
}

export const CvPreview: React.FC<CvPreviewProps> = ({ cv, publicMode = false }) => {
  const isAr = cv.lang === 'ar';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const publicUrl = getCvPublicUrl(cv.id);

  useEffect(() => {
    if (cv.includeQrCode) {
      QRCode.toDataURL(publicUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#07243c',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [cv.id, cv.includeQrCode, publicUrl]);

  const p = cv.personalInfo;

  // Labels dictionary
  const labels = {
    summary: isAr ? 'الملخص المهني' : 'Professional Summary',
    experience: isAr ? 'الخبرات العملية' : 'Work Experience',
    education: isAr ? 'التعليم والمؤهلات' : 'Education',
    skills: isAr ? 'المهارات والقدرات' : 'Skills & Competencies',
    languages: isAr ? 'اللغات' : 'Languages',
    courses: isAr ? 'الدورات والشهادات المهنية' : 'Certifications & Courses',
    projects: isAr ? 'أبرز المشاريع' : 'Key Projects',
    awards: isAr ? 'الجوائز والتكريمات' : 'Honors & Awards',
    volunteering: isAr ? 'العمل التطوعي' : 'Volunteering',
    publications: isAr ? 'المنشورات والأبحاث' : 'Publications & Research',
    interests: isAr ? 'الهوايات والاهتمامات' : 'Interests',
    scanMe: isAr ? 'امسح الرمز للاطلاع على السيرة إلكترونياً' : 'Scan to view interactive CV',
  };

  return (
    <div
      id="cv-printable-content"
      dir={isAr ? 'rtl' : 'ltr'}
      className={`cv-print-container bg-white text-slate-900 w-full max-w-[800px] mx-auto shadow-xl rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden text-sm leading-relaxed transition-all duration-300 font-sans print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full print:m-0`}
      style={{
        minHeight: '297mm', // A4 proportion
      }}
    >
      {/* ===================== TEMPLATE 1: MODERN (عصري) ===================== */}
      {cv.templateId === 'modern' && (
        <div className="flex flex-col md:flex-row min-h-[297mm]">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-[#0a2e4c] text-white p-5 sm:p-6 space-y-4 sm:space-y-6 shrink-0 print:w-64 print:bg-[#0a2e4c] print:text-white">
            {/* Avatar / Initials */}
            <div className="flex flex-col items-center text-center">
              {p.photoUrl ? (
                <img
                  src={p.photoUrl}
                  alt={p.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-[#dfa85b] shadow-md mb-2 sm:mb-3"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#dfa85b] text-[#0a2e4c] font-black text-xl sm:text-2xl flex items-center justify-center shadow-inner mb-2 sm:mb-3">
                  {p.fullName ? p.fullName.charAt(0) : 'CV'}
                </div>
              )}
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">{p.fullName}</h2>
              <p className="text-xs text-[#dfa85b] font-medium mt-0.5">{p.jobTitle}</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-2.5 text-xs text-slate-200 border-t border-white/10 pt-4">
              {p.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#dfa85b] shrink-0" />
                  <span className="truncate">{p.email}</span>
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#dfa85b] shrink-0" />
                  <span dir="ltr" className="text-xs">{p.phone}</span>
                </div>
              )}
              {p.cityCountry && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#dfa85b] shrink-0" />
                  <span>{p.cityCountry}</span>
                </div>
              )}
              {p.linkedin && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-3.5 h-3.5 text-[#dfa85b] shrink-0" />
                  <span className="truncate">{p.linkedin}</span>
                </div>
              )}
              {p.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#dfa85b] shrink-0" />
                  <span className="truncate">{p.website}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {cv.skills.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <h3 className="text-xs font-bold text-[#dfa85b] uppercase tracking-wider">{labels.skills}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {cv.skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 bg-white/10 text-white rounded text-[11px] font-medium border border-white/10"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {cv.languages.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-2">
                <h3 className="text-xs font-bold text-[#dfa85b] uppercase tracking-wider">{labels.languages}</h3>
                <div className="space-y-1 text-xs">
                  {cv.languages.map((l) => (
                    <div key={l.id} className="flex justify-between items-center text-slate-200">
                      <span>{l.name}</span>
                      <span className="text-[10px] text-[#dfa85b]">{l.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code in Sidebar */}
            {cv.includeQrCode && qrDataUrl && (
              <div className="border-t border-white/10 pt-4 flex flex-col items-center text-center">
                <div className="p-1.5 bg-white rounded-lg shadow-xs">
                  <img src={qrDataUrl} alt="CV QR Code" className="w-20 h-20" />
                </div>
                <span className="text-[9px] text-slate-300 mt-1 max-w-[120px]">{labels.scanMe}</span>
              </div>
            )}
          </aside>

          {/* Main Body */}
          <main className="flex-1 p-6 md:p-8 space-y-6">
            {/* Summary */}
            {cv.summary && (
              <section className="space-y-1.5">
                <h3 className="text-xs font-black text-[#0a2e4c] uppercase tracking-wider border-b-2 border-[#dfa85b] pb-1 inline-block">
                  {labels.summary}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed pt-1 text-justify">{cv.summary}</p>
              </section>
            )}

            {/* Experience */}
            {cv.experiences.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-black text-[#0a2e4c] uppercase tracking-wider border-b-2 border-[#dfa85b] pb-1 inline-block">
                  {labels.experience}
                </h3>
                <div className="space-y-3">
                  {cv.experiences.map((exp) => (
                    <div key={exp.id} className="relative pl-3 border-l-2 border-slate-200 space-y-1 rtl:pl-0 rtl:pr-3 rtl:border-l-0 rtl:border-r-2 rtl:border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{exp.position}</span>
                        <span className="text-[10px] text-[#0a2e4c] font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {exp.startDate} - {exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {exp.company} {exp.location ? `· ${exp.location}` : ''}
                      </div>
                      {exp.description && (
                        <p className="text-[11px] text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {cv.education.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="text-xs font-black text-[#0a2e4c] uppercase tracking-wider border-b-2 border-[#dfa85b] pb-1 inline-block">
                  {labels.education}
                </h3>
                <div className="space-y-2">
                  {cv.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {edu.degree} - {edu.fieldOfStudy}
                        </div>
                        <div className="text-[11px] text-slate-600">{edu.institution}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{edu.graduationYear}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {cv.projects.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="text-xs font-black text-[#0a2e4c] uppercase tracking-wider border-b-2 border-[#dfa85b] pb-1 inline-block">
                  {labels.projects}
                </h3>
                <div className="space-y-2">
                  {cv.projects.map((proj) => (
                    <div key={proj.id} className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-900">{proj.title}</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Courses / Certifications */}
            {cv.courses.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-black text-[#0a2e4c] uppercase tracking-wider border-b-2 border-[#dfa85b] pb-1 inline-block">
                  {labels.courses}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {cv.courses.map((c) => (
                    <div key={c.id} className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="font-semibold text-slate-800">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.issuer} · {c.date}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Additional: Awards & Volunteering */}
            {cv.additional?.awards && cv.additional.awards.length > 0 && (
              <section className="space-y-1.5">
                <h3 className="text-xs font-black text-[#0a2e4c] uppercase tracking-wider border-b-2 border-[#dfa85b] pb-1 inline-block">
                  {labels.awards}
                </h3>
                <div className="space-y-1 text-xs">
                  {cv.additional.awards.map((a) => (
                    <div key={a.id} className="flex justify-between items-center text-slate-700">
                      <span>• {a.title} ({a.issuer})</span>
                      <span className="text-[10px] text-slate-500 font-mono">{a.year}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      )}

      {/* ===================== TEMPLATE 2: CLASSIC FORMAL (كلاسيكي رسمي) ===================== */}
      {cv.templateId === 'classic' && (
        <div className="p-8 md:p-12 space-y-6">
          {/* Header */}
          <header className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{p.fullName}</h1>
              <p className="text-sm font-semibold text-[#0a2e4c]">{p.jobTitle}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                {p.phone && <span dir="ltr">{p.phone}</span>}
                {p.email && <span>{p.email}</span>}
                {p.cityCountry && <span>{p.cityCountry}</span>}
                {p.linkedin && <span>{p.linkedin}</span>}
              </div>
            </div>

            {cv.includeQrCode && qrDataUrl && (
              <div className="shrink-0 flex flex-col items-center">
                <img src={qrDataUrl} alt="QR Code" className="w-18 h-18 border border-slate-300 p-1 rounded" />
                <span className="text-[8px] text-slate-500 mt-0.5">{labels.scanMe}</span>
              </div>
            )}
          </header>

          {/* Summary */}
          {cv.summary && (
            <section className="space-y-1.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-1">
                {labels.summary}
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.summary}</p>
            </section>
          )}

          {/* Experience */}
          {cv.experiences.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-1">
                {labels.experience}
              </h2>
              <div className="space-y-3">
                {cv.experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-xs text-slate-900">{exp.position} — <span className="font-medium text-slate-700">{exp.company}</span></span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {exp.startDate} – {exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 leading-relaxed text-justify">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {cv.education.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-1">
                {labels.education}
              </h2>
              <div className="space-y-2">
                {cv.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {edu.degree} في {edu.fieldOfStudy} — <span className="font-medium text-slate-700">{edu.institution}</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{edu.graduationYear}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cv.skills.length > 0 && (
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-1">
                  {labels.skills}
                </h2>
                <div className="flex flex-wrap gap-1 pt-1">
                  {cv.skills.map((s) => (
                    <span key={s.id} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-800">
                      {s.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {cv.languages.length > 0 && (
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-1">
                  {labels.languages}
                </h2>
                <div className="space-y-1 text-xs pt-1">
                  {cv.languages.map((l) => (
                    <div key={l.id} className="flex justify-between text-slate-700">
                      <span>{l.name}</span>
                      <span className="text-slate-500 text-[11px]">{l.proficiency}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ===================== TEMPLATE 3: SIMPLE ELEGANT (بسيط وأنيق) ===================== */}
      {cv.templateId === 'simple' && (
        <div className="p-8 md:p-10 space-y-6">
          <header className="text-center space-y-2 border-b border-[#dfa85b]/40 pb-5">
            <h1 className="text-2xl font-bold text-[#0a2e4c]">{p.fullName}</h1>
            <p className="text-xs font-medium text-[#c4924c] tracking-widest uppercase">{p.jobTitle}</p>
            <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-slate-600 pt-1">
              {p.phone && <span dir="ltr">{p.phone}</span>}
              {p.email && <span>{p.email}</span>}
              {p.cityCountry && <span>{p.cityCountry}</span>}
              {p.website && <span>{p.website}</span>}
            </div>
          </header>

          {cv.summary && (
            <section className="text-center max-w-xl mx-auto">
              <p className="text-xs text-slate-600 leading-relaxed">{cv.summary}</p>
            </section>
          )}

          {cv.experiences.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-center text-[#0a2e4c] tracking-widest uppercase flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-[#dfa85b]"></span>
                <span>{labels.experience}</span>
                <span className="w-8 h-px bg-[#dfa85b]"></span>
              </h2>
              <div className="space-y-3">
                {cv.experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-900">{exp.position}</span>
                      <span className="text-[10px] text-slate-500">
                        {exp.startDate} – {exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#c4924c] font-medium">{exp.company}</div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 leading-relaxed text-justify">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.education.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-center text-[#0a2e4c] tracking-widest uppercase flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-[#dfa85b]"></span>
                <span>{labels.education}</span>
                <span className="w-8 h-px bg-[#dfa85b]"></span>
              </h2>
              <div className="space-y-2">
                {cv.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{edu.degree} · {edu.fieldOfStudy} ({edu.institution})</span>
                    <span className="text-[10px] text-slate-500">{edu.graduationYear}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.skills.length > 0 && (
            <section className="space-y-2 text-center">
              <h2 className="text-xs font-bold text-[#0a2e4c] tracking-widest uppercase">
                {labels.skills}
              </h2>
              <div className="flex flex-wrap justify-center gap-1.5">
                {cv.skills.map((s) => (
                  <span key={s.id} className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-700">
                    {s.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {cv.includeQrCode && qrDataUrl && (
            <footer className="pt-4 border-t border-slate-100 flex justify-center items-center gap-3">
              <img src={qrDataUrl} alt="QR Code" className="w-14 h-14" />
              <span className="text-[9px] text-slate-400 max-w-[140px]">{labels.scanMe}</span>
            </footer>
          )}
        </div>
      )}

      {/* ===================== TEMPLATE 4: EXECUTIVE CORPORATE (احترافي للشركات) ===================== */}
      {cv.templateId === 'corporate' && (
        <div className="space-y-0">
          <header className="bg-gradient-to-r from-[#0b385e] to-[#062138] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">{p.fullName}</h1>
              <p className="text-xs text-[#dfa85b] font-bold tracking-wider uppercase">{p.jobTitle}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                {p.email && <span>{p.email}</span>}
                {p.phone && <span dir="ltr">{p.phone}</span>}
                {p.cityCountry && <span>{p.cityCountry}</span>}
              </div>
            </div>
            {cv.includeQrCode && qrDataUrl && (
              <div className="bg-white p-1 rounded-lg shrink-0 flex flex-col items-center">
                <img src={qrDataUrl} alt="QR Code" className="w-16 h-16" />
              </div>
            )}
          </header>

          <div className="p-6 sm:p-8 space-y-6">
            {cv.summary && (
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h2 className="text-xs font-black text-[#0b385e] uppercase tracking-wider mb-1.5">{labels.summary}</h2>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.summary}</p>
              </section>
            )}

            {cv.experiences.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black text-[#0b385e] uppercase tracking-wider border-b border-slate-200 pb-1">
                  {labels.experience}
                </h2>
                <div className="space-y-3">
                  {cv.experiences.map((exp) => (
                    <div key={exp.id} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-900">{exp.position}</span>
                        <span className="text-[10px] font-bold text-[#0b385e] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {exp.startDate} - {exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">{exp.company}</div>
                      {exp.description && (
                        <p className="text-xs text-slate-600 leading-relaxed text-justify pt-1">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cv.education.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-black text-[#0b385e] uppercase tracking-wider border-b border-slate-200 pb-1">
                    {labels.education}
                  </h2>
                  <div className="space-y-2">
                    {cv.education.map((edu) => (
                      <div key={edu.id} className="text-xs">
                        <div className="font-bold text-slate-900">{edu.degree} · {edu.fieldOfStudy}</div>
                        <div className="text-slate-600 text-[11px]">{edu.institution} ({edu.graduationYear})</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {cv.skills.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-black text-[#0b385e] uppercase tracking-wider border-b border-slate-200 pb-1">
                    {labels.skills}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {cv.skills.map((s) => (
                      <span key={s.id} className="px-2 py-0.5 bg-[#0b385e]/10 text-[#0b385e] rounded text-[11px] font-medium">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TEMPLATE 5: CREATIVE BOLD (إبداعي) ===================== */}
      {cv.templateId === 'creative' && (
        <div className="space-y-6 p-6 sm:p-8">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#0b385e] pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#c4924c] uppercase tracking-widest">RESUME / CURRICULUM VITAE</span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{p.fullName}</h1>
              <p className="text-xs font-bold text-slate-600">{p.jobTitle}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="space-y-1 text-slate-600 text-left rtl:text-right">
                {p.email && <div>{p.email}</div>}
                {p.phone && <div dir="ltr">{p.phone}</div>}
                {p.cityCountry && <div>{p.cityCountry}</div>}
              </div>
              {cv.includeQrCode && qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 border rounded p-0.5" />
              )}
            </div>
          </header>

          {cv.summary && (
            <section className="space-y-1">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{cv.summary}</p>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-5">
              {cv.experiences.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-black text-white bg-[#0b385e] px-2.5 py-1 rounded inline-block uppercase">
                    {labels.experience}
                  </h2>
                  <div className="space-y-3">
                    {cv.experiences.map((exp) => (
                      <div key={exp.id} className="space-y-1 border-b border-slate-100 pb-2">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-slate-900">{exp.position}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {exp.startDate} - {exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-[#c4924c]">{exp.company}</div>
                        {exp.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {cv.projects.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-black text-white bg-[#0b385e] px-2.5 py-1 rounded inline-block uppercase">
                    {labels.projects}
                  </h2>
                  <div className="space-y-2">
                    {cv.projects.map((pr) => (
                      <div key={pr.id} className="text-xs space-y-0.5">
                        <span className="font-bold text-slate-900">{pr.title}</span>
                        <p className="text-[11px] text-slate-600">{pr.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              {cv.skills.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-black text-slate-900 uppercase border-b border-slate-200 pb-1">
                    {labels.skills}
                  </h2>
                  <div className="flex flex-wrap gap-1">
                    {cv.skills.map((s) => (
                      <span key={s.id} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-800 font-semibold">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {cv.education.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-black text-slate-900 uppercase border-b border-slate-200 pb-1">
                    {labels.education}
                  </h2>
                  <div className="space-y-2 text-xs">
                    {cv.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="font-bold text-slate-900">{edu.degree}</div>
                        <div className="text-slate-600 text-[11px]">{edu.institution} · {edu.graduationYear}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {cv.languages.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-black text-slate-900 uppercase border-b border-slate-200 pb-1">
                    {labels.languages}
                  </h2>
                  <div className="space-y-1 text-xs">
                    {cv.languages.map((l) => (
                      <div key={l.id} className="flex justify-between text-slate-700">
                        <span>{l.name}</span>
                        <span className="text-[10px] text-slate-500">{l.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TEMPLATE 6: ACADEMIC SCHOLAR (أكاديمي) ===================== */}
      {cv.templateId === 'academic' && (
        <div className="p-8 md:p-12 space-y-6">
          <header className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-normal text-slate-900">{p.fullName}</h1>
            <p className="text-xs font-semibold text-slate-700">{p.jobTitle}</p>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-600 pt-1">
              {p.email && <span>{p.email}</span>}
              {p.phone && <span dir="ltr">{p.phone}</span>}
              {p.cityCountry && <span>{p.cityCountry}</span>}
            </div>
          </header>

          {cv.summary && (
            <section className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                {labels.summary}
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.summary}</p>
            </section>
          )}

          {cv.education.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                {labels.education}
              </h2>
              <div className="space-y-2">
                {cv.education.map((edu) => (
                  <div key={edu.id} className="text-xs flex justify-between items-baseline">
                    <span className="font-semibold text-slate-900">
                      {edu.degree} في {edu.fieldOfStudy} — {edu.institution}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{edu.graduationYear}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.experiences.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                {labels.experience}
              </h2>
              <div className="space-y-2.5">
                {cv.experiences.map((exp) => (
                  <div key={exp.id} className="text-xs space-y-0.5">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{exp.position} · {exp.company}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {exp.startDate} – {exp.current ? (isAr ? 'الآن' : 'Present') : exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-slate-600 leading-relaxed text-justify">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.courses.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                {labels.courses}
              </h2>
              <div className="space-y-1 text-xs">
                {cv.courses.map((c) => (
                  <div key={c.id} className="flex justify-between text-slate-700">
                    <span>• {c.name} ({c.issuer})</span>
                    <span className="text-[10px] text-slate-500 font-mono">{c.date}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.includeQrCode && qrDataUrl && (
            <div className="pt-4 border-t border-slate-200 flex justify-end items-center gap-2">
              <span className="text-[9px] text-slate-500">{labels.scanMe}</span>
              <img src={qrDataUrl} alt="QR Code" className="w-12 h-12" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
