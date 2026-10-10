export type CvLanguage = 'ar' | 'en';

export type CvTemplateId =
  | 'classic'
  | 'modern'
  | 'simple'
  | 'corporate'
  | 'creative'
  | 'academic';

export interface CvExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location?: string;
  description: string;
}

export interface CvEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  gradeOrGpa?: string;
}

export interface CvSkill {
  id: string;
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CvLanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface CvCourse {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface CvProject {
  id: string;
  title: string;
  description: string;
  url?: string;
}

export interface CvPersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  cityCountry: string;
  photoUrl?: string;
  linkedin?: string;
  website?: string;
  githubOrPortfolio?: string;
}

export interface CvAdditionalSections {
  awards?: Array<{ id: string; title: string; issuer: string; year: string }>;
  volunteering?: Array<{ id: string; role: string; organization: string; year: string }>;
  publications?: Array<{ id: string; title: string; publisher: string; year: string }>;
  references?: Array<{ id: string; name: string; company: string; contact: string }>;
  interests?: string[];
}

export interface CvData {
  id: string;
  lang: CvLanguage;
  templateId: CvTemplateId;
  createdAt: string;
  updatedAt: string;
  personalInfo: CvPersonalInfo;
  summary: string;
  experiences: CvExperience[];
  education: CvEducation[];
  skills: CvSkill[];
  languages: CvLanguageItem[];
  courses: CvCourse[];
  projects: CvProject[];
  additional: CvAdditionalSections;
  includeQrCode: boolean;
  qrCodeLink?: string;
}

export interface CvUserAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  password?: string;
  createdAt: string;
  isPro: boolean;
  savedCvIds: string[];
}
