/**
 * Localized URL Utilities
 * Provides localized URL generation for specific paths
 */

// Services path translations
export const SERVICES_PATHS: Record<string, string> = {
  en: '/services',
  de: '/dienstleistungen',
  es: '/servicios', 
  fr: '/services',
  it: '/servizi',
  pt: '/servicos',
  ja: '/sabisu',
  ko: '/seobiseu',
  zh: '/fuwu',
  ar: '/khadamat',
  hi: '/sevayeN',
  tr: '/hizmetler',
  tl: '/mga-serbisyo',
  el: '/ypiresies',
  yue: '/fok-mou',
  pa: '/sevavaN',
  vi: '/dich-vu'
}

/**
 * Get localized services URL for a given locale
 * @param locale - The locale code (e.g., 'en', 'tr')
 * @returns Localized services path
 */
export function getServicesPath(locale: string): string {
  return SERVICES_PATHS[locale] || SERVICES_PATHS['en']
}

/**
 * Get full localized services URL with locale prefix (platform-first architecture)
 * @param locale - The locale code (e.g., 'en', 'tr')
 * @param subPath - Optional sub-path (e.g., '/slug')
 * @returns Full localized URL (e.g., '/tr/PoweredByDonation/hizmetler' or '/tr/PoweredByDonation/hizmetler/slug')
 */
export function getLocalizedServicesUrl(locale: string, subPath?: string): string {
  const servicesSlug = locale === 'tr' ? 'hizmetler' : 'services'
  const fullPath = subPath ? `/${servicesSlug}${subPath}` : `/${servicesSlug}`
  return `/${locale}/PoweredByDonation${fullPath}`
}