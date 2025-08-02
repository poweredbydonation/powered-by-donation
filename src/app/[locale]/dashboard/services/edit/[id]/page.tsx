'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import ServiceCreationForm from '@/components/services/ServiceCreationForm'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database'

export default function EditServicePage() {
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<any>({})
  
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  
  const serviceId = params.id as string
  const locale = params.locale as string

  useEffect(() => {
    // Load messages
    async function loadMessages() {
      try {
        const msgs = (await import(`../../../../../../messages/${locale}.json`)).default
        setMessages(msgs)
      } catch (error) {
        // Fallback to English
        const msgs = (await import(`../../../../../../messages/en.json`)).default
        setMessages(msgs)
      }
    }

    async function fetchService() {
      if (!user || !serviceId) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .eq('user_id', user.id) // Ensure user owns this service
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Service not found or you do not have permission to edit it.')
          } else {
            throw fetchError
          }
          return
        }

        setService(data)
      } catch (err) {
        console.error('Error fetching service:', err)
        setError('Failed to load service. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
    fetchService()
  }, [user, serviceId, supabase, locale])

  const handleUpdateSuccess = () => {
    router.push(`/${locale}/dashboard/services`)
  }

  if (loading) {
    return (
      <AuthGuard>
        <MultilingualNavbar locale={locale} messages={messages} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <MultilingualNavbar locale={locale} messages={messages} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-800">
                <h3 className="font-medium mb-2">Error loading service</h3>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => router.push(`/${locale}/dashboard/services`)}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  Back to My Services
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!service) {
    return null
  }

  return (
    <AuthGuard>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="mt-2 text-gray-600">
              Update your service details and settings
            </p>
          </div>

          <ServiceCreationForm
            initialData={service}
            onSuccess={handleUpdateSuccess}
            mode="edit"
          />
        </div>
      </div>
    </AuthGuard>
  )
}