import { OrgSetupForm } from '@/components/auth/org-setup-form'

export default function OnboardingPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-1">
        Set up your company
      </h2>
      <p className="text-center text-sm text-gray-500 mb-6">
        Tell us about your operation
      </p>
      <OrgSetupForm />
    </div>
  )
}
