import { redirect } from 'next/navigation'

export default function ProviderSetupRedirect() {
  // Redirect to new unified profile setup
  redirect('/dashboard/profile/setup')
}