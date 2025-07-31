'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Explicitly redirect with locale to ensure it's preserved
        if (locale) {
          window.location.href = `/${locale}/login`
        } else {
          router.push('/login')
        }
      } else if (!requireAuth && user) {
        // Explicitly redirect with locale to ensure it's preserved
        if (locale) {
          window.location.href = `/${locale}/dashboard`
        } else {
          router.push('/dashboard')
        }
      }
    }
  }, [user, loading, requireAuth, router, locale])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, show nothing (will redirect)
  if (requireAuth && !user) {
    return null
  }

  // If auth is not required but user is authenticated, show nothing (will redirect)
  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}