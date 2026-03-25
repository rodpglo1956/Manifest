'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
} from 'lucide-react'
import { getCompanies, getActivities, createActivity } from '@/app/(app)/crm/actions'
import { activitySchema, type ActivityInput } from '@/lib/crm/schemas'
import { formatCurrency, formatCompanyType } from '@/lib/crm/helpers'
import type { CrmCompany, CrmActivity } from '@/types/database'

// ============================================================
// Company type badge
// ============================================================

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-700',
    broker: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-full ${colors[type] ?? 'bg-gray-100 text-gray-700'}`}>
      {formatCompanyType(type as CrmCompany['company_type'])}
    </span>
  )
}

// ============================================================
// OO Customers page
// ============================================================

export default function OOCustomersPage() {
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedActivities, setExpandedActivities] = useState<CrmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const result = await getCompanies()
      if (result.data) {
        const filtered = (result.data as CrmCompany[]).filter(
          c => c.company_type === 'customer' || c.company_type === 'broker'
        )
        setCompanies(filtered)
      }
      setLoading(false)
    }
    load()
  }, [])

  function toggleExpand(companyId: string) {
    if (expandedId === companyId) {
      setExpandedId(null)
      setExpandedActivities([])
      return
    }
    setExpandedId(companyId)
    startTransition(async () => {
      const result = await getActivities({ companyId, limit: 5 })
      setExpandedActivities((result.data ?? []) as CrmActivity[])
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-bold text-gray-900">My Customers</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">My Customers</h1>
      <p className="text-sm text-gray-500">Your brokers and customers with contact and payment info.</p>

      {companies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500 text-sm">
          No customers or brokers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map(company => (
            <div key={company.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <button
                onClick={() => toggleExpand(company.id)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{company.name}</h3>
                        <TypeBadge type={company.company_type} />
                      </div>
                      {company.primary_contact_name && (
                        <p className="text-xs text-gray-500 mt-0.5">{company.primary_contact_name}</p>
                      )}
                    </div>
                  </div>
                  {expandedId === company.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Contact info row */}
                <div className="flex flex-wrap gap-4 mt-3 ml-12">
                  {company.primary_contact_email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="w-3 h-3" />
                      {company.primary_contact_email}
                    </div>
                  )}
                  {company.primary_contact_phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      {company.primary_contact_phone}
                    </div>
                  )}
                  {company.payment_terms && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      {company.payment_terms}
                    </div>
                  )}
                  {company.days_to_pay !== null && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {company.days_to_pay} days to pay
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded Section */}
              {expandedId === company.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {/* Recent Activities */}
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Activity</h4>
                  {isPending ? (
                    <div className="animate-pulse h-16 bg-gray-100 rounded" />
                  ) : expandedActivities.length === 0 ? (
                    <p className="text-xs text-gray-400 mb-3">No activities logged.</p>
                  ) : (
                    <div className="space-y-1.5 mb-3">
                      {expandedActivities.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs bg-white rounded px-2.5 py-1.5 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">{a.activity_type}</span>
                            <span className="text-gray-700 font-medium">{a.subject}</span>
                          </div>
                          <span className="text-gray-400">
                            {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Log Activity */}
                  <OOActivityForm companyId={company.id} onDone={() => toggleExpand(company.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Simplified OO Activity Form (call, email, note only)
// ============================================================

function OOActivityForm({
  companyId,
  onDone,
}: {
  companyId: string
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      company_id: companyId,
      activity_type: 'note',
    },
  })

  function onSubmit(data: ActivityInput) {
    startTransition(async () => {
      const result = await createActivity(data)
      if (result.error) {
        const msgs = 'form' in result.error ? result.error.form : [String(result.error)]
        setError('root', { message: msgs.join(', ') })
        return
      }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-700">Log Activity</h4>
      {errors.root && <p className="text-xs text-red-500">{errors.root.message}</p>}
      <input type="hidden" {...register('company_id')} />
      <div className="flex gap-2">
        <select
          {...register('activity_type')}
          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="note">Note</option>
        </select>
        <input
          {...register('subject')}
          placeholder="Subject"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-2 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Log'}
        </button>
      </div>
      {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
    </form>
  )
}
