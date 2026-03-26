import { redirect } from 'next/navigation'
import { getOnboardingProgress } from '@/lib/onboarding/actions'
import { OnboardingWizard } from '@/components/onboarding/wizard'

export default async function OnboardingPage() {
  const progress = await getOnboardingProgress()

  // If onboarding is complete, redirect to dashboard
  if (progress?.completed_at) {
    redirect('/dashboard')
  }

  return <OnboardingWizard initialStep={progress?.step_completed ?? 0} />
}
