import AuthGuard from '@/components/auth/AuthGuard'
import SupporterSetupForm from '@/components/supporters/SupporterSetupForm'

export default function SupporterSetupPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Supporter</h1>
            <p className="text-gray-600 mb-8">
              Set up your supporter profile to start supporting services and charities.
            </p>
            
            <SupporterSetupForm />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}