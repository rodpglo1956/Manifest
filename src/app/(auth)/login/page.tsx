import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign in to Manifest',
}

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        Sign in to Manifest
      </h2>
      <LoginForm />
    </div>
  )
}
