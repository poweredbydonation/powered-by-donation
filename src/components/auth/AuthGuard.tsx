'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'en'

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(`/${locale}${redirectTo}`)
      } else if (!requireAuth && user) {
        router.push(`/${locale}/dashboard`)
      }
    }
  }, [user, loading, requireAuth, redirectTo, router, locale])

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