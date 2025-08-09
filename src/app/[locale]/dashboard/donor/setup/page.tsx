import { redirect } from 'next/navigation'

interface DonorSetupPageProps {
  params: {
    locale: string
  }
}

export default function DonorSetupRedirect({ params }: DonorSetupPageProps) {
  // Redirect to new unified profile setup
  redirect(`/${params.locale}/dashboard/profile/setup`)
}