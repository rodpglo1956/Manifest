'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { integrationsSchema, type IntegrationsInput } from '@/lib/onboarding/schemas'
import { saveIntegrations } from '@/lib/onboarding/actions'

const ELD_PROVIDERS = ['KeepTruckin', 'Samsara', 'Geotab', 'Omnitracs', 'Other']
const FUEL_CARD_PROVIDERS = ['Comdata', 'WEX', 'EFS', 'Fuelman', 'Other']
const ACCOUNTING_PROVIDERS = ['QuickBooks', 'Xero', 'FreshBooks', 'Wave', 'Other']

interface IntegrationsStepProps {
  onNext: () => void
  onBack: () => void
}

export function IntegrationsStep({ onNext, onBack }: IntegrationsStepProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<IntegrationsInput>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: {
      eld_provider: '',
      fuel_card_provider: '',
      accounting_provider: '',
    },
  })

  const onSubmit = (data: IntegrationsInput) => {
    startTransition(async () => {
      const result = await saveIntegrations(data)
      if (result?.error) {
        setError('root', { message: result.error })
        return
      }
      onNext()
    })
  }

  const handleSkipAll = () => {
    startTransition(async () => {
      const result = await saveIntegrations({})
      if (result?.error) {
        setError('root', { message: result.error })
        return
      }
      onNext()
    })
  }

  const integrations = [
    {
      title: 'ELD Provider',
      description: 'Connect your Electronic Logging Device for automatic HOS tracking',
      field: 'eld_provider' as const,
      providers: ELD_PROVIDERS,
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Fuel Card',
      description: 'Import fuel transactions automatically for IFTA reporting',
      field: 'fuel_card_provider' as const,
      providers: FUEL_CARD_PROVIDERS,
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'Accounting',
      description: 'Sync invoices and expenses with your accounting software',
      field: 'accounting_provider' as const,
      providers: ACCOUNTING_PROVIDERS,
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Connect Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">
          Optional -- you can set these up later from Settings
        </p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{errors.root.message}</div>
      )}

      <div className="space-y-4">
        {integrations.map(integration => (
          <div
            key={integration.field}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{integration.icon}</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{integration.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{integration.description}</p>
                <select
                  {...register(integration.field)}
                  className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Skip for now</option>
                  {integration.providers.map(p => (
                    <option key={p} value={p.toLowerCase().replace(/\s+/g, '_')}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Integration connections are coming soon. Selecting a provider helps us prioritize.
      </p>

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkipAll}
            disabled={isPending}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Skip all
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isPending ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </form>
  )
}
