'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Truck,
  Smartphone,
  UserCheck,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Download,
} from 'lucide-react'

interface DriverInfo {
  firstName: string
  lastName: string
  phone: string | null
  vehicleUnit: string | null
  companyName: string
}

interface DriverOnboardingProps {
  driver: DriverInfo
  driverId: string
  markOnboarded: () => Promise<{ success?: boolean; error?: string }>
}

const STEPS = [
  { key: 'welcome', label: 'Welcome', icon: Truck },
  { key: 'pwa', label: 'Install App', icon: Smartphone },
  { key: 'confirm', label: 'Confirm Details', icon: UserCheck },
  { key: 'tutorial', label: 'First Inspection', icon: ClipboardCheck },
] as const

export function DriverOnboarding({ driver, driverId, markOnboarded }: DriverOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true))

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await markOnboarded()
      if (result.success) {
        router.push('/driver')
      }
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 border-b border-gray-100">
        {STEPS.map((step, idx) => (
          <div
            key={step.key}
            className={`h-2 w-2 rounded-full transition-colors ${
              idx === currentStep
                ? 'bg-blue-600'
                : idx < currentStep
                  ? 'bg-blue-300'
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="p-6 min-h-[320px]">
        {/* Step 1: Welcome */}
        {currentStep === 0 && (
          <div className="text-center space-y-4">
            <Truck className="h-12 w-12 text-blue-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome to {driver.companyName}
            </h2>
            <p className="text-gray-600">
              Hi {driver.firstName}, you have been set up as a driver
              {driver.vehicleUnit ? ` on unit ${driver.vehicleUnit}` : ''}.
            </p>
            <p className="text-sm text-gray-500">
              Let us get you ready to start your first trip. This will only take a minute.
            </p>
          </div>
        )}

        {/* Step 2: PWA Install */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Install the App</h2>
            </div>

            {isStandalone ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-800">
                  App is already installed! You are good to go.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Add Manifest to your home screen for the best experience.
                </p>

                {isIOS && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-900">On your iPhone/iPad:</p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Tap the Share button (square with arrow) at the bottom of Safari</li>
                      <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                      <li>Tap &quot;Add&quot; to confirm</li>
                    </ol>
                  </div>
                )}

                {isAndroid && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-900">On your Android device:</p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Tap the menu (three dots) in Chrome</li>
                      <li>Tap &quot;Add to Home screen&quot;</li>
                      <li>Tap &quot;Add&quot; to confirm</li>
                    </ol>
                  </div>
                )}

                {!isIOS && !isAndroid && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    <Download className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Look for the install prompt in your browser address bar, or use your
                      browser menu to add this app to your device.
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center">
                  You can skip this step and install later from the app.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Confirm Your Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                Make sure your information is correct.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">
                  {driver.firstName} {driver.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">
                  {driver.phone ?? 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Company</span>
                <span className="text-sm font-medium text-gray-900">
                  {driver.companyName}
                </span>
              </div>
              {driver.vehicleUnit && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Assigned Vehicle</span>
                  <span className="text-sm font-medium text-gray-900">
                    {driver.vehicleUnit}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Contact your dispatcher if any information is incorrect.
            </p>
          </div>
        )}

        {/* Step 4: Pre-trip Tutorial */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <ClipboardCheck className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Your First Pre-Trip</h2>
              <p className="text-sm text-gray-500 mt-1">
                Here is how to complete a DVIR inspection.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  num: 1,
                  title: 'Go to Fleet',
                  desc: 'Open the Fleet tab to see your assigned vehicle.',
                },
                {
                  num: 2,
                  title: 'Start Inspection',
                  desc: 'Tap "Log Inspection" to begin a new DVIR.',
                },
                {
                  num: 3,
                  title: 'Check Each Category',
                  desc: 'Go through brakes, tires, lights, and other items. Mark pass or fail.',
                },
                {
                  num: 4,
                  title: 'Submit Report',
                  desc: 'Add notes for any defects found, then submit your report.',
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                    {step.num}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Setting up...' : 'Get Started'}
          </button>
        )}
      </div>
    </div>
  )
}
