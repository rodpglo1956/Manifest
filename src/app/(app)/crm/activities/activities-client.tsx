'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import {
  Plus,
  Phone,
  Mail,
  StickyNote,
  Calendar,
  DollarSign,
  Truck,
  AlertTriangle,
  Clock,
  Cog,
  Check,
  Package,
} from 'lucide-react'
import { activitySchema, type ActivityInput } from '@/lib/crm/schemas'
import { createActivity, updateActivity } from '@/app/(app)/crm/actions'
import { formatActivityType } from '@/lib/crm/helpers'
import type { CrmActivity, CrmActivityType, CrmCompany } from '@/types/database'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// Activity type icons
// ============================================================

const ACTIVITY_ICONS: Record<CrmActivityType, LucideIcon> = {
  call: Phone,
  email: Mail,
  note: StickyNote,
  meeting: Calendar,
  rate_negotiation: DollarSign,
  load_booked: Package,
  issue: AlertTriangle,
  follow_up: Clock,
  system: Cog,
}

const ACTIVITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'note', label: 'Note' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'rate_negotiation', label: 'Rate Negotiation' },
  { value: 'load_booked', label: 'Load Booked' },
  { value: 'issue', label: 'Issue' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'system', label: 'System' },
]

// ============================================================
// Helper functions
// ============================================================

function getFollowUpStatus(followUpDate: string | null, completedAt: string | null): 'overdue' | 'today' | 'future' | null {
  if (!followUpDate || completedAt) return null
  const now = new Date()
  const due = new Date(followUpDate)
  now.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  if (due < now) return 'overdue'
  if (due.getTime() === now.getTime()) return 'today'
  return 'future'
}

function getFollowUpBadge(status: 'overdue' | 'today' | 'future' | null): { color: string; label: string } | null {
  if (!status) return null
  switch (status) {
    case 'overdue': return { color: 'bg-red-100 text-red-700', label: 'Overdue' }
    case 'today': return { color: 'bg-yellow-100 text-yellow-700', label: 'Due today' }
    case 'future': return { color: 'bg-gray-100 text-gray-600', label: 'Scheduled' }
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ============================================================
// Props
// ============================================================

interface ActivitiesClientProps {
  activities: CrmActivity[]
  companies: CrmCompany[]
  activeType?: CrmActivityType
  activeCompany?: string
  showAddForm: boolean
  hasMore: boolean
  currentOffset: number
}

// ============================================================
// Main component
// ============================================================

export function ActivitiesClient({
  activities,
  companies,
  activeType,
  activeCompany,
  showAddForm,
  hasMore,
  currentOffset,
}: ActivitiesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Build company lookup
  const companyMap = new Map(companies.map(c => [c.id, c.name]))

  function buildUrl(params: Record<string, string | undefined>) {
    const url = new URLSearchParams()
    const vals = { type: activeType, company: activeCompany, ...params }
    Object.entries(vals).forEach(([k, v]) => { if (v) url.set(k, v) })
    return `/crm/activities${url.toString() ? '?' + url.toString() : ''}`
  }

  function handleComplete(activityId: string) {
    startTransition(async () => {
      await updateActivity(activityId, { completed_at: new Date().toISOString() })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Activities</h1>
        <button
          onClick={() => router.push(buildUrl({ addActivity: showAddForm ? undefined : 'true' }))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Activity
        </button>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <ActivityGlobalForm
          companies={companies}
          onDone={() => router.push(buildUrl({ addActivity: undefined }))}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Activity Type</label>
          <select
            value={activeType ?? ''}
            onChange={e => router.push(buildUrl({ type: e.target.value || undefined }))}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {ACTIVITY_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
          <select
            value={activeCompany ?? ''}
            onChange={e => router.push(buildUrl({ company: e.target.value || undefined }))}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      {activities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500 text-sm">
          No activities found. Log your first activity to get started.
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, i) => {
            const Icon = ACTIVITY_ICONS[activity.activity_type] ?? Cog
            const followUpStatus = getFollowUpStatus(activity.follow_up_date, activity.completed_at)
            const badge = getFollowUpBadge(followUpStatus)
            const companyName = activity.company_id ? companyMap.get(activity.company_id) : null

            return (
              <div key={activity.id} className="flex gap-3 relative">
                {/* Timeline line */}
                {i < activities.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200" />
                )}
                {/* Icon */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activity.completed_at ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {activity.completed_at ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Icon className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">
                          {formatActivityType(activity.activity_type)}
                        </span>
                        {companyName && (
                          <Link
                            href={`/crm/companies/${activity.company_id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {companyName}
                          </Link>
                        )}
                        {badge && (
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{activity.subject}</p>
                      {activity.body && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.body}</p>
                      )}
                      {activity.completed_at && activity.outcome && (
                        <p className="text-xs text-green-600 mt-1">Outcome: {activity.outcome}</p>
                      )}
                      {activity.follow_up_date && !activity.completed_at && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600">Follow-up: {activity.follow_up_date}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {!activity.completed_at && activity.follow_up_date && (
                        <button
                          onClick={() => handleComplete(activity.id)}
                          disabled={isPending}
                          className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatRelativeDate(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => router.push(buildUrl({ offset: String(currentOffset + 50) }))}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Global Activity Form (with company selector)
// ============================================================

function ActivityGlobalForm({
  companies,
  onDone,
}: {
  companies: CrmCompany[]
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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">Log Activity</h4>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {errors.root && (
          <p className="text-xs text-red-500">{errors.root.message}</p>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
            <select
              {...register('company_id')}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">-- None --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              {...register('activity_type')}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="call">Phone Call</option>
              <option value="email">Email</option>
              <option value="note">Note</option>
              <option value="meeting">Meeting</option>
              <option value="rate_negotiation">Rate Negotiation</option>
              <option value="issue">Issue</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
            <input
              {...register('subject')}
              placeholder="Brief description"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.subject && <p className="text-xs text-red-500 mt-0.5">{errors.subject.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Details</label>
          <textarea
            {...register('body')}
            rows={2}
            placeholder="Add details..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
            <input
              type="date"
              {...register('follow_up_date')}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Outcome</label>
            <input
              {...register('outcome')}
              placeholder="Result or outcome"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDone}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Log Activity'}
          </button>
        </div>
      </form>
    </div>
  )
}
