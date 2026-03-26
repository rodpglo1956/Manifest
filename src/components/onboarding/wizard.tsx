'use client'

import { useState, useCallback } from 'react'
import { BusinessProfileStep } from '@/components/onboarding/steps/business-profile'
import { FirstVehicleStep } from '@/components/onboarding/steps/first-vehicle'
import { FirstDriverStep } from '@/components/onboarding/steps/first-driver'
import { IntegrationsStep } from '@/components/onboarding/steps/integrations'
import { PlanSelectionStep } from '@/components/onboarding/steps/plan-selection'
import { completeOnboarding } from '@/lib/onboarding/actions'

const STEPS = [
  { key: 'business-profile', label: 'Business Profile' },
  { key: 'first-vehicle', label: 'First Vehicle' },
  { key: 'first-driver', label: 'First Driver' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'plan-selection', label: 'Select Plan' },
]

interface OnboardingWizardProps {
  initialStep: number
}

export function OnboardingWizard({ initialStep }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isOO, setIsOO] = useState(false)
  const [fleetSize, setFleetSize] = useState<string>('1-5')

  const visibleSteps = isOO
    ? STEPS.filter(s => s.key !== 'first-driver')
    : STEPS

  // Map current step index to actual step key
  const activeStepKey = visibleSteps[currentStep]?.key ?? 'business-profile'

  const handleNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, visibleSteps.length - 1))
  }, [visibleSteps.length])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const handleBusinessProfileDone = useCallback((carrierFleetSize: string) => {
    setFleetSize(carrierFleetSize)
    // Detect OO: fleet size 1-5 could be OO, but we'll let them choose to skip driver
    handleNext()
  }, [handleNext])

  const handleSkipDriver = useCallback(() => {
    setIsOO(true)
    handleNext()
  }, [handleNext])

  const handleComplete = useCallback(async () => {
    await completeOnboarding()
  }, [])

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStep
            const isActive = index === currentStep

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 text-center ${
                      isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < visibleSteps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 mt-[-16px] ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeStepKey === 'business-profile' && (
          <BusinessProfileStep onNext={handleBusinessProfileDone} />
        )}
        {activeStepKey === 'first-vehicle' && (
          <FirstVehicleStep onNext={handleNext} onBack={handleBack} />
        )}
        {activeStepKey === 'first-driver' && (
          <FirstDriverStep
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkipDriver}
          />
        )}
        {activeStepKey === 'integrations' && (
          <IntegrationsStep onNext={handleNext} onBack={handleBack} />
        )}
        {activeStepKey === 'plan-selection' && (
          <PlanSelectionStep
            fleetSize={fleetSize}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
