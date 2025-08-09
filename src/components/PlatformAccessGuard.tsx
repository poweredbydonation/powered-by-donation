'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DonationPlatform } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface PlatformAccessGuardProps {
  servicePlatform: DonationPlatform
  serviceTitle: string
  locale: string
  children: React.ReactNode
}

export default function PlatformAccessGuard({ 
  servicePlatform, 
  serviceTitle, 
  locale, 
  children 
}: PlatformAccessGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [userPlatform, setUserPlatform] = useState<DonationPlatform | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMismatchMessage, setShowMismatchMessage] = useState(false)

  useEffect(() => {
    async function checkPlatformAccess() {
      if (!user) {
        // Anonymous users can access any service
        setLoading(false)
        return
      }

      const supabase = createClient()
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('preferred_platform')
          .eq('id', user.id)
          .single()
        
        const platform = userProfile?.preferred_platform || 'justgiving'
        setUserPlatform(platform)
        
        if (platform !== servicePlatform) {
          setShowMismatchMessage(true)
          // Redirect after 3 seconds
          setTimeout(() => {
            router.push(`/${locale}/browse`)
          }, 3000)
        }
      } catch (err) {
        // If we can't get user platform, allow access
      }
      
      setLoading(false)
    }

    checkPlatformAccess()
  }, [user, servicePlatform, router, locale])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showMismatchMessage) {
    const platformNames = {
      justgiving: 'JustGiving',
      every_org: 'Every.org'
    } as const

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md mx-4 p-8 text-center">
          <div className="text-yellow-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Platform Mismatch
          </h1>
          
          <div className="text-gray-600 mb-6 space-y-2">
            <p>
              This service "{serviceTitle}" is available through <strong>{platformNames[servicePlatform]}</strong>.
            </p>
            <p>
              Your account is set up for <strong>{userPlatform ? platformNames[userPlatform] : 'JustGiving'}</strong> services.
            </p>
            <p>
              Redirecting you to browse services on your preferred platform...
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Redirecting in 3 seconds...</span>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => router.push(`/${locale}/browse`)}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Go to Browse Now
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-2">
            <p>
              <strong>Want to access {platformNames[servicePlatform]} services?</strong>
              <br />
              Update your platform preference in your profile settings.
            </p>
            <p>
              <strong>Why do we separate platforms?</strong>
              <br />
              Each platform has different charities, donation processes, and features. 
              Separating them ensures the best experience for your preferred platform.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}