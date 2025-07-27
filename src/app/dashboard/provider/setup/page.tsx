import AuthGuard from '@/components/auth/AuthGuard'
import ProviderSetupForm from '@/components/providers/ProviderSetupForm'
import Navbar from '@/components/Navbar'

export default function ProviderSetupPage() {
  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Provider</h1>
            <p className="text-gray-600 mb-8">
              Set up your provider profile to start offering services and supporting charities.
            </p>
            
            <ProviderSetupForm />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}