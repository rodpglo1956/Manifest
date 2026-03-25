'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loadSchema, STEP_FIELDS, type LoadInput } from '@/schemas/load'
import { createLoad } from '@/app/(app)/loads/actions'
import { updateLoad } from '@/app/(app)/loads/status-actions'
import { StepPickup } from './step-pickup'
import { StepDelivery } from './step-delivery'
import { StepFreight } from './step-freight'
import { StepRate } from './step-rate'
import { StepAssignment } from './step-assignment'
import type { Driver, Vehicle } from '@/types/database'

const STEPS = [
  { key: 'pickup' as const, label: 'Pickup' },
  { key: 'delivery' as const, label: 'Delivery' },
  { key: 'freight' as const, label: 'Freight' },
  { key: 'rate' as const, label: 'Rate & Broker' },
  { key: 'assignment' as const, label: 'Assignment' },
]

interface LoadWizardProps {
  drivers: Pick<Driver, 'id' | 'first_name' | 'last_name' | 'status'>[]
  vehicles: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model' | 'status'>[]
  editMode?: boolean
  loadId?: string
  defaultValues?: Partial<LoadInput>
}

export function LoadWizard({ drivers, vehicles, editMode, loadId, defaultValues: editDefaults }: LoadWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)

  const methods = useForm<LoadInput>({
    resolver: zodResolver(loadSchema),
    defaultValues: editDefaults ?? {
      pickup_address: '',
      pickup_city: '',
      pickup_state: '',
      pickup_zip: '',
      pickup_date: '',
      pickup_time: '',
      pickup_contact_name: '',
      pickup_contact_phone: '',
      pickup_notes: '',
      delivery_address: '',
      delivery_city: '',
      delivery_state: '',
      delivery_zip: '',
      delivery_date: '',
      delivery_time: '',
      delivery_contact_name: '',
      delivery_contact_phone: '',
      delivery_notes: '',
      commodity: '',
      weight_unit: 'lbs',
      equipment_type: 'dry_van',
      hazmat: false,
      rate_type: 'flat',
      broker_name: '',
      broker_contact: '',
      broker_phone: '',
      broker_email: '',
      broker_mc_number: '',
      broker_reference: '',
      notes: '',
    },
    mode: 'onTouched',
  })

  const { handleSubmit, trigger, formState: { isSubmitting } } = methods

  async function handleNext() {
    const step = STEPS[currentStep]
    // Get the field names for the current step
    let fieldsToValidate: string[]
    if (step.key === 'rate') {
      // Rate step includes both rate and broker fields
      fieldsToValidate = [
        ...STEP_FIELDS.rate,
        ...STEP_FIELDS.broker,
      ]
    } else {
      fieldsToValidate = [...STEP_FIELDS[step.key]]
    }

    const valid = await trigger(fieldsToValidate as (keyof LoadInput)[])
    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  async function onSubmit(data: LoadInput) {
    setServerError(null)
    const formData = new FormData()

    // Append all fields to FormData
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue
      if (typeof value === 'boolean') {
        formData.append(key, String(value))
      } else {
        formData.append(key, String(value))
      }
    }

    if (editMode && loadId) {
      const result = await updateLoad(loadId, formData)
      if (result?.error) {
        setServerError(result.error)
      } else {
        // Redirect handled by the action revalidation; manually navigate
        window.location.href = `/loads/${loadId}`
      }
      return
    }

    const result = await createLoad(formData)
    if (result?.error?.form) {
      setServerError(result.error.form[0])
    }
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
              <span
                className={`text-xs mt-1.5 transition-colors ${
                  index === currentStep
                    ? 'text-primary font-medium'
                    : index < currentStep
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="min-h-[400px]">
            {currentStep === 0 && <StepPickup />}
            {currentStep === 1 && <StepDelivery />}
            {currentStep === 2 && <StepFreight />}
            {currentStep === 3 && <StepRate />}
            {currentStep === 4 && <StepAssignment drivers={drivers} vehicles={vehicles} />}
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mt-4">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="py-2 px-4 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {isLastStep ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-6 bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? (editMode ? 'Saving...' : 'Creating Load...')
                  : (editMode ? 'Save Changes' : 'Create Load')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="py-2 px-6 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
