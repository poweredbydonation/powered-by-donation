import AuthGuard from '@/components/auth/AuthGuard'
import LoginForm from '@/components/auth/LoginForm'
import { getMessages } from 'next-intl/server'

interface SystemLoginProps {
  params: {
    locale: string
  }
}

export default async function SystemLogin({ params }: SystemLoginProps) {
  const { locale } = params
  const messages = await getMessages({ locale })

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-12">
          <LoginForm locale={locale} messages={messages} />
        </div>
      </div>
    </AuthGuard>
  )
}