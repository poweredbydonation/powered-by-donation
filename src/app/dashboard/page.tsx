import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import DeleteUserProfile from '@/components/profile/DeleteUserProfile'

// Disable caching for this page so it always shows fresh data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}!
              </h2>
              <p className="text-blue-800">
                {userProfile ? 'Your profile is set up and ready to go.' : 'Complete your profile to get started.'}
              </p>
              {userProfile && (
                <div className="mt-2 text-sm text-blue-600">
                  {userProfile.is_provider && <span className="mr-4">✓ Service Provider</span>}
                  {userProfile.is_supporter && <span>✓ Supporter</span>}
                </div>
              )}
            </div>

            {/* Profile Setup Section */}
            {!userProfile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Get Started</h3>
                <p className="text-yellow-800 mb-4">Set up your profile to start using Powered by Donation:</p>
                <Link 
                  href="/dashboard/profile/setup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  Create Your Profile
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Provider Section */}
              {userProfile?.is_provider ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Provider Dashboard</h3>
                  <p className="text-blue-700 text-sm mb-3">Manage your services and donations</p>
                  <div className="space-y-2">
                    <Link 
                      href="/dashboard/services"
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      → Manage Services
                    </Link>
                    <Link 
                      href="/dashboard/services/create"
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      → Create New Service
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Become a Provider</h3>
                  <p className="text-gray-600 text-sm mb-3">Offer services and support charities</p>
                  <Link 
                    href="/dashboard/profile"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → Enable Provider Role
                  </Link>
                </div>
              )}

              {/* Supporter Section */}
              {userProfile?.is_supporter ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Supporter Dashboard</h3>
                  <p className="text-green-700 text-sm mb-3">Track your donations and impact</p>
                  <div className="space-y-2">
                    <Link 
                      href="/dashboard/donations"
                      className="block text-green-600 hover:text-green-800 text-sm"
                    >
                      → My Donations
                    </Link>
                    <Link 
                      href="/browse"
                      className="block text-green-600 hover:text-green-800 text-sm"
                    >
                      → Browse Services
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Become a Supporter</h3>
                  <p className="text-gray-600 text-sm mb-3">Support services and charities</p>
                  <Link 
                    href="/dashboard/profile"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → Enable Supporter Role
                  </Link>
                </div>
              )}

              {/* General Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
                <p className="text-gray-600 text-sm mb-3">Manage your account preferences</p>
                <div className="space-y-2">
                  <Link 
                    href="/dashboard/profile"
                    className="block text-gray-600 hover:text-gray-800 text-sm"
                  >
                    → Edit Profile
                  </Link>
                  <Link 
                    href="/dashboard/settings"
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
                    <p><strong>Roles:</strong> 
                      {userProfile.is_provider && userProfile.is_supporter ? ' Provider & Supporter' :
                       userProfile.is_provider ? ' Provider' :
                       userProfile.is_supporter ? ' Supporter' : ' None'}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href="/dashboard/profile"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit Profile
                    </Link>
                    <DeleteUserProfile 
                      user={userProfile}
                    />
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