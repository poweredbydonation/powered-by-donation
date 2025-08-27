/**
 * Personal Service Detail Page - Dynamic Route
 * Handles: /my/services/{slug}
 * Shows individual service details in personal context
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

interface PersonalServicePageProps {
  params: {
    locale: string
    slug: string
  }
}

// Dynamic import for Service component
const ServicePage = () => import('@/components/ServicePageContent').then(m => m.default)

export default async function PersonalServicePage({ params }: PersonalServicePageProps) {
  const { locale, slug } = params
  
  // Import the service page content dynamically
  const ServicePageContent = await ServicePage()
  
  return (
    <Suspense fallback={<div>Loading service...</div>}>
      <ServicePageContent 
        params={{ locale, slug }}
      />
    </Suspense>
  )
}

// Generate metadata for the service page
export async function generateMetadata({ params }: PersonalServicePageProps) {
  const { slug } = params
  
  try {
    const supabase = createClient()
    const { data: service } = await supabase
      .from('services')
      .select('title, description')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!service) {
      return {
        title: 'Service Not Found',
      }
    }

    return {
      title: service.title,
      description: service.description || `Service: ${service.title}`,
    }
  } catch (error) {
    return {
      title: 'Service Not Found',
    }
  }
}