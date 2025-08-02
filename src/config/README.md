# Language Configuration

## Adding a New Language

To add a new language to the platform:

1. **Add to central config** - Edit `src/config/languages.ts`:
   ```typescript
   export const LANGUAGES: Language[] = [
     // ... existing languages
     { code: 'new', name: 'Language Name', flag: '🏳️', nativeName: 'Native Name' },
   ]
   ```

2. **Create translation file** - Add `src/messages/new.json` with all translations

3. **That's it!** The new language will automatically appear in:
   - All language selector dropdowns
   - Routing configuration
   - Mobile and desktop navigation

## Files that automatically use the central config:

- `src/i18n/routing.ts` - Next.js routing configuration
- `src/components/LanguageSwitcher.tsx` - Standalone language selector
- `src/components/MultilingualNavbar.tsx` - Main navigation bar

## Language Data Structure:

```typescript
interface Language {
  code: string        // ISO language code (e.g., 'en', 'fr')
  name: string        // English name (e.g., 'French')
  flag: string        // Flag emoji (e.g., '🇫🇷')
  nativeName: string  // Native language name (e.g., 'Français')
}
```

## Helper Functions:

- `getLanguageByCode(code)` - Get language object by code
- `getOtherLanguages(currentCode)` - Get all languages except current
- `LOCALE_CODES` - Array of just the language codes
- `DEFAULT_LOCALE` - Default language ('en')