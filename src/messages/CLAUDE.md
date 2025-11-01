# Internationalization Messages - Powered by Donation

## Language Coverage
**17 Languages Fully Supported**: English, German, Spanish, French, Italian, Portuguese, Japanese, Turkish, Korean, Chinese, Arabic, Hindi, Filipino, Greek, Cantonese, Punjabi, Vietnamese

## Translation Guidelines

### Key Naming Convention
```
// Use descriptive hierarchical keys
'services.donation.amount'           // Service donation amount
'dashboard.fundraiser.notifications' // Fundraiser dashboard notifications  
'charity.browse.search.placeholder'  // Charity browsing search placeholder
'auth.signup.platform.selection'    // Platform selection during signup
```

### Terminology Standards
- **fundraiser** (not provider) - Person offering services
- **donor** (not supporter) - Person making donations  
- **donation** (not payment) - Money given to charity
- **service** (not product) - Offering from fundraiser
- **charity** (JustGiving) vs **nonprofit** (Every.org) - Platform-specific

### Translation Quality
- **Context provided**: Keys structured to give translators context
- **Pluralization**: Use next-intl plural rules (`{count, plural, =1 {# service} other {# services}}`)
- **Gender**: Consider grammatical gender in applicable languages
- **Cultural sensitivity**: Charity/donation concepts vary by culture

### File Structure
```
messages/
├── en.json    # English (master)
├── de.json    # German
├── es.json    # Spanish  
├── fr.json    # French
├── it.json    # Italian
├── pt.json    # Portuguese
├── ja.json    # Japanese
├── tr.json    # Turkish
├── ko.json    # Korean
├── zh.json    # Chinese
├── ar.json    # Arabic
├── hi.json    # Hindi
├── tl.json    # Filipino
├── el.json    # Greek
├── yue.json   # Cantonese
├── pa.json    # Punjabi
└── vi.json    # Vietnamese
```

## Key Translation Areas

### Authentication & User Management
```json
{
  "auth": {
    "login": "Log in",
    "signup": "Sign up", 
    "platform": {
      "selection": "Choose your preferred donation platform",
      "justgiving": "JustGiving (Available Now)",
      "everyorg": "Every.org (Coming Soon)"
    }
  }
}
```

### Services & Donations
```json
{
  "services": {
    "donation": {
      "amount": "Donation Amount",
      "fixed": "Exactly £{amount} to your chosen charity",
      "button": "Donate Now"
    },
    "create": {
      "title": "Create New Service",
      "platform": "Platform: {platform}"
    }
  }
}
```

### Platform-Specific Content
```json
{
  "platforms": {
    "justgiving": {
      "name": "JustGiving",
      "charity": "charity",
      "charities": "charities"
    },
    "everyorg": {
      "name": "Every.org", 
      "charity": "nonprofit",
      "charities": "nonprofits"
    }
  }
}
```

### Privacy & Anonymous Display
```json
{
  "privacy": {
    "anonymous": {
      "donation": "Someone donated £{amount} via {serviceName}",
      "activity": "Anonymous donation activity",
      "statistics": "Aggregate statistics only"
    }
  }
}
```

## Development Workflow

### Adding New Keys
1. **Add to en.json first**: English is the master translation
2. **Use descriptive keys**: Help translators understand context
3. **Update all languages**: Maintain parity across all 17 languages
4. **Test with long text**: Some languages are 40%+ longer than English

### Translation Updates
1. **Batch updates**: Update all languages together to avoid inconsistencies
2. **Verification script**: Use `verify-language.js` to check completeness
3. **Context preservation**: Don't change key structure without updating all languages
4. **Professional review**: Consider professional translation for legal/financial content

### Best Practices
```typescript
// Use translations in components
const t = useTranslations('services');
<button>{t('donation.button')}</button>

// Provide values for interpolation  
t('donation.fixed', { amount: service.amount })

// Handle pluralization
t('count', { count: services.length })

// Platform-specific content
const platformKey = platform === 'justgiving' ? 'charity' : 'nonprofit';
t(`platforms.${platform}.${platformKey}`)
```

## Quality Assurance

### Automated Checks
- **Key completeness**: All languages have same keys as English
- **Syntax validation**: Valid JSON structure
- **Interpolation**: Consistent variable usage
- **Length warnings**: Flag extremely long translations

### Manual Review Areas
- **Legal terms**: Donation, charity, compliance language
- **Cultural appropriateness**: Charity concepts vary by region  
- **Gender agreement**: Languages with grammatical gender
- **Formal vs informal**: Appropriate tone for each language

## Current Status
✅ **100% Complete**: All 17 languages updated with fundraiser/donor terminology
✅ **Platform Integration**: JustGiving vs Every.org terminology support
✅ **Quality Validated**: Verification script confirms completeness
✅ **Build Ready**: No missing keys or syntax errors

## Common Translation Patterns

### Anonymous Activity
```json
// English pattern
"Someone donated £{amount} via {serviceName}"

// Maintain anonymity across all languages
// Preserve donation amount and service context
// Use platform-appropriate currency symbols
```

### Platform Badges  
```json
// Flexible platform display
"Available on {platform}"  // "Available on JustGiving"
"Coming to {platform}"     // "Coming to Every.org"
```

### Error Messages
```json
// User-friendly error handling
"Unable to process donation. Please try again."
"Service temporarily unavailable."
"Platform mismatch. Please select correct platform."
```