/**
 * Centralized Site Domain & Links Configuration
 * Official Base URL: zadtoo.com/nb
 * Configurable for future sub-domain transition (e.g. nb.zadtoo.com)
 */

export const DEFAULT_OFFICIAL_DOMAIN = 'zadtoo.com/nb';
export const DEFAULT_OFFICIAL_URL = 'https://zadtoo.com/nb';

export const getSiteDomain = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('nabil_official_site_domain');
    if (custom && custom.trim()) {
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
