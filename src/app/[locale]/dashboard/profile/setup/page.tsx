import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import UnifiedUserProfileForm from '@/components/profile/UnifiedUserProfileForm'
import { getMessages } from 'next-intl/server'

export const metadata = {
  title: 'Profile Setup - Powered by Donation',
  description: 'Set up your profile to start using Powered by Donation as a fundraiser, donor, or both',
}

interface ProfileSetupPageProps {
  params: {
    locale: string
  }
}

export default async function ProfileSetupPage({ params }: ProfileSetupPageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a profile
  const { data: existingProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile exists, redirect to profile edit instead
  if (existingProfile) {
    redirect('/dashboard/profile')
  }

  return (
    <AuthGuard>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Set Up Your Profile</h1>
            <p className="text-lg text-gray-600">
              Create your profile to start using Powered by Donation as a service fundraiser, donor, or both.
            </p>
          </div>

          <UnifiedUserProfileForm 
            user={user}
          />
        </div>
      </div>
    </AuthGuard>
  )
}