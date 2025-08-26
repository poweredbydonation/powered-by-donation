import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PersonalServicesContent from '@/components/services/PersonalServicesContent'

export default async function PersonalServicesPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="w-full">
      <PersonalServicesContent userId={user.id} locale={locale} />
    </div>
  )
}