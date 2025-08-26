'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import ServiceCard from './ServiceCard'
import { Service } from '@/types/database'

interface ServiceWithUser extends Service {
  user: {
    name: string
    bio?: string
    location?: string
  } | null
}

interface PersonalServicesContentProps {
  userId: string
  locale: string
}

export default function PersonalServicesContent({ userId, locale }: PersonalServicesContentProps) {
  const t = useTranslations('services')
  const [services, setServices] = useState<ServiceWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadServices = async () => {
    setLoading(true)
    console.log('Loading services for userId:', userId)
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          user:users!services_user_id_fkey (
            name,
            bio,
            location
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading services:', error)
      } else {
        console.log('Loaded services:', data)
        setServices(data || [])
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [userId])

  if (loading) {
    return (
      <div className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">{t('loading')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your services and track donation requests
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={loadServices} 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/${locale}/services/create`}>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg mx-2 sm:mx-0">
          <div className="text-gray-500 mb-4">No services created yet</div>
          <p className="text-sm text-gray-400 mb-6">
            Create your first service to start receiving donations
          </p>
          <Link href={`/${locale}/services/create`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Service
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              locale={locale}
              showManageButton={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}