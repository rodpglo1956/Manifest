'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { companySchema, type CompanyInput } from '@/lib/crm/schemas'
import { createCompany, updateCompany } from '@/app/(app)/crm/actions'
import type { CrmCompany } from '@/types/database'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90']

interface CompanyFormProps {
  company?: CrmCompany
  onSuccess?: () => void
  onCancel?: () => void
}

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!company

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: company
      ? {
          name: company.name,
          company_type: company.company_type,
          mc_number: company.mc_number ?? '',
          dot_number: company.dot_number ?? '',
          credit_score: company.credit_score ?? undefined,
          days_to_pay: company.days_to_pay ?? undefined,
          payment_terms: company.payment_terms ?? '',
          factoring_company: company.factoring_company ?? '',
          primary_contact_name: company.primary_contact_name ?? '',
          primary_contact_email: company.primary_contact_email ?? '',
          primary_contact_phone: company.primary_contact_phone ?? '',
          address_line1: company.address_line1 ?? '',
          city: company.city ?? '',
          state: company.state ?? '',
          zip: company.zip ?? '',
          website: company.website ?? '',
          notes: company.notes ?? '',
          status: company.status,
          tags: company.tags,
        }
      : {
          company_type: 'prospect',
          status: 'prospect',
          tags: [],
        },
  })

  function onSubmit(data: CompanyInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCompany(company!.id, data)
        : await createCompany(data)

      if (result.error) {
        const msgs = 'form' in result.error ? result.error.form : [String(result.error)]
        setError('root', { message: msgs.join(', ') })
        return
      }

      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.root.message}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            {...register('company_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="customer">Customer</option>
            <option value="broker">Broker</option>
            <option value="vendor">Vendor</option>
            <option value="partner">Partner</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label>
          <input {...register('mc_number')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label>
          <input {...register('dot_number')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label>
          <input type="number" {...register('credit_score')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Days to Pay</label>
          <input type="number" {...register('days_to_pay')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
          <select {...register('payment_terms')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value="">Select...</option>
            {PAYMENT_TERMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Factoring Company</label>
          <input {...register('factoring_company')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input {...register('primary_contact_name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" {...register('primary_contact_email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            {errors.primary_contact_email && <p className="text-xs text-red-500 mt-1">{errors.primary_contact_email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" {...register('primary_contact_phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input {...register('address_line1')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input {...register('city')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select {...register('state')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">--</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input {...register('zip')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input {...register('website')} placeholder="https://" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blacklisted">Blacklisted</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <input
            {...register('tags', {
              setValueAs: (v: string | string[]) =>
                Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((t) => t.trim()).filter(Boolean) : [],
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Company' : 'Create Company'}
        </button>
      </div>
    </form>
  )
}
