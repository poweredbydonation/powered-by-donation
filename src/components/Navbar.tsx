'use client'

import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import LanguageSwitcher from './LanguageSwitcher'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const t = useTranslations('nav')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('Navbar mounted. User:', user?.email, 'Loading:', loading)
  }, [])

  useEffect(() => {
    console.log('Navbar auth state changed - User:', user?.email, 'Loading:', loading, 'Mounted:', mounted)
  }, [user, loading, mounted])

  const handleSignOut = async () => {
    try {
      await signOut()
      // Optionally redirect to home page after sign out
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                {t('home')} - Powered by Donation
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              {t('home')} - Powered by Donation
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user.email}
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}