/**
 * Centralized Site Domain & Links Configuration
 * Official Base URL: nb.zadtoo.com
 */

export const DEFAULT_OFFICIAL_DOMAIN = 'nb.zadtoo.com';
export const DEFAULT_OFFICIAL_URL = 'https://nb.zadtoo.com';

export const getSiteDomain = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('nabil_official_site_domain');
    if (custom && custom.trim() && custom.trim() !== 'zadtoo.com/nb') {
      return custom.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }
  }
  return DEFAULT_OFFICIAL_DOMAIN;
};

export const getSiteBaseUrl = (): string => {
  const domain = getSiteDomain();
  return `https://${domain}`;
};

export const setCustomSiteDomain = (domain: string): void => {
  if (typeof window !== 'undefined') {
    const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem('nabil_official_site_domain', clean);
    } else {
      localStorage.removeItem('nabil_official_site_domain');
    }
  }
};

export const getCvPublicUrl = (cvId: string): string => {
  const base = getSiteBaseUrl();
  return `${base}#cv-${cvId}`;
};

export const getCvDisplayLink = (cvId?: string): string => {
  const domain = getSiteDomain();
  return cvId ? `${domain}#cv-${cvId.slice(0, 6)}` : domain;
};

export const getLicensesPageUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/licenses`;
  }
  return `${getSiteBaseUrl()}/licenses`;
};

export const getOfficialLicensesUrl = (): string => {
  return `${getSiteBaseUrl()}/licenses`;
};

export const getInstallPageUrl = (): string => {
  return `${getSiteBaseUrl()}/install`;
};

export const getCommunityPostShareUrl = (postId: string): string => {
  return `${getSiteBaseUrl()}/community?post=${encodeURIComponent(postId)}`;
};

export const getItemShareUrl = (type?: string, itemId?: string): string => {
  const base = getSiteBaseUrl();
  switch (type) {
    case 'post':
      return itemId ? `${base}/community?post=${encodeURIComponent(itemId)}` : `${base}/community`;
    case 'book':
      return itemId ? `${base}/books?item=${encodeURIComponent(itemId)}` : `${base}/books`;
    case 'video':
      return itemId ? `${base}/videos?item=${encodeURIComponent(itemId)}` : `${base}/videos`;
    case 'photo':
      return itemId ? `${base}/photos?item=${encodeURIComponent(itemId)}` : `${base}/photos`;
    case 'news':
      return itemId ? `${base}/news?item=${encodeURIComponent(itemId)}` : `${base}/news`;
    case 'license':
      return `${base}/licenses`;
    case 'quote':
      return `${base}/community`;
    default:
      return base;
  }
};

export const buildShortShareExcerpt = (text?: string, maxLength = 140): string => {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}...`;
};

export const buildCommunityPostCopyText = (
  post: { id: string; title?: string; content: string; linkUrl?: string },
  authorName = 'أ. نبيل بركات'
): string => {
  const parts: string[] = [];
  if (post.title?.trim()) {
    parts.push(post.title.trim());
  }
  if (post.content?.trim()) {
    parts.push(post.content.trim());
  }
  if (post.linkUrl?.trim()) {
    parts.push(post.linkUrl.trim());
  }
  parts.push(`— ${authorName}\n${getCommunityPostShareUrl(post.id)}`);
  return parts.join('\n\n');
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (!text || typeof window === 'undefined') return false;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};
