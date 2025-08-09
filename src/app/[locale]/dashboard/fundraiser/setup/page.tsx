import { redirect } from 'next/navigation'

interface FundraiserSetupPageProps {
  params: {
    locale: string
  }
}

export default function FundraiserSetupRedirect({ params }: FundraiserSetupPageProps) {
  // Redirect to new unified profile setup
  redirect(`/${params.locale}/dashboard/profile/setup`)
}