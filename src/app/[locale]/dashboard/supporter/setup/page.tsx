import { redirect } from 'next/navigation'

export default function SupporterSetupRedirect() {
  // Redirect to new unified profile setup
  redirect('/dashboard/profile/setup')
}