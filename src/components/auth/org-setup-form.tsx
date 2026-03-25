'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  organizationSchema,
  type OrganizationInput,
} from '@/schemas/organization'
import { createOrganization } from '@/app/(auth)/onboarding/actions'

export function OrgSetupForm() {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      company_type: 'dot_carrier',
    },
  })

  async function onSubmit(data: OrganizationInput) {
    setServerError(null)
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    const result = await createOrganization(formData)
    if (result?.error?.form) {
      setServerError(result.error.form[0])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Company Info
        </h3>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Acme Trucking LLC"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="555-123-4567"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="info@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Address
        </h3>

        <div>
          <label
            htmlFor="address_line1"
            className="block text-sm font-medium mb-1"
          >
            Street
          </label>
          <input
            id="address_line1"
            type="text"
            {...register('address_line1')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="address_city"
              className="block text-sm font-medium mb-1"
            >
              City
            </label>
            <input
              id="address_city"
              type="text"
              {...register('address_city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="address_state"
              className="block text-sm font-medium mb-1"
            >
              State
            </label>
            <input
              id="address_state"
              type="text"
              maxLength={2}
              {...register('address_state')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
              placeholder="TX"
            />
            {errors.address_state && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address_state.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="address_zip"
              className="block text-sm font-medium mb-1"
            >
              ZIP
            </label>
            <input
              id="address_zip"
              type="text"
              maxLength={10}
              {...register('address_zip')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="75201"
            />
          </div>
        </div>
      </div>

      {/* Carrier Details Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Carrier Details
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Company Type <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="dot_carrier"
                {...register('company_type')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">DOT Carrier</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="non_dot_carrier"
                {...register('company_type')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">Non-DOT Carrier</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="both"
                {...register('company_type')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">Both</span>
            </label>
          </div>
          {errors.company_type && (
            <p className="mt-1 text-sm text-red-600">
              {errors.company_type.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="dot_number"
              className="block text-sm font-medium mb-1"
            >
              DOT Number
            </label>
            <input
              id="dot_number"
              type="text"
              {...register('dot_number')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="USDOT1234567"
            />
          </div>
          <div>
            <label
              htmlFor="mc_number"
              className="block text-sm font-medium mb-1"
            >
              MC Number
            </label>
            <input
              id="mc_number"
              type="text"
              {...register('mc_number')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="MC-654321"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional -- FMCSA is phasing out MC numbers
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Setting up...' : 'Set up company'}
      </button>
    </form>
  )
}
