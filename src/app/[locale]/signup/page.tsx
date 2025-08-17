import AuthGuard from '@/components/auth/AuthGuard'
import SignupForm from '@/components/auth/SignupForm'
import { getMessages } from 'next-intl/server'

interface SignupPageProps {
  params: {
    locale: string
  }
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-12">
          <SignupForm locale={locale} messages={messages} />
        </div>
      </div>
    </AuthGuard>
  )
}