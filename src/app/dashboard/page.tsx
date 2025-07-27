import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import DeleteProviderProfile from '@/components/providers/DeleteProviderProfile'
import DeleteSupporterProfile from '@/components/supporters/DeleteSupporterProfile'

// Disable caching for this page so it always shows fresh data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has provider profile
  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, bio')
    .eq('id', user?.id)
    .single()

  // Check if user has supporter profile  
  const { data: supporter } = await supabase
    .from('supporters')
    .select('id, name, bio')
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
                Welcome back!
              </h2>
              <p className="text-blue-700">
                Email: {user?.email}
              </p>
              <div className="mt-2 text-sm text-blue-600">
                {provider && <span className="mr-4">✓ Provider Profile</span>}
                {supporter && <span>✓ Supporter Profile</span>}
              </div>
            </div>

            {/* Profile Setup Section */}
            {!provider && !supporter && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Get Started</h3>
                <p className="text-yellow-800 mb-4">Choose how you'd like to use Powered by Donation:</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link 
                    href="/dashboard/provider/setup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-center hover:bg-blue-700 transition-colors"
                  >
                    Become a Provider
                  </Link>
                  <Link 
                    href="/dashboard/supporter/setup"
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-center hover:bg-green-700 transition-colors"
                  >
                    Become a Supporter
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Provider Section */}
              {provider ? (
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
                    href="/dashboard/provider/setup"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → Set up Provider Profile
                  </Link>
                </div>
              )}

              {/* Supporter Section */}
              {supporter ? (
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
                    href="/dashboard/supporter/setup"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    → Set up Supporter Profile
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
            {(provider || supporter) && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {provider && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Provider Profile</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Name: {provider.name}
                      </p>
                      <DeleteProviderProfile 
                        providerId={provider.id}
                        providerName={provider.name}
                      />
                    </div>
                  )}
                  
                  {supporter && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Supporter Profile</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {supporter.name ? `Name: ${supporter.name}` : 'Anonymous profile'}
                      </p>
                      <DeleteSupporterProfile 
                        supporterId={supporter.id}
                        supporterName={supporter.name}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}