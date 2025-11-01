import { Metadata } from 'next'
import { getMessages } from 'next-intl/server'
import DonationSuccessContent from '@/components/DonationSuccessContent'

interface SystemDonationSuccessProps {
  params: {
    locale: string
  }
  searchParams: {
    jgDonationId?: string
  }
}

export default async function SystemDonationSuccess({ 
  params, 
  searchParams 
}: SystemDonationSuccessProps) {
  const { locale } = params
  const { jgDonationId } = searchParams
  const messages = await getMessages({ locale })

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <DonationSuccessContent 
          jgDonationId={jgDonationId}
          locale={locale}
        />
      </div>
    </>
  )
}