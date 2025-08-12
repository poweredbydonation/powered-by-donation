/**
 * Services Browse Page - Localized
 * URL: /services (en), /hizmetler (tr), etc.
 * Main services browsing with platform and location filtering
 */

import BrowsePage from '@/app/[locale]/browse/page'

interface ServicesPageProps {
  params: {
    locale: string
  }
}

export default function ServicesPage({ params }: ServicesPageProps) {
  // Reuse the existing browse page component
  return <BrowsePage params={params} />
}

// SEO metadata
export async function generateMetadata({ params }: ServicesPageProps) {
  const { locale } = params
  
  // Basic metadata (could be enhanced with translations)
  return {
    title: 'Browse Services - Powered by Donation',
    description: 'Find professional services and support charities through skill-based donations.',
    alternates: {
      canonical: `/${locale}/services`,
      languages: {
        'en': '/en/services',
        'tr': '/tr/hizmetler',
        'de': '/de/dienstleistungen',
        'es': '/es/servicios',
        'fr': '/fr/services',
        'it': '/it/servizi',
        'pt': '/pt/servicos',
        'ja': '/ja/sabisu',
        'ko': '/ko/seobiseu',
        'zh': '/zh/fuwu',
        'ar': '/ar/khadamat',
        'hi': '/hi/sevayeN',
        'tl': '/tl/mga-serbisyo',
        'el': '/el/ypiresies',
        'yue': '/yue/fok-mou',
        'pa': '/pa/sevavaN',
        'vi': '/vi/dich-vu'
      }
    }
  }
}