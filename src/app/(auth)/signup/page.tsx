import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Create your account | Manifest',
}

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        Create your account
      </h2>
      <SignupForm />
    </div>
  )
}
