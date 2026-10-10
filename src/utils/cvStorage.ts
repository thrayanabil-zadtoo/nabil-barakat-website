import { CvData, CvUserAccount } from '../types/cv';
import { getDeviceInfo } from './deviceDetector';

const CV_STORAGE_KEY = 'nabil_cv_saved_profile_v1';
const CV_DEVICE_META_KEY = 'nabil_cv_device_meta_v1';
const CV_USER_ACCOUNT_KEY = 'nabil_cv_user_session_v1';
const CV_PUBLIC_RECORDS_KEY = 'nabil_cv_public_records_v1';

export const createDefaultCv = (lang: 'ar' | 'en' = 'ar'): CvData => {
  const isAr = lang === 'ar';
  return {
    id: 'cv_' + Math.random().toString(36).substring(2, 9),
    lang,
    templateId: 'modern',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personalInfo: {
      fullName: isAr ? 'أحمد محمد العلي' : 'Ahmed M. Al-Ali',
      jobTitle: isAr ? 'مطور واجهات ومصمم تجربة مستخدم' : 'Frontend Developer & UI/UX Designer',
      email: isAr ? 'ahmed.ali@example.com' : 'ahmed.ali@example.com',
      phone: '+966 50 123 4567',
      cityCountry: isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia',
      photoUrl: '',
      linkedin: 'linkedin.com/in/ahmedalali',
      website: 'ahmedalali.dev',
      githubOrPortfolio: 'github.com/ahmedalali',
    },
    summary: isAr
      ? 'مهندس برمجيات ومطور واجهات بخبرة تزيد عن 5 سنوات في بناء تطبيقات ويب عصرية وسريعة الاستجابة. شغوف بتحويل الأفكار إلى منتجات رقمية سهلة الاستخدام، مع التركيز على الأداء العالي وتجربة المستخدم الاستثنائية.'
      : 'Passionate Software Engineer & Frontend Developer with 5+ years of experience crafting intuitive, high-performance web applications. Skilled in modern web technologies, responsive design, and user-centric digital experiences.',
    experiences: [
      {
        id: 'exp_1',
        company: isAr ? 'شركة التقنيات المتقدمة' : 'Advanced Tech Solutions',
        position: isAr ? 'مطور واجهات أول (Senior Frontend Developer)' : 'Senior Frontend Developer',
        startDate: '2022',
        endDate: isAr ? 'حتى الآن' : 'Present',
        current: true,
        location: isAr ? 'الرياض' : 'Riyadh',
        description: isAr
          ? 'قيادة فريق تطوير الواجهات لبناء منصات تجارة إلكترونية وأنظمة سحابية. تحسين سرعة تحميل الصفحات بنسبة 40% وتطبيق أفضل معايير إمكانية الوصول وتجربة المستخدم.'
          : 'Leading the frontend engineering team in building scalable e-commerce and cloud portals. Boosted page load performance by 40% while enforcing strict accessibility and UI/UX standards.',
      },
      {
        id: 'exp_2',
        company: isAr ? 'مؤسسة الحلول الرقمية' : 'Digital Horizons Corp',
        position: isAr ? 'مطور ويب وتطبيقات' : 'Web & App Developer',
        startDate: '2019',
        endDate: '2022',
        current: false,
        location: isAr ? 'دبي' : 'Dubai',
        description: isAr
          ? 'تطوير لوحات تحكم متقدمة وواجهات تفاعلية باستخدام React وTypeScript. التعاون مع فرق التصميم وهندسة البيانات لتقديم ميزات متكاملة.'
          : 'Developed interactive dashboards and dynamic interfaces with React & TypeScript. Collaborated closely with design and backend teams to deliver end-to-end features.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        institution: isAr ? 'جامعة الملك سعود' : 'King Saud University',
        degree: isAr ? 'بكالوريوس' : 'Bachelor of Science',
        fieldOfStudy: isAr ? 'علوم الحاسب والمعلومات' : 'Computer Science',
        graduationYear: '2019',
        gradeOrGpa: isAr ? 'مرتبة الشرف الأولى' : 'First Class Honors',
      },
    ],
    skills: [
      { id: 'sk_1', name: 'React & Next.js', level: 'expert' },
      { id: 'sk_2', name: 'TypeScript', level: 'advanced' },
      { id: 'sk_3', name: 'Tailwind CSS', level: 'expert' },
      { id: 'sk_4', name: 'UI / UX Design', level: 'advanced' },
      { id: 'sk_5', name: 'Git & GitHub', level: 'advanced' },
      { id: 'sk_6', name: 'REST APIs & GraphQL', level: 'intermediate' },
    ],
    languages: [
      { id: 'lang_1', name: isAr ? 'العربية' : 'Arabic', proficiency: isAr ? 'اللغة الأم' : 'Native' },
      { id: 'lang_2', name: isAr ? 'الإنجليزية' : 'English', proficiency: isAr ? 'احترافي / طليق' : 'Fluent / Professional' },
    ],
    courses: [
      {
        id: 'c_1',
        name: isAr ? 'شهادة محترف تطوير الويب المتقدم' : 'Advanced Web Engineering Professional',
        issuer: 'Google Developers',
        date: '2023',
      },
    ],
    projects: [
      {
        id: 'prj_1',
        title: isAr ? 'منصة إدارة وتتبع المشاريع السحابية' : 'Cloud Project Workflow Suite',
        description: isAr
          ? 'تطبيق ويب متكامل لإدارة مهام الفرق التقنية مع دعم الإشعارات اللحظية ومزامنة البيانات.'
          : 'Full-stack collaboration platform for tech teams featuring real-time task sync and analytics.',
        url: 'https://example.com/project',
      },
    ],
    additional: {
      awards: [
        {
          id: 'aw_1',
          title: isAr ? 'جائزة أفضل حل تقني مبتكر' : 'Best Tech Innovation Award',
          issuer: isAr ? 'ملتقى التقنية والذكاء الاصطناعي' : 'Tech & AI Summit',
          year: '2023',
        },
      ],
      volunteering: [
        {
          id: 'vol_1',
          role: isAr ? 'مرشد برمجي لطلاب الجامعات' : 'Technical Mentor',
          organization: isAr ? 'مبادرة رواد التقنية' : 'Tech Pioneers Initiative',
          year: '2024',
        },
      ],
      interests: isAr ? ['القراءة والبحث العلمي', 'التصميم التفاعلي', 'الشطرنج'] : ['Reading & Tech Research', 'Interactive Design', 'Chess'],
    },
    includeQrCode: true,
  };
};

/**
 * Save user CV to local storage and cookies with device fingerprint metadata.
 */
export const saveCvToDevice = (cv: CvData): void => {
  try {
    const updated = {
      ...cv,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(updated));

    // Also save device metadata & timestamp for 30+ days persistence
    const dev = getDeviceInfo();
    const meta = {
      savedAt: new Date().toISOString(),
      fingerprint: dev.fingerprint,
      os: dev.os,
      browser: dev.browser,
      cvName: updated.personalInfo.fullName,
      cvTitle: updated.personalInfo.jobTitle,
    };
    localStorage.setItem(CV_DEVICE_META_KEY, JSON.stringify(meta));

    // Write lightweight backup cookie
    try {
      const cookieValue = encodeURIComponent(updated.personalInfo.fullName.substring(0, 30));
      document.cookie = `nabil_cv_owner=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore cookie write restrictions
    }

    // Also update in public records lookup for QR code scanning
    savePublicCvRecord(updated);
  } catch (err) {
    console.error('Error saving CV to device:', err);
  }
};

/**
 * Load CV from device storage. If not found, returns null.
 */
export const loadCvFromDevice = (): { cv: CvData; meta: any } | null => {
  try {
    const raw = localStorage.getItem(CV_STORAGE_KEY);
    if (!raw) return null;
    const cv: CvData = JSON.parse(raw);
    const metaRaw = localStorage.getItem(CV_DEVICE_META_KEY);
    const meta = metaRaw ? JSON.parse(metaRaw) : null;
    return { cv, meta };
  } catch {
    return null;
  }
};

/**
 * Save CV to public records registry so when someone scans the QR code,
 * the CV can be retrieved and shown in public view mode.
 */
export const savePublicCvRecord = (cv: CvData): void => {
  try {
    const raw = localStorage.getItem(CV_PUBLIC_RECORDS_KEY);
    const records: Record<string, CvData> = raw ? JSON.parse(raw) : {};
    records[cv.id] = cv;
    localStorage.setItem(CV_PUBLIC_RECORDS_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
};

export const getPublicCvRecord = (id: string): CvData | null => {
  try {
    const raw = localStorage.getItem(CV_PUBLIC_RECORDS_KEY);
    if (!raw) return null;
    const records: Record<string, CvData> = JSON.parse(raw);
    return records[id] || null;
  } catch {
    return null;
  }
};

/**
 * User Account Session Management (Free 1-click registration/login)
 */
export const getActiveCvUser = (): CvUserAccount | null => {
  try {
    const raw = localStorage.getItem(CV_USER_ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveCvUserSession = (user: CvUserAccount): void => {
  try {
    localStorage.setItem(CV_USER_ACCOUNT_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const logoutCvUser = (): void => {
  try {
    localStorage.removeItem(CV_USER_ACCOUNT_KEY);
  } catch {
    // ignore
  }
};
