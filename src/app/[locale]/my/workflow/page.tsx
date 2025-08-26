import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkflowDashboard } from '@/components/workflow/WorkflowDashboard'

export default async function MyWorkflowPage({
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <WorkflowDashboard userId={user.id} userRole="both" />
    </div>
  )
}