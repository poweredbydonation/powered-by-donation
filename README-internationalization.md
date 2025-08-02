# Internationalization System - Powered by Donation

## Overview

The platform supports 17 languages with complete translation coverage using next-intl, providing a fully localized experience for diverse Australian communities and international users. The system uses a centralized language configuration that automatically propagates to all components.

## Language Support

The platform supports 17 languages with complete translation coverage:

### Supported Languages
- **English (en)** - Default locale
- **Chinese (zh)** - Simplified Chinese
- **German (de)** - European accessibility
- **Spanish (es)** - International accessibility
- **French (fr)** - International accessibility
- **Greek (el)** - Established Australian community
- **Cantonese (yue)** - Hong Kong/Guangdong communities
- **Hindi (hi)** - Large Indian diaspora
- **Punjabi (pa)** - Sikh communities
- **Italian (it)** - Traditional Australian migration
- **Japanese (ja)** - Asian accessibility
- **Korean (ko)** - Growing Korean community
- **Filipino (tl)** - Growing community presence
- **Portuguese (pt)** - South American accessibility
- **Arabic (ar)** - Right-to-left support
- **Turkish (tr)** - Middle Eastern communities
- **Vietnamese (vi)** - High Australian community presence

### Community Focus
Language selection is based on:
- **Australian census data** for established communities
- **Growing demographic trends** in major cities
- **Charitable giving patterns** within communities
- **Service provider diversity** across regions

## Implementation Architecture

### Centralized Language Configuration
The platform uses a centralized language configuration system located in `src/config/languages.ts` that automatically propagates to all components.

```typescript
// src/config/languages.ts
export interface Language {
  code: string        // ISO language code (e.g., 'en', 'fr')
  name: string        // English name (e.g., 'French')
  flag: string        // Flag emoji (e.g., '🇫🇷')
  nativeName: string  // Native language name (e.g., 'Français')
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
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
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' }
]

// Helper functions
export const getLanguageByCode = (code: string): Language | undefined => 
  LANGUAGES.find(lang => lang.code === code)

export const getOtherLanguages = (currentCode: string): Language[] => 
  LANGUAGES.filter(lang => lang.code !== currentCode)

export const LOCALE_CODES = LANGUAGES.map(lang => lang.code)
export const DEFAULT_LOCALE = 'en'
```

### Translation Key Structure
```typescript
// Translation key organization
const translationStructure = {
  nav: {
    // Navigation items
    home: "Home",
    browse: "Browse Services", 
    dashboard: "Dashboard",
    signin: "Sign In",
    signup: "Sign Up"
  },
  home: {
    // Homepage content
    hero: {
      title: "Support Services Through Charity",
      subtitle: "Connect with service providers while supporting your favorite charities"
    },
    features: {
      // Feature descriptions
    }
  },
  dashboard: {
    // Dashboard interface
    title: "Dashboard",
    welcome: "Welcome back",
    providers: {
      title: "Provider Dashboard",
      services: "My Services",
      create: "Create Service"
    },
    supporters: {
      title: "Supporter Dashboard", 
      donations: "My Donations",
      history: "Donation History"
    }
  },
  profile: {
    // Profile management
    title: "Profile",
    edit: "Edit Profile",
    privacy: "Privacy Settings"
  },
  services: {
    // Service-related content
    title: "Services",
    create: "Create Service",
    edit: "Edit Service",
    donation_amount: "Donation Amount",
    charity_requirements: "Charity Requirements"
  },
  auth: {
    // Authentication flows
    signin: "Sign In",
    signup: "Sign Up",
    signout: "Sign Out",
    provider: "Service Provider",
    supporter: "Supporter"
  },
  browse: {
    // Browse/search interface
    title: "Browse Services",
    filters: "Filters",
    category: "Category",
    location: "Location",
    amount: "Donation Amount"
  },
  common: {
    // Shared UI elements
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  }
}
```

### Component Usage
```typescript
// Usage in components
import { useTranslations } from 'next-intl'

const DashboardComponent = () => {
  const t = useTranslations('dashboard')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome')}</p>
    </div>
  )
}

// Nested translation keys
const ServiceForm = () => {
  const t = useTranslations('services')
  
  return (
    <form>
      <h2>{t('create')}</h2>
      <label>{t('donation_amount')}</label>
      <label>{t('charity_requirements')}</label>
    </form>
  )
}

// Multiple translation namespaces
const NavigationComponent = () => {
  const nav = useTranslations('nav')
  const auth = useTranslations('auth')
  
  return (
    <nav>
      <a href="/">{nav('home')}</a>
      <a href="/browse">{nav('browse')}</a>
      <button>{auth('signin')}</button>
    </nav>
  )
}
```

## Translation Management

### File Structure
```
src/messages/
├── en.json          # English (default)
├── zh.json          # Chinese (Simplified)
├── de.json          # German
├── es.json          # Spanish
├── fr.json          # French
├── el.json          # Greek
├── yue.json         # Cantonese
├── hi.json          # Hindi
├── pa.json          # Punjabi
├── it.json          # Italian
├── ja.json          # Japanese
├── ko.json          # Korean
├── tl.json          # Filipino
├── pt.json          # Portuguese
├── ar.json          # Arabic
├── tr.json          # Turkish
└── vi.json          # Vietnamese
```

### Translation File Example
```json
// src/messages/en.json
{
  "nav": {
    "home": "Home",
    "browse": "Browse Services",
    "dashboard": "Dashboard",
    "signin": "Sign In",
    "signup": "Sign Up"
  },
  "home": {
    "hero": {
      "title": "Support Services Through Charity",
      "subtitle": "Connect with service providers while supporting your favorite charities",
      "cta": "Browse Services"
    },
    "features": {
      "anonymous": {
        "title": "Always Anonymous",
        "description": "Your donations remain private while supporting great causes"
      },
      "verified": {
        "title": "Verified Charities",
        "description": "All charities are registered with JustGiving for transparency"
      },
      "fixed": {
        "title": "Fixed Pricing",
        "description": "Know exactly how much to donate for each service"
      }
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {name}",
    "providers": {
      "title": "Provider Dashboard",
      "services": "My Services",
      "create": "Create New Service",
      "earnings": "Total Donations Received"
    }
  }
}
```

### Key Organization Strategy
- **Hierarchical structure** by feature/page
- **Consistent naming** across languages
- **Fallback strategy** to English for missing translations
- **Parameterized strings** for dynamic content
- **Quality assurance** through automated checks

## Locale Routing

### URL Structure
- **Locale prefix**: `/[locale]/page` (e.g., `/en/browse`, `/zh/dashboard`)
- **Default behavior**: English locale for root URLs
- **Automatic detection**: Browser language detection with manual override
- **SEO optimization**: Proper hreflang tags for all language versions

### Routing Configuration
```typescript
// src/i18n/routing.ts
import { createNavigation } from 'next-intl/navigation'
import { LOCALE_CODES, DEFAULT_LOCALE } from '@/config/languages'

export const routing = {
  locales: LOCALE_CODES,
  defaultLocale: DEFAULT_LOCALE,
  pathnames: {
    '/': '/',
    '/browse': '/browse',
    '/dashboard': '/dashboard',
    '/services/[slug]': '/services/[slug]',
    '/charity/[slug]': '/charity/[slug]',
    '/provider/[slug]': '/provider/[slug]'
  }
}

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

### Middleware Configuration
```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware'
import { LOCALE_CODES, DEFAULT_LOCALE } from '@/config/languages'

export default createMiddleware({
  locales: LOCALE_CODES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: true,
  pathnames: {
    '/': '/',
    '/browse': '/browse',
    '/dashboard': '/dashboard'
  }
})

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/([\\w-]+)?/users/(.+)'
  ]
}
```

## Language Configuration Management

### Files that automatically use the central config:
- `src/i18n/routing.ts` - Next.js routing configuration
- `src/components/LanguageSwitcher.tsx` - Standalone language selector
- `src/components/MultilingualNavbar.tsx` - Main navigation bar

### Adding New Languages

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

### Language Selector Component
```typescript
// src/components/LanguageSwitcher.tsx
import { LANGUAGES, getOtherLanguages } from '@/config/languages'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  
  const otherLanguages = getOtherLanguages(locale)
  
  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }
  
  return (
    <select 
      value={locale} 
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="border rounded px-2 py-1"
    >
      {LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.flag} {language.nativeName}
        </option>
      ))}
    </select>
  )
}
```

## Special Language Considerations

### Right-to-Left (RTL) Support
Arabic language implementation includes:
- **Text direction**: Automatic RTL layout
- **CSS adjustments**: Mirrored layouts for RTL languages
- **Icon orientation**: Appropriate direction for UI elements

```css
/* RTL-specific styles */
[dir="rtl"] .container {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}
```

### Character Set Support
- **Unicode compliance**: Full UTF-8 support for all character sets
- **Font considerations**: System fonts support for diverse scripts
- **Input validation**: Proper handling of non-Latin characters

### Cultural Adaptations
- **Number formatting**: Locale-appropriate number and currency display
- **Date formatting**: Regional date and time preferences
- **Cultural sensitivity**: Appropriate imagery and messaging

## SEO & Internationalization

### Hreflang Implementation
```html
<!-- Automatic hreflang generation -->
<link rel="alternate" hreflang="en" href="https://poweredbydonation.com/en/services" />
<link rel="alternate" hreflang="zh" href="https://poweredbydonation.com/zh/services" />
<link rel="alternate" hreflang="ar" href="https://poweredbydonation.com/ar/services" />
<link rel="alternate" hreflang="x-default" href="https://poweredbydonation.com/services" />
```

### Localized Sitemap Generation
```typescript
// Generate sitemaps per language
const generateLocalizedSitemap = async () => {
  const pages = ['/', '/browse', '/services', '/about']
  
  return LOCALE_CODES.flatMap(locale => 
    pages.map(page => ({
      url: `https://poweredbydonation.com/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: locale === DEFAULT_LOCALE ? 1.0 : 0.8
    }))
  )
}
```

### Localized Meta Tags
```typescript
// Locale-specific meta descriptions
const getLocalizedMeta = (locale: string, page: string) => {
  const messages = await import(`@/messages/${locale}.json`)
  
  return {
    title: messages.meta[page].title,
    description: messages.meta[page].description,
    keywords: messages.meta[page].keywords
  }
}
```

## Quality Assurance

### Translation Validation
- **Completeness checks**: Ensure all keys exist in all language files
- **Consistency validation**: Verify parameter usage across languages
- **Character limits**: Respect UI space constraints for longer translations
- **Cultural appropriateness**: Review translations for cultural sensitivity

### Testing Strategy
- **Automated testing**: Check for missing translation keys
- **Manual review**: Native speaker validation for key languages
- **UI testing**: Layout testing with longer text strings
- **Performance monitoring**: Impact of language switching on load times

### Maintenance Workflow
- **Version control**: Track translation changes with Git
- **Update process**: Streamlined workflow for adding new translations
- **Community contributions**: Process for accepting translation improvements
- **Regular audits**: Periodic review of translation quality and completeness

---

*This internationalization system ensures the platform can serve diverse Australian communities and international users with a fully localized, culturally appropriate experience while maintaining technical excellence and SEO optimization.*