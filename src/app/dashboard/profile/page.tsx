import AuthGuard from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/components/profile/ProfileEditor'
import Navbar from '@/components/Navbar'

// Disable caching for this page so it always shows fresh data
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Check if user has provider profile
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if user has supporter profile  
  const { data: supporter } = await supabase
    .from('supporters')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>
            
            <ProfileEditor 
              user={user}
              provider={provider}
              supporter={supporter}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}