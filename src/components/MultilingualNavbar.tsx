'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, ChevronDown, Heart, Building2, Users, MoreVertical } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePendingDonations } from '@/hooks/usePendingDonations'
import { LANGUAGES, getOtherLanguages, getLanguageByCode } from '@/config/languages'
import { getLocalizedServicesUrl } from '@/lib/utils/localized-urls'
import { buildPersonalUrl, getPersonalPlatformSlug, buildSystemUrl, getSystemPlatformSlug } from '@/lib/utils/entity-urls'

interface PlatformStats {
  services: number
  justgiving: number
  everyorg: number
  acnc: number
}

interface MultilingualNavbarProps {
  locale: string
  messages: any
  platformStats: PlatformStats
}

export default function MultilingualNavbar({ locale, messages, platformStats }: MultilingualNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { pendingCount } = usePendingDonations()
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Determine which section is active based on current path
  const isServicesActive = pathname.includes('/PoweredByDonation/services') || pathname.includes('/PoweredByDonation/hizmetler')
  const isJustGivingActive = pathname.includes('/justgiving')
  const isEveryOrgActive = pathname.includes('/everyorg')
  const isAcncActive = pathname.includes('/acnc')
  

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = `/${locale}`
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const currentLang = getLanguageByCode(locale) || LANGUAGES[0]
  const otherLangs = getOtherLanguages(locale)
  
  // Get the path without the locale prefix
  const getPathWithoutLocale = () => {
    console.log('MultilingualNavbar - pathname:', pathname)
    console.log('MultilingualNavbar - locale:', locale)
    
    // Remove the current locale from the beginning of the pathname
    // Handle both cases: with and without leading slash
    let pathWithoutLocale = pathname
    if (pathWithoutLocale.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathWithoutLocale.substring(`/${locale}`.length)
    }
    
    // Ensure we always have a leading slash or default to '/'
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = pathWithoutLocale || '/'
    }
    if (pathWithoutLocale === '') {
      pathWithoutLocale = '/'
    }
    
    console.log('MultilingualNavbar - getPathWithoutLocale result:', pathWithoutLocale)
    return pathWithoutLocale
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between md:justify-between py-2">
          {/* Left Side - Logo (Desktop) / Contextual Text (Mobile) */}
          <div className="flex items-center flex-1 md:flex-none">
            {/* Desktop Logo */}
            <a href={`/${locale}`} className="text-lg font-bold text-blue-600 mr-3 hidden md:inline">
              <span>Powered by Donation</span>
            </a>
            {messages?.nav?.tagline && messages.nav.tagline.trim() !== '' && (
              <div className="text-xs text-gray-600 hidden lg:block">
                {messages.nav.tagline}
              </div>
            )}
            
            {/* Mobile Contextual Text */}
            <div className="md:hidden">
              <div className="text-lg font-bold text-gray-900">
                {(() => {
                  if (isServicesActive) {
                    return 'Services'
                  } else if (isJustGivingActive) {
                    return 'JustGiving Charities'
                  } else if (isEveryOrgActive) {
                    return 'Every.org Nonprofits'
                  } else if (isAcncActive) {
                    return 'ACNC Charities & Nonprofits'
                  } else {
                    return 'Powered by Donation'
                  }
                })()}
              </div>
              <div className="text-xs text-gray-600 leading-tight">
                {(() => {
                  if (isServicesActive) {
                    return 'Find professional services and support charities'
                  } else if (isJustGivingActive) {
                    return 'Browse and discover organizations • Use the filter button to search and filter'
                  } else if (isEveryOrgActive) {
                    return 'Browse and discover organizations • Use the filter button to search and filter'
                  } else if (isAcncActive) {
                    return 'Browse and discover organizations • Use the filter button to search and filter'
                  } else {
                    return 'Donation-powered services marketplace'
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Center - Compact Platform Tiles */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Services Tile */}
            <Link 
              href={getLocalizedServicesUrl(locale)}
              className={`${
                isServicesActive 
                  ? 'bg-purple-50 border border-purple-200 text-purple-600' 
                  : 'bg-gray-50 border border-gray-200 text-gray-400'
              } rounded px-3 py-1 hover:bg-purple-100 transition-all text-center group`}
              title="Free services you can get by donating to JustGiving and Every.org charities"
            >
              <div className={`text-sm font-semibold ${isServicesActive ? 'text-purple-600' : 'text-gray-400'}`}>
                {platformStats.services.toLocaleString()} Free Services
              </div>
            </Link>

            {/* JustGiving Tile */}
            <Link 
              href={`/${locale}/justgiving/charities`}
              className={`${
                isJustGivingActive 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 border border-gray-200'
              } rounded px-3 py-1 hover:bg-blue-100 transition-all text-center group flex items-center space-x-1`}
              title="UK's leading charity fundraising platform with extensive charity database"
            >
              <img
                src="/flags/1x1/gb.svg"
                alt="UK"
                className={`w-3 h-3 rounded ${isJustGivingActive ? 'opacity-100' : 'opacity-40'}`}
              />
              <div className={`text-sm font-semibold ${isJustGivingActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {platformStats.justgiving.toLocaleString()} Charities
              </div>
            </Link>

            {/* Every.org Tile */}
            <Link 
              href={`/${locale}/everyorg/nonprofits`}
              className={`${
                isEveryOrgActive 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              } rounded px-3 py-1 hover:bg-green-100 transition-all text-center group flex items-center space-x-1`}
              title="US-based nonprofit platform with verified organizations across America"
            >
              <img
                src="/flags/1x1/us.svg"
                alt="US"
                className={`w-3 h-3 rounded ${isEveryOrgActive ? 'opacity-100' : 'opacity-40'}`}
              />
              <div className={`text-sm font-semibold ${isEveryOrgActive ? 'text-green-600' : 'text-gray-400'}`}>
                {platformStats.everyorg.toLocaleString()} Nonprofits
              </div>
            </Link>

            {/* ACNC Tile */}
            <Link 
              href={`/${locale}/acnc/charities`}
              className={`${
                isAcncActive 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-gray-50 border border-gray-200'
              } rounded px-3 py-1 hover:bg-orange-100 transition-all text-center group flex items-center space-x-1 relative`}
              title="Australian Charities and Not-for-profits Commission registry"
            >
              <img
                src="/flags/1x1/au.svg"
                alt="AU"
                className={`w-3 h-3 rounded ${isAcncActive ? 'opacity-100' : 'opacity-40'}`}
              />
              <div className={`text-sm font-semibold ${isAcncActive ? 'text-orange-600' : 'text-gray-400'}`}>
                {platformStats.acnc.toLocaleString()} Charities and Nonprofits
              </div>
              <div className={`absolute -top-1 -right-1 ${isAcncActive ? 'bg-orange-500' : 'bg-gray-400'} text-white text-xs px-1 rounded-full`} style={{fontSize: '8px'}}>
                B
              </div>
            </Link>
          </div>

          {/* Right Side - Language Selector & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Selector */}
            <div ref={langDropdownRef} className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span className="bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 px-2 py-1 rounded-full transition-colors flex items-center space-x-1">
                  <img 
                    src={currentLang.flagIcon} 
                    alt={`${currentLang.name} flag`}
                    className="w-3 h-3 rounded-sm object-cover"
                  />
                  <span className="hidden sm:inline">{currentLang.nativeName}</span>
                </span>
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-50">
                  {otherLangs.map((lang) => (
                    <a
                      key={lang.code}
                      href={`/${lang.code}${getPathWithoutLocale()}`}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsLangOpen(false)}
                    >
                      <img 
                        src={lang.flagIcon} 
                        alt={`${lang.name} flag`}
                        className="w-4 h-4 rounded-sm object-cover"
                      />
                      <span className="text-sm">{lang.nativeName}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            
            {/* Authentication-aware navigation */}
            {!mounted ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : user ? (
              <>
                {/* Profile Photo Dropdown */}
                <div ref={profileDropdownRef} className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-2 space-y-1">
                        {/* Pending Donations Notification */}
                        {pendingCount > 0 && (
                          <a
                            href={buildPersonalUrl(locale, 'donations')}
                            className="block w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm font-medium transition-colors text-left border border-yellow-200"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <div className="flex items-center justify-between">
                              <span>Pending Donations</span>
                              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                {pendingCount}
                              </span>
                            </div>
                            <div className="text-xs text-yellow-600 mt-1">
                              Click to check status
                            </div>
                          </a>
                        )}
                        
                        <a
                          href={buildPersonalUrl(locale, 'services')}
                          className="block w-full text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Services
                        </a>
                        <a
                          href={buildPersonalUrl(locale, 'service_requests')}
                          className="block w-full text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Service Requests
                        </a>
                        <a
                          href={buildPersonalUrl(locale, 'donations')}
                          className="block w-full text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Donations
                        </a>
                        <a
                          href={buildPersonalUrl(locale, 'profile')}
                          className="block w-full text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Profile
                        </a>
                        
                        <div className="border-t pt-2 mt-2">
                          <button
                            onClick={() => {
                              handleSignOut()
                              setIsProfileOpen(false)
                            }}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          >
                            {messages?.nav?.logout || 'Logout'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <a 
                href={buildSystemUrl(locale, 'login')}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {messages?.nav?.login || 'Login'}
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden flex items-center p-2 rounded-lg transition-all duration-200 ${
              isMenuOpen 
                ? 'bg-blue-600 text-white shadow-lg scale-105' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 animate-in spin-in-180 duration-200" />
            ) : (
              <MoreVertical className="h-6 w-6 animate-in fade-in duration-200" />
            )}
          </button>
        </div>


        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-blue-200 bg-gradient-to-b from-blue-50 to-white animate-in slide-in-from-top duration-300 max-h-screen overflow-y-auto">
            <div className="py-6 px-4 space-y-6 pb-8">
              {/* Mobile Authentication */}
              {!mounted ? (
                <div className="animate-pulse bg-gradient-to-r from-blue-100 to-purple-100 h-12 w-32 rounded-xl"></div>
              ) : loading ? (
                <div className="animate-pulse bg-gradient-to-r from-blue-100 to-purple-100 h-12 w-32 rounded-xl"></div>
              ) : user ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Welcome back!</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                  </div>
                  
                  {/* Mobile Pending Donations Notification */}
                  <div className="space-y-3">
                    {pendingCount > 0 && (
                      <a
                        href={buildPersonalUrl(locale, 'donations')}
                        className="block w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            <span>⚡</span>
                            <span>Pending Donations</span>
                          </span>
                          <span className="bg-white bg-opacity-30 text-white text-xs px-2 py-1 rounded-full font-bold">
                            {pendingCount}
                          </span>
                        </div>
                        <div className="text-xs text-yellow-100 mt-1">
                          Click to check status
                        </div>
                      </a>
                    )}
                    
                    <div className="space-y-3">
                      <a
                        href={buildPersonalUrl(locale, 'services')}
                        className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="flex items-center space-x-2">
                          <span>🛠️</span>
                          <span>My Services</span>
                        </span>
                      </a>
                      
                      <a
                        href={buildPersonalUrl(locale, 'service_requests')}
                        className="block w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="flex items-center space-x-2">
                          <span>📋</span>
                          <span>My Service Requests</span>
                        </span>
                      </a>
                      
                      <a
                        href={buildPersonalUrl(locale, 'donations')}
                        className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="flex items-center space-x-2">
                          <span>💝</span>
                          <span>My Donations</span>
                        </span>
                      </a>
                      
                      <a
                        href={buildPersonalUrl(locale, 'profile')}
                        className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="flex items-center space-x-2">
                          <span>👤</span>
                          <span>My Profile</span>
                        </span>
                      </a>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <span className="flex items-center space-x-2">
                        <span>👋</span>
                        <span>{messages?.nav?.logout || 'Logout'}</span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <a 
                  href={buildSystemUrl(locale, 'login')}
                  className="block bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl transition-all duration-200 font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>{messages?.nav?.login || 'Login'}</span>
                  </span>
                </a>
              )}

              {/* Mobile Language Selector */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-lg">🌍</span>
                  <div className="text-sm font-semibold text-purple-800">Choose Language:</div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {LANGUAGES.map((lang) => (
                    <a
                      key={lang.code}
                      href={`/${lang.code}${getPathWithoutLocale()}`}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                        lang.code === locale 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                          : 'bg-white hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 text-gray-700 border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <img 
                        src={lang.flagIcon} 
                        alt={`${lang.name} flag`}
                        className="w-5 h-5 rounded-sm object-cover shadow-sm"
                      />
                      <span className="text-sm font-medium">{lang.nativeName}</span>
                      {lang.code === locale && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>

              {/* Footer Links Section */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-lg">ℹ️</span>
                  <div className="text-sm font-semibold text-gray-800">Site Information:</div>
                </div>
                
                {/* Trust & Transparency */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600 text-sm">♥</span>
                    <div>
                      <div className="text-xs font-medium text-gray-800">No Platform Fees</div>
                      <div className="text-xs text-gray-600">100% donations go to charities</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-700 text-sm">⌨</span>
                    <div>
                      <div className="text-xs font-medium text-gray-800">Open Source</div>
                      <div className="text-xs text-gray-600">Transparent platform code</div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-800 mb-2">Platform</div>
                    <div className="space-y-1">
                      <a href={`/${locale}/privacy`} className="block text-xs text-gray-600 hover:text-gray-800">Privacy</a>
                      <a href={`/${locale}/terms`} className="block text-xs text-gray-600 hover:text-gray-800">Terms</a>
                      <a href={`/${locale}/contact`} className="block text-xs text-gray-600 hover:text-gray-800">Contact</a>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 mb-2">Legal</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">© 2025 PBD</div>
                      <div className="text-xs text-gray-600">ABN: 17 927 784 658</div>
                      <div className="text-xs text-gray-600">Made in Australia</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}