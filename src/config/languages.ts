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
  nativeName: string
}

/**
 * All supported languages in the desired display order
 * This order will be used consistently across all language selectors
 */
export const LANGUAGES: Language[] = [
  
   { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
   { code: 'el', name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικά' },
   { code: 'yue', name: 'Cantonese', flag: '🇭🇰', nativeName: '粵語' },
   { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
     { code: 'pa', name: 'Punjabi', flag: '🇮🇳', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', nativeName: 'Filipino' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' }, 
 
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