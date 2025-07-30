import AuthGuard from '@/components/auth/AuthGuard'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50 py-12">
        <LoginForm />
      </div>
    </AuthGuard>
  )
}