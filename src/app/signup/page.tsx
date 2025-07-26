import AuthGuard from '@/components/auth/AuthGuard'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50 py-12">
        <SignupForm />
      </div>
    </AuthGuard>
  )
}