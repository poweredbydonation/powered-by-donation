# SEO Strategy & Implementation - Powered by Donation

## Overview

The platform implements a comprehensive SEO strategy focused on service discovery, charity impact, and fundraiser visibility. Our approach prioritizes static generation, structured data, and performance optimization to achieve maximum search visibility.

## Page Structure for Maximum SEO

### Core Page Types (Platform-Aware)
- **Services**: `/services/[slug]` - Individual service pages (SSG)
- **Categories**: `/services/category/[category]` - Service category landing pages
- **Locations**: `/services/location/[location]` - Location-based services
- **Fundraisers**: `/fundraiser/[slug]` - Fundraiser profile pages
- **Donors**: `/donor/[slug]` - Donor profile pages  
- **JustGiving Charities**: `/[locale]/justgiving/charity/[slug]` - Charity impact pages (SSG)
- **Every.org Nonprofits**: `/[locale]/everyorg/nonprofit/[slug]` - Nonprofit impact pages (SSG)
- **Browse**: `/browse` - Main browsing page with platform filters
- **Search**: `/search?platform=justgiving&category=X&location=Y&amount=Z&happiness=90` - Platform-aware filtered search

### URL Structure Examples
```
# Service pages
/services/web-design-melbourne-50-dollars
/services/tutoring-sydney-mathematics-25-dollars
/services/consulting-brisbane-startup-100-dollars

# Category pages
/services/category/web-design
/services/category/tutoring
/services/category/consulting

# Location pages
/services/location/sydney
/services/location/melbourne
/services/location/brisbane

# Fundraiser profiles
/fundraiser/john-smith-web-designer
/fundraiser/sarah-jones-tutor

# Platform-specific organization pages
/en/justgiving/charity/cancer-research-uk
/en/justgiving/charity/save-the-children-australia
/en/everyorg/nonprofit/red-cross-emergency-fund
/fr/justgiving/charity/recherche-cancer-uk
/es/everyorg/nonprofit/cruz-roja-fondo-emergencia
```

## SEO Implementation Requirements

### Static Site Generation (SSG)
- **Service pages**: Pre-rendered at build time for optimal performance
- **JustGiving charity pages**: Pre-rendered with regular regeneration for updated stats
- **Every.org nonprofit pages**: Pre-rendered with platform-specific data
- **Fundraiser profiles**: Static generation for public profiles
- **Category/location pages**: Static generation with platform-aware filtering

### Dynamic Content Strategy
- **Search results**: Client-side rendering with SSR fallbacks
- **Real-time filters**: Hydrated static content with dynamic interactions
- **User dashboards**: Dynamic rendering for authenticated areas

## Meta Tags & Open Graph Optimization

### Service Page Meta Tags
```typescript
interface ServiceSEO {
  title: `${service.title} | $${service.donation_amount} | ${fundraiser.name} | Powered by Donation`
  description: `Support ${service.title} with a $${service.donation_amount} donation to your chosen charity. ${service.description.substring(0, 120)}...`
  
  openGraph: {
    title: service.title
    description: `$${service.donation_amount} donation supports this service`
    url: `https://poweredbydonation.com/services/${service.slug}`
    type: 'website'
    images: [
      {
        url: '/og-service-default.jpg'
        width: 1200
        height: 630
        alt: `${service.title} - Powered by Donation`
      }
    ]
  }
  
  twitter: {
    card: 'summary_large_image'
    title: service.title
    description: `$${service.donation_amount} donation supports this service`
    images: ['/og-service-default.jpg']
  }
}
```

### Platform-Specific Organization Page Meta Tags

#### JustGiving Charity Pages
```typescript
interface JustGivingCharitySEO {
  title: `${charity.name} | ${stats.total_donations_count} Service Donations | Powered by Donation`
  description: `${charity.name} has received ${stats.total_donations_count} donations worth $${stats.total_amount_received} through our JustGiving-integrated service marketplace. Support services that benefit this charity.`
  
  openGraph: {
    title: `${charity.name} - JustGiving Service-Driven Donations`
    description: `${stats.total_donations_count} people have supported this charity through JustGiving service donations`
    url: `https://poweredbydonation.com/${locale}/justgiving/charity/${charity.slug}`
    type: 'website'
    images: [
      {
        url: charity.logo_url || '/og-justgiving-charity-default.jpg'
        width: 1200
        height: 630
        alt: `${charity.name} - JustGiving Service Donations Impact`
      }
    ]
  }
}
```

#### Every.org Nonprofit Pages
```typescript
interface EveryOrgNonprofitSEO {
  title: `${nonprofit.name} | ${stats.total_donations_count} Service Donations | Powered by Donation`
  description: `${nonprofit.name} has received ${stats.total_donations_count} donations worth $${stats.total_amount_received} through our Every.org-integrated service marketplace. Support services that benefit this nonprofit.`
  
  openGraph: {
    title: `${nonprofit.name} - Every.org Service-Driven Donations`
    description: `${stats.total_donations_count} people have supported this nonprofit through Every.org service donations`
    url: `https://poweredbydonation.com/${locale}/everyorg/nonprofit/${nonprofit.slug}`
    type: 'website'
    images: [
      {
        url: nonprofit.logo_url || '/og-everyorg-nonprofit-default.jpg'
        width: 1200
        height: 630
        alt: `${nonprofit.name} - Every.org Service Donations Impact`
      }
    ]
  }
}
```

### Fundraiser Profile Meta Tags
```typescript
interface FundraiserSEO {
  title: `${fundraiser.name} | ${fundraiser.services.length} Services | Powered by Donation`
  description: `${fundraiser.name} offers ${fundraiser.services.length} services for charitable donations. ${fundraiser.bio ? fundraiser.bio.substring(0, 120) + '...' : 'Support their services through donations to verified charities.'}`
  
  openGraph: {
    title: `${fundraiser.name} - Service Fundraiser`
    description: `${fundraiser.services.length} services available for charitable donations`
    url: `https://poweredbydonation.com/fundraiser/${fundraiser.slug}`
    type: 'profile'
  }
}
```

## Structured Data (Schema.org)

### Service Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Web Design Service",
  "description": "Professional web design services for small businesses",
  "provider": {
    "@type": "Person",
    "name": "John Smith",
    "url": "https://poweredbydonation.com/fundraiser/john-smith"
  },
  "offers": {
    "@type": "Offer",
    "price": "50.00",
    "priceCurrency": "AUD",
    "description": "Donation amount required to access this service",
    "url": "https://poweredbydonation.com/services/web-design-melbourne-50"
  },
  "areaServed": {
    "@type": "Place",
    "name": "Melbourne, Australia"
  },
  "serviceType": "Web Design",
  "url": "https://poweredbydonation.com/services/web-design-melbourne-50"
}
```

### Platform-Specific Organization Schema

#### JustGiving Charity Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Cancer Research UK",
  "url": "https://poweredbydonation.com/en/justgiving/charity/cancer-research-uk",
  "description": "Leading cancer research charity fighting cancer through research - JustGiving verified",
  "logo": "https://logo-url.com/cancer-research-uk.png",
  "foundingDate": "1902",
  "nonprofitStatus": "Charitable",
  "subOrganization": {
    "@type": "Organization",
    "name": "Powered by Donation",
    "description": "Dual-platform service marketplace facilitating charitable donations"
  },
  "makesOffer": {
    "@type": "Offer",
    "name": "JustGiving service-driven donations",
    "description": "Receive donations through JustGiving-integrated services",
    "availableAtOrFrom": "https://poweredbydonation.com/en/justgiving/charity/cancer-research-uk"
  },
  "sameAs": "https://justgiving.com/charity/cancer-research-uk"
}
```

#### Every.org Nonprofit Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Red Cross Emergency Fund",
  "url": "https://poweredbydonation.com/en/everyorg/nonprofit/red-cross-emergency-fund",
  "description": "Global emergency response nonprofit - Every.org verified",
  "logo": "https://logo-url.com/red-cross-emergency-fund.png",
  "foundingDate": "1863",
  "nonprofitStatus": "Nonprofit",
  "subOrganization": {
    "@type": "Organization",
    "name": "Powered by Donation",
    "description": "Dual-platform service marketplace facilitating charitable donations"
  },
  "makesOffer": {
    "@type": "Offer",
    "name": "Every.org service-driven donations",
    "description": "Receive donations through Every.org-integrated services",
    "availableAtOrFrom": "https://poweredbydonation.com/en/everyorg/nonprofit/red-cross-emergency-fund"
  },
  "sameAs": "https://every.org/red-cross-emergency-fund"
}
```

### LocalBusiness Schema (for location-based services)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Tutoring Services Melbourne",
  "description": "Mathematics tutoring services in Melbourne area",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Melbourne",
    "addressRegion": "VIC",
    "addressCountry": "AU"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -37.8136,
    "longitude": 144.9631
  },
  "priceRange": "$25-$100",
  "paymentAccepted": "Charitable Donation",
  "url": "https://poweredbydonation.com/services/location/melbourne"
}
```

## Content Strategy

### Service Page Content Structure
```typescript
const servicePageContent = {
  hero: {
    title: service.title,
    subtitle: `$${service.donation_amount} donation • ${fundraiser.name}`,
    cta: "Support with Donation"
  },
  
  description: {
    main: service.description,
    fundraiser_bio: fundraiser.bio,
    location_info: service.locations,
    charity_requirements: service.charity_type
  },
  
  donation_section: {
    title: "How It Works",
    steps: [
      "Choose this service",
      `Donate $${service.donation_amount} to your chosen charity`,
      "Connect with ${fundraiser.name}",
      "Receive your service"
    ]
  },
  
  charity_section: {
    title: service.charity_type === 'any_charity' 
      ? "Support Any Charity" 
      : "Preferred Charities",
    description: service.charity_type === 'any_charity'
      ? "Donate to any registered charity on JustGiving"
      : "Choose from fundraiser's preferred charities",
    charities: service.preferred_charities
  },
  
  fundraiser_section: {
    title: `About ${fundraiser.name}`,
    bio: fundraiser.bio,
    happiness_rate: fundraiser.happiness_rate,
    total_services: fundraiser.services.length,
    cta: `View all services by ${fundraiser.name}`
  }
}
```

### Platform-Specific Organization Page Content Structure

#### JustGiving Charity Page Content
```typescript
const justGivingCharityPageContent = {
  hero: {
    title: charity.name,
    subtitle: `${stats.total_donations_count} service-driven donations • $${stats.total_amount_received} total impact • JustGiving Verified`,
    platform_badge: "JustGiving",
    cta: "Find services supporting this charity"
  },
  
  stats_section: {
    title: "Community Impact via JustGiving",
    metrics: [
      `${stats.this_month_count} donations this month`,
      `$${stats.this_month_amount} raised this month`,
      `${Object.keys(service_categories).length} service categories`,
      `${stats.total_donations_count} total donors via JustGiving`
    ]
  },
  
  services_section: {
    title: "Services Supporting This Charity",
    description: "Browse services where fundraisers have chosen to support this JustGiving charity",
    categories: service_categories,
    cta_link: `/search?platform=justgiving&charity=${charity.slug}`
  },
  
  activity_section: {
    title: "Recent Anonymous Activity",
    activities: recent_activity.map(activity => 
      `Someone donated $${activity.amount} via ${activity.service_title} • ${timeAgo(activity.created_at)}`
    )
  },
  
  about_section: {
    title: "About This Charity",
    description: charity.description,
    category: charity.category,
    platform_info: "Verified JustGiving charity",
    external_link: `https://justgiving.com/charity/${charity.justgiving_id}`
  }
}
```

#### Every.org Nonprofit Page Content
```typescript
const everyOrgNonprofitPageContent = {
  hero: {
    title: nonprofit.name,
    subtitle: `${stats.total_donations_count} service-driven donations • $${stats.total_amount_received} total impact • Every.org Verified`,
    platform_badge: "Every.org",
    cta: "Find services supporting this nonprofit"
  },
  
  stats_section: {
    title: "Community Impact via Every.org",
    metrics: [
      `${stats.this_month_count} donations this month`,
      `$${stats.this_month_amount} raised this month`,
      `${Object.keys(service_categories).length} service categories`,
      `${stats.total_donations_count} total donors via Every.org`
    ]
  },
  
  services_section: {
    title: "Services Supporting This Nonprofit",
    description: "Browse services where fundraisers have chosen to support this Every.org nonprofit",
    categories: service_categories,
    cta_link: `/search?platform=every_org&nonprofit=${nonprofit.slug}`
  },
  
  activity_section: {
    title: "Recent Anonymous Activity",
    activities: recent_activity.map(activity => 
      `Someone donated $${activity.amount} via ${activity.service_title} • ${timeAgo(activity.created_at)}`
    )
  },
  
  about_section: {
    title: "About This Nonprofit",
    description: nonprofit.description,
    category: nonprofit.category,
    platform_info: "Verified Every.org nonprofit",
    external_link: `https://every.org/${nonprofit.every_org_id}`
  }
}
```

## Technical SEO Implementation

### Sitemap Generation (Platform-Aware)
```typescript
// Dynamic sitemap generation with platform support
const generateSitemap = async () => {
  const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'tl', 'el', 'yue', 'pa', 'vi']
  
  const staticPages = languages.flatMap(locale => [
    `https://poweredbydonation.com/${locale}`,
    `https://poweredbydonation.com/${locale}/browse`,
    `https://poweredbydonation.com/${locale}/how-it-works`,
    `https://poweredbydonation.com/${locale}/about`
  ])
  
  const services = await getPublicServices()
  const justGivingCharities = await getActiveJustGivingCharities()
  const everyOrgNonprofits = await getActiveEveryOrgNonprofits()
  const fundraisers = await getPublicFundraisers()
  
  const servicePages = services.map(service => 
    `https://poweredbydonation.com/services/${service.slug}`
  )
  
  // Platform-specific organization pages (all locales)
  const justGivingCharityPages = languages.flatMap(locale =>
    justGivingCharities.map(charity => 
      `https://poweredbydonation.com/${locale}/justgiving/charity/${charity.slug}`
    )
  )
  
  const everyOrgNonprofitPages = languages.flatMap(locale =>
    everyOrgNonprofits.map(nonprofit => 
      `https://poweredbydonation.com/${locale}/everyorg/nonprofit/${nonprofit.slug}`
    )
  )
  
  const fundraiserPages = fundraisers.map(fundraiser => 
    `https://poweredbydonation.com/fundraiser/${fundraiser.slug}`
  )
  
  return [
    ...staticPages, 
    ...servicePages, 
    ...justGivingCharityPages, 
    ...everyOrgNonprofitPages, 
    ...fundraiserPages
  ]
}
```

### Robots.txt Configuration
```
User-agent: *
Allow: /
Allow: /services/
Allow: /*/justgiving/charity/
Allow: /*/everyorg/nonprofit/
Allow: /fundraiser/
Allow: /browse
Allow: /search

Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /test/

Sitemap: https://poweredbydonation.com/sitemap.xml
```

### Core Web Vitals Optimization

#### Largest Contentful Paint (LCP)
- Optimize hero images with `next/image`
- Preload critical CSS and fonts
- Use CDN for static assets
- Implement proper caching strategies

#### First Input Delay (FID)
- Minimize JavaScript execution time
- Use code splitting for large components
- Implement service workers for offline functionality
- Optimize third-party scripts

#### Cumulative Layout Shift (CLS)
- Define image and video dimensions
- Reserve space for dynamic content
- Use CSS Grid/Flexbox for stable layouts
- Load web fonts with proper fallbacks

### Performance Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

const sendToAnalytics = (metric) => {
  // Send to your analytics service
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

## SEO Content Guidelines

### Keyword Strategy (Platform-Specific)
- **Primary**: "charity donation services", "nonprofit service marketplace", "JustGiving services", "Every.org donations"
- **Secondary**: "Melbourne charity services", "Sydney donation marketplace", "global nonprofit platform"
- **Platform-specific**: "JustGiving charity services", "Every.org nonprofit support", "dual platform donations"
- **Long-tail**: "donate to cancer research through web design service", "support nonprofits through freelance services"
- **Local**: "Brisbane tutoring charity donation", "Perth consulting nonprofit support"
- **International**: "global charity services", "international nonprofit marketplace", "multilingual donation platform"

### Content Requirements
- **Minimum 300 words** per service page
- **Clear value proposition** in first 100 words
- **Location mentions** for local SEO
- **Charity focus** in all content
- **Service benefits** clearly explained
- **Provider credibility** established

### Internal Linking Strategy (Platform-Aware)
- **Service to fundraiser**: Link each service to fundraiser profile
- **Fundraiser to services**: Link fundraiser to all their services (grouped by platform)
- **Platform organizations to services**: Link charity/nonprofit pages to supporting services
- **Cross-platform references**: Link between JustGiving charities and Every.org nonprofits when relevant
- **Category clustering**: Link related services within categories (platform-aware)
- **Location clustering**: Link services by geographic area (platform-aware filtering)
- **Platform hub pages**: Central landing pages for each platform with organization listings

## Analytics & Monitoring

### Key SEO Metrics
- **Organic traffic growth**: Monthly increases in search traffic
- **Keyword rankings**: Top 10 positions for target keywords
- **Click-through rates**: Search result CTR optimization
- **Page load speeds**: Core Web Vitals performance
- **Mobile usability**: Mobile-first indexing compliance

### Conversion Tracking
- **Service views to donations**: Conversion rate optimization
- **Search to service discovery**: User journey analysis
- **Provider profile engagement**: Profile view to service interest
- **Charity page effectiveness**: Charity discovery to service support

---

*This SEO strategy ensures maximum visibility for service fundraisers, optimal charity discovery, and strong search performance across all key pages and user journeys.*