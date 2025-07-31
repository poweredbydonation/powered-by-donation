import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import DeleteUserProfile from '@/components/profile/DeleteUserProfile'
import { getMessages, getTranslations } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'

// Disable caching for this page so it always shows fresh data
export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  params: {
    locale: string
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has profile in users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <AuthGuard>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('title') || 'Dashboard'}</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                {t('welcome')}{userProfile?.name ? `, ${userProfile.name}` : ''}!
              </h2>
              <p className="text-blue-800">
                {userProfile ? t('profileReady') : t('completeProfile')}
              </p>
              {userProfile && (
                <div className="mt-2 text-sm text-blue-600">
                  {userProfile.is_provider && <span className="mr-4">✓ {t('serviceProvider')}</span>}
                  {userProfile.is_supporter && <span>✓ {t('supporter')}</span>}
                </div>
              )}
            </div>

            {/* Profile Setup Section */}
            {!userProfile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">{t('getStarted')}</h3>
                <p className="text-yellow-800 mb-4">{t('setupPrompt')}</p>
                <Link 
                  href={`/${locale}/dashboard/profile/setup`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  {t('createProfile')}
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Provider Section */}
              {userProfile?.is_provider ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">{t('providerDashboard')}</h3>
                  <p className="text-blue-700 text-sm mb-3">{t('providerDescription')}</p>
                  <div className="space-y-2">
                    <Link 
                      href={`/${locale}/dashboard/services`}
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      → {t('manageServices')}
                    </Link>
                    <Link 
                      href={`/${locale}/dashboard/services/create`}
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      → {t('createNewService')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('becomeProvider')}</h3>
                  <p className="text-gray-600 text-sm mb-3">{t('providerOffer')}</p>
                  <Link 
                    href={`/${locale}/dashboard/profile`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → {t('enableProviderRole')}
                  </Link>
                </div>
              )}

              {/* Supporter Section */}
              {userProfile?.is_supporter ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">{t('supporterDashboard')}</h3>
                  <p className="text-green-700 text-sm mb-3">{t('supporterDescription')}</p>
                  <div className="space-y-2">
                    <Link 
                      href={`/${locale}/dashboard/donations`}
                      className="block text-green-600 hover:text-green-800 text-sm"
                    >
                      → {t('myDonations')}
                    </Link>
                    <Link 
                      href={`/${locale}/browse`}
                      className="block text-green-600 hover:text-green-800 text-sm"
                    >
                      → {t('browseServices')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('becomeSupporter')}</h3>
                  <p className="text-gray-600 text-sm mb-3">{t('supporterOffer')}</p>
                  <Link 
                    href={`/${locale}/dashboard/profile`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → {t('enableSupporterRole')}
                  </Link>
                </div>
              )}

              {/* General Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('accountSettings')}</h3>
                <p className="text-gray-600 text-sm mb-3">{t('accountDescription')}</p>
                <div className="space-y-2">
                  <Link 
                    href={`/${locale}/dashboard/profile`}
                    className="block text-gray-600 hover:text-gray-800 text-sm"
                  >
                    → {t('editProfile')}
                  </Link>
                  <Link 
                    href={`/${locale}/dashboard/settings`}
                    className="block text-gray-600 hover:text-gray-800 text-sm"
                  >
                    → {t('privacySettings')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Management Section */}
            {userProfile && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('profileManagement')}</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-2">{t('yourProfile')}</h3>
                  <div className="text-gray-600 text-sm mb-4">
                    <p><strong>{t('name')}:</strong> {userProfile.name}</p>
                    {userProfile.username && <p><strong>{t('username')}:</strong> {userProfile.username}</p>}
                    {userProfile.location && <p><strong>{t('location')}:</strong> {userProfile.location}</p>}
                    <p><strong>{t('roles')}:</strong> 
                      {userProfile.is_provider && userProfile.is_supporter ? ` ${t('providerAndSupporter')}` :
                       userProfile.is_provider ? ` ${t('providerRole')}` :
                       userProfile.is_supporter ? ` ${t('supporterRole')}` : ` ${t('noRoles')}`}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href={`/${locale}/dashboard/profile`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      {t('editProfile')}
                    </Link>
                    <NextIntlClientProvider messages={{ deleteProfile: messages.deleteProfile }}>
                      <DeleteUserProfile 
                        user={userProfile}
                      />
                    </NextIntlClientProvider>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}