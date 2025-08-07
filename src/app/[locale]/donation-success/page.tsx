import { Metadata } from 'next'
import { getMessages } from 'next-intl/server'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import DonationSuccessContent from '@/components/DonationSuccessContent'

interface DonationSuccessPageProps {
  params: {
    locale: string
  }
  searchParams: {
    jgDonationId?: string
  }
}

export const metadata: Metadata = {
  title: 'Donation Successful | Powered by Donation',
  description: 'Thank you for your charitable donation. Your contribution makes a difference.',
  robots: 'noindex, nofollow'
}

export default async function DonationSuccessPage({ 
  params, 
  searchParams 
}: DonationSuccessPageProps) {
  const { locale } = params
  const { jgDonationId } = searchParams
  const messages = await getMessages({ locale })

  return (
    <>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50">
        <DonationSuccessContent 
          jgDonationId={jgDonationId}
          locale={locale}
        />
      </div>
    </>
  )
}