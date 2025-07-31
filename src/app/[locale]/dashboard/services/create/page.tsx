import { Metadata } from 'next'
import AuthGuard from '@/components/auth/AuthGuard'
import ServiceCreationForm from '@/components/services/ServiceCreationForm'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import { getMessages } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Create Service | Powered by Donation',
  description: 'Create a new service offering and help supporters make meaningful charitable donations',
}

interface CreateServicePageProps {
  params: {
    locale: string
  }
}

export default async function CreateServicePage({ params }: CreateServicePageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })
  return (
    <AuthGuard>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create New Service</h1>
                <p className="mt-2 text-gray-600">
                  Offer your skills and help supporters make charitable donations. Set your fixed pricing, location options, and charity requirements.
                </p>
              </div>
              
              <ServiceCreationForm />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}