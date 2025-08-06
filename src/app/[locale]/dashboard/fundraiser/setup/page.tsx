import { redirect } from 'next/navigation'

export default function FundraiserSetupRedirect() {
  // Redirect to new unified profile setup
  redirect('/dashboard/profile/setup')
}