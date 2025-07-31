import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import UnifiedUserProfileForm from '@/components/profile/UnifiedUserProfileForm'
import { getMessages } from 'next-intl/server'

// Disable caching for this page so it always shows fresh data
export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: {
    locale: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Check if user has profile in users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile exists, redirect to setup
  if (!userProfile) {
    redirect('/dashboard/profile/setup')
  }

  return (
    <AuthGuard>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>
            
            <UnifiedUserProfileForm 
              user={user}
              existingProfile={userProfile}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}