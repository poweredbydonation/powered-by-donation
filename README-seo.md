# SEO Strategy & Implementation - Powered by Donation

## Overview

The platform implements a comprehensive SEO strategy focused on service discovery, charity impact, and provider visibility. Our approach prioritizes static generation, structured data, and performance optimization to achieve maximum search visibility.

## Page Structure for Maximum SEO

### Core Page Types
- **Services**: `/services/[slug]` - Individual service pages (SSG)
- **Categories**: `/services/category/[category]` - Service category landing pages
- **Locations**: `/services/location/[location]` - Location-based services
- **Providers**: `/provider/[slug]` - Provider profile pages
- **Supporters**: `/supporter/[slug]` - Supporter profile pages  
- **Charities**: `/charity/[slug]` - Charity impact pages showing service-driven donations (SSG)
- **Browse**: `/browse` - Main browsing page with filters
- **Search**: `/search?category=X&location=Y&amount=Z&happiness=90` - Filtered search results with quality filters

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

# Provider profiles
/provider/john-smith-web-designer
/provider/sarah-jones-tutor

# Charity pages
/charity/cancer-research-uk
/charity/save-the-children-australia
/charity/red-cross-emergency-fund
```

## SEO Implementation Requirements

### Static Site Generation (SSG)
- **Service pages**: Pre-rendered at build time for optimal performance
- **Charity pages**: Pre-rendered with regular regeneration for updated stats
- **Provider profiles**: Static generation for public profiles
- **Category/location pages**: Static generation with dynamic filtering

### Dynamic Content Strategy
- **Search results**: Client-side rendering with SSR fallbacks
- **Real-time filters**: Hydrated static content with dynamic interactions
- **User dashboards**: Dynamic rendering for authenticated areas

## Meta Tags & Open Graph Optimization

### Service Page Meta Tags
```typescript
interface ServiceSEO {
  title: `${service.title} | $${service.donation_amount} | ${provider.name} | Powered by Donation`
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

### Charity Page Meta Tags
```typescript
interface CharitySEO {
  title: `${charity.name} | ${stats.total_donations_count} Service Donations | Powered by Donation`
  description: `${charity.name} has received ${stats.total_donations_count} donations worth $${stats.total_amount_received} through our service marketplace. Support services that benefit this charity.`
  
  openGraph: {
    title: `${charity.name} - Service-Driven Donations`
    description: `${stats.total_donations_count} people have supported this charity through service donations`
    url: `https://poweredbydonation.com/charity/${charity.slug}`
    type: 'website'
    images: [
      {
        url: charity.logo_url || '/og-charity-default.jpg'
        width: 1200
        height: 630
        alt: `${charity.name} - Service Donations Impact`
      }
    ]
  }
}
```

### Provider Profile Meta Tags
```typescript
interface ProviderSEO {
  title: `${provider.name} | ${provider.services.length} Services | Powered by Donation`
  description: `${provider.name} offers ${provider.services.length} services for charitable donations. ${provider.bio ? provider.bio.substring(0, 120) + '...' : 'Support their services through donations to verified charities.'}`
  
  openGraph: {
    title: `${provider.name} - Service Provider`
    description: `${provider.services.length} services available for charitable donations`
    url: `https://poweredbydonation.com/provider/${provider.slug}`
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
    "url": "https://poweredbydonation.com/provider/john-smith"
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

### Charity Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Cancer Research UK",
  "url": "https://poweredbydonation.com/charity/cancer-research-uk",
  "description": "Leading cancer research charity fighting cancer through research",
  "logo": "https://logo-url.com/cancer-research-uk.png",
  "foundingDate": "1902",
  "nonprofitStatus": "Charitable",
  "subOrganization": {
    "@type": "Organization",
    "name": "Powered by Donation",
    "description": "Service marketplace facilitating charitable donations"
  },
  "makesOffer": {
    "@type": "Offer",
    "name": "Service-driven donations",
    "description": "Receive donations through service marketplace",
    "availableAtOrFrom": "https://poweredbydonation.com/charity/cancer-research-uk"
  }
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
    subtitle: `$${service.donation_amount} donation • ${provider.name}`,
    cta: "Support with Donation"
  },
  
  description: {
    main: service.description,
    provider_bio: provider.bio,
    location_info: service.locations,
    charity_requirements: service.charity_type
  },
  
  donation_section: {
    title: "How It Works",
    steps: [
      "Choose this service",
      `Donate $${service.donation_amount} to your chosen charity`,
      "Connect with ${provider.name}",
      "Receive your service"
    ]
  },
  
  charity_section: {
    title: service.charity_type === 'any_charity' 
      ? "Support Any Charity" 
      : "Preferred Charities",
    description: service.charity_type === 'any_charity'
      ? "Donate to any registered charity on JustGiving"
      : "Choose from provider's preferred charities",
    charities: service.preferred_charities
  },
  
  provider_section: {
    title: `About ${provider.name}`,
    bio: provider.bio,
    happiness_rate: provider.happiness_rate,
    total_services: provider.services.length,
    cta: `View all services by ${provider.name}`
  }
}
```

### Charity Page Content Structure
```typescript
const charityPageContent = {
  hero: {
    title: charity.name,
    subtitle: `${stats.total_donations_count} service-driven donations • $${stats.total_amount_received} total impact`,
    cta: "Find services supporting this charity"
  },
  
  stats_section: {
    title: "Community Impact",
    metrics: [
      `${stats.this_month_count} donations this month`,
      `$${stats.this_month_amount} raised this month`,
      `${Object.keys(service_categories).length} service categories`,
      `${stats.total_donations_count} total supporters`
    ]
  },
  
  services_section: {
    title: "Services Supporting This Charity",
    description: "Browse services where providers have chosen to support this charity",
    categories: service_categories,
    cta_link: `/search?charity=${charity.slug}`
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
    external_link: `https://justgiving.com/charity/${charity.justgiving_id}`
  }
}
```

## Technical SEO Implementation

### Sitemap Generation
```typescript
// Dynamic sitemap generation
const generateSitemap = async () => {
  const staticPages = [
    'https://poweredbydonation.com/',
    'https://poweredbydonation.com/browse',
    'https://poweredbydonation.com/how-it-works',
    'https://poweredbydonation.com/about'
  ]
  
  const services = await getPublicServices()
  const charities = await getActiveCharities()
  const providers = await getPublicProviders()
  
  const servicePages = services.map(service => 
    `https://poweredbydonation.com/services/${service.slug}`
  )
  
  const charityPages = charities.map(charity => 
    `https://poweredbydonation.com/charity/${charity.slug}`
  )
  
  const providerPages = providers.map(provider => 
    `https://poweredbydonation.com/provider/${provider.slug}`
  )
  
  return [...staticPages, ...servicePages, ...charityPages, ...providerPages]
}
```

### Robots.txt Configuration
```
User-agent: *
Allow: /
Allow: /services/
Allow: /charity/
Allow: /provider/
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

### Keyword Strategy
- **Primary**: "charity donation services", "support charity through services"
- **Secondary**: "Melbourne charity services", "Sydney donation marketplace"
- **Long-tail**: "donate to cancer research through web design service"
- **Local**: "Brisbane tutoring charity donation", "Perth consulting charity support"

### Content Requirements
- **Minimum 300 words** per service page
- **Clear value proposition** in first 100 words
- **Location mentions** for local SEO
- **Charity focus** in all content
- **Service benefits** clearly explained
- **Provider credibility** established

### Internal Linking Strategy
- **Service to provider**: Link each service to provider profile
- **Provider to services**: Link provider to all their services
- **Charity to services**: Link charity pages to supporting services
- **Category clustering**: Link related services within categories
- **Location clustering**: Link services by geographic area

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

*This SEO strategy ensures maximum visibility for service providers, optimal charity discovery, and strong search performance across all key pages and user journeys.*