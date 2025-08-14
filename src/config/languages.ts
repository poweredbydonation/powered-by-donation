/**
 * Centralized language configuration
 * 
 * This file defines all supported languages and their metadata.
 * When adding a new language:
 * 1. Add the language to the LANGUAGES array below
 * 2. Create the corresponding message file in src/messages/[code].json
 * 3. That's it! All components will automatically pick up the new language.
 */

export interface Language {
  code: string
  name: string
  flag: string
  flagIcon: string  // Path to flag SVG image
  nativeName: string
}

/**
 * All supported languages in the desired display order
 * This order will be used consistently across all language selectors
 */
export const LANGUAGES: Language[] = [
  
   { code: 'zh', name: 'Chinese', flag: '🇨🇳', flagIcon: '/flags/1x1/cn.svg', nativeName: '中文' },
  { code: 'de', name: 'German', flag: '🇩🇪', flagIcon: '/flags/1x1/de.svg', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', flagIcon: '/flags/1x1/es.svg', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', flagIcon: '/flags/1x1/fr.svg', nativeName: 'Français' },
   { code: 'el', name: 'Greek', flag: '🇬🇷', flagIcon: '/flags/1x1/gr.svg', nativeName: 'Ελληνικά' },
   { code: 'yue', name: 'Cantonese', flag: '🇭🇰', flagIcon: '/flags/1x1/hk.svg', nativeName: '粵語' },
   { code: 'hi', name: 'Hindi', flag: '🇮🇳', flagIcon: '/flags/1x1/in.svg', nativeName: 'हिन्दी' },
     { code: 'pa', name: 'Punjabi', flag: '🇮🇳', flagIcon: '/flags/1x1/in.svg', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', flagIcon: '/flags/1x1/it.svg', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', flagIcon: '/flags/1x1/jp.svg', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', flagIcon: '/flags/1x1/kr.svg', nativeName: '한국어' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', flagIcon: '/flags/1x1/ph.svg', nativeName: 'Filipino' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', flagIcon: '/flags/1x1/pt.svg', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', flagIcon: '/flags/1x1/sa.svg', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', flagIcon: '/flags/1x1/tr.svg', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', flag: '🇺🇸', flagIcon: '/flags/1x1/us.svg', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', flagIcon: '/flags/1x1/vn.svg', nativeName: 'Tiếng Việt' } 
 
]

/**
 * Array of just the language codes for routing and configuration
 */
export const LOCALE_CODES = LANGUAGES.map(lang => lang.code)

/**
 * Default locale
 */
export const DEFAULT_LOCALE = 'en'

/**
 * Helper function to get language data by code
 */
export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code)
}

/**
 * Helper function to get all languages except the specified one
 */
export function getOtherLanguages(currentCode: string): Language[] {
  return LANGUAGES.filter(lang => lang.code !== currentCode)
}