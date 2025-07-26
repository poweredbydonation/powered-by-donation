import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome back!
              </h2>
              <p className="text-blue-700">
                You're successfully authenticated. Email: {user?.email}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
                <p className="text-gray-600 text-sm">Manage your account settings</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Donations</h3>
                <p className="text-gray-600 text-sm">Track your donation history</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-600 text-sm">Configure your preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}