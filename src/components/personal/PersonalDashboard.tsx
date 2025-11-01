import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeleteUserProfile from '@/components/profile/DeleteUserProfile'
import UnifiedUserProfileForm from '@/components/profile/UnifiedUserProfileForm'
import ServiceCreationForm from '@/components/services/ServiceCreationForm'
import PersonalServicesContent from '@/components/services/PersonalServicesContent'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { buildPersonalUrl } from '@/lib/utils/entity-urls'
import { getLocalizedServicesUrl } from '@/lib/utils/localized-urls'
import { EntityType } from '@/lib/utils/entity-urls'
import { WorkflowDashboard } from '@/components/workflow/WorkflowDashboard'

// Disable caching for this page so it always shows fresh data
export const dynamic = 'force-dynamic'

interface PersonalDashboardProps {
  params: {
    locale: string
  }
  activeSection: EntityType
}

export default async function PersonalDashboard({ params, activeSection }: PersonalDashboardProps) {
  const { locale } = params
  const messages = await getMessages({ locale })
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has profile in users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Render different content based on active section
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'services':
        return (
          <div className="min-h-screen bg-gray-50">
            {userProfile && (
              <NextIntlClientProvider messages={messages}>
                <PersonalServicesContent 
                  userId={userProfile.id} 
                  locale={locale} 
                />
              </NextIntlClientProvider>
            )}
          </div>
        )
      
      case 'donations':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Donations</h1>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">Track your donation history and impact.</p>
            </div>
            {/* TODO: Add donations list component here */}
          </div>
        )
      
      case 'service_requests':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Service Requests</h1>
            
            {/* Service Requests Workflow Dashboard */}
            {userProfile && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <NextIntlClientProvider messages={messages}>
                  <WorkflowDashboard userId={userProfile.id} />
                </NextIntlClientProvider>
              </div>
            )}
          </div>
        )
      
      case 'profile':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            
            {/* Profile Form - for both creation and editing */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {userProfile ? 'Edit Profile' : 'Create Profile'}
              </h2>
              <UnifiedUserProfileForm user={user} existingProfile={userProfile} locale={locale} />
            </div>

            {/* Delete Profile Section - only show if user has profile */}
            {userProfile && (
              <div className="bg-white border border-red-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-red-700 text-sm mb-4">
                  Permanently delete your profile and all associated data.
                </p>
                <NextIntlClientProvider messages={{ deleteProfile: messages.deleteProfile }}>
                  <DeleteUserProfile user={userProfile} />
                </NextIntlClientProvider>
              </div>
            )}
          </div>
        )
      
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-gray-800">Settings page coming soon.</p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome{userProfile?.name ? `, ${userProfile.name}` : ''}!
              </h2>
              <p className="text-blue-800">
                {userProfile ? 'Your profile is set up and ready to use.' : 'Please complete your profile to get started.'}
              </p>
            </div>

            {/* Profile Setup Section */}
            {!userProfile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Get Started</h3>
                <p className="text-yellow-800 mb-4">Set up your profile to start offering services or making donations.</p>
                <Link 
                  href={buildPersonalUrl(locale, 'profile')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  Create Profile
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Services Dashboard */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Services Dashboard</h3>
                <p className="text-blue-700 text-sm mb-3">Manage your services and view requests.</p>
                <div className="space-y-2">
                  <Link 
                    href={buildPersonalUrl(locale, 'services')}
                    className="block text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → Manage Services
                  </Link>
                  <Link 
                    href={buildPersonalUrl(locale, 'services')}
                    className="block text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → Create New Service
                  </Link>
                </div>
              </div>

              {/* Donations Dashboard */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Donations Dashboard</h3>
                <p className="text-green-700 text-sm mb-3">Track your donations and impact.</p>
                <div className="space-y-2">
                  <Link 
                    href={buildPersonalUrl(locale, 'donations')}
                    className="block text-green-600 hover:text-green-800 text-sm"
                  >
                    → My Donations
                  </Link>
                  <Link 
                    href={getLocalizedServicesUrl(locale)}
                    className="block text-green-600 hover:text-green-800 text-sm"
                  >
                    → Browse Services
                  </Link>
                </div>
              </div>

              {/* General Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
                <p className="text-gray-600 text-sm mb-3">Manage your account and privacy settings.</p>
                <div className="space-y-2">
                  <Link 
                    href={buildPersonalUrl(locale, 'profile')}
                    className="block text-gray-600 hover:text-gray-800 text-sm"
                  >
                    → Edit Profile
                  </Link>
                  <Link 
                    href={buildPersonalUrl(locale, 'settings')}
                    className="block text-gray-600 hover:text-gray-800 text-sm"
                  >
                    → Privacy Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Management Section */}
            {userProfile && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Management</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-2">Your Profile</h3>
                  <div className="text-gray-600 text-sm mb-4">
                    <p><strong>Name:</strong> {userProfile.name}</p>
                    {userProfile.username && <p><strong>Username:</strong> {userProfile.username}</p>}
                    {userProfile.location && <p><strong>Location:</strong> {userProfile.location}</p>}
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href={buildPersonalUrl(locale, 'profile')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit Profile
                    </Link>
                    <NextIntlClientProvider messages={{ deleteProfile: messages.deleteProfile }}>
                      <DeleteUserProfile user={userProfile} />
                    </NextIntlClientProvider>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}