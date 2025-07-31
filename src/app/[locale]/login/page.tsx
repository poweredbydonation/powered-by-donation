import AuthGuard from '@/components/auth/AuthGuard'
import LoginForm from '@/components/auth/LoginForm'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import { getMessages } from 'next-intl/server'

interface LoginPageProps {
  params: {
    locale: string
  }
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50">
        <MultilingualNavbar locale={locale} messages={messages} />
        <div className="py-12">
          <LoginForm locale={locale} messages={messages} />
        </div>
      </div>
    </AuthGuard>
  )
}