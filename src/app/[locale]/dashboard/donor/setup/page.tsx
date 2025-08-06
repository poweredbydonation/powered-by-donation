import { redirect } from 'next/navigation'

export default function DonorSetupRedirect() {
  // Redirect to new unified profile setup
  redirect('/dashboard/profile/setup')
}