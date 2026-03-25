'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
} from 'lucide-react'
import { activitySchema, type ActivityInput } from '@/lib/crm/schemas'
import { createActivity } from '@/app/(app)/crm/actions'
import { formatActivityType } from '@/lib/crm/helpers'
import type { CrmActivity, CrmActivityType } from '@/types/database'
import type { LucideIcon } from 'lucide-react'

const ACTIVITY_ICONS: Record<CrmActivityType, LucideIcon> = {
  call: Phone,
  email: Mail,
  note: StickyNote,
  meeting: Calendar,
  rate_negotiation: DollarSign,
  load_booked: Truck,
  issue: AlertTriangle,
  follow_up: Clock,
  system: Cog,
}

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
    case 'overdue': return { color: 'bg-red-100 text-red-700', label: 'Follow-up overdue' }
    case 'today': return { color: 'bg-yellow-100 text-yellow-700', label: 'Follow-up due today' }
    case 'future': return { color: 'bg-gray-100 text-gray-600', label: 'Follow-up scheduled' }
  }
}

function formatRelativeTimestamp(dateStr: string): string {
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

interface CompanyActivityTimelineProps {
  activities: CrmActivity[]
  companyId: string
  showAddForm: boolean
}

export function CompanyActivityTimeline({ activities, companyId, showAddForm }: CompanyActivityTimelineProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Activity Timeline ({activities.length})
        </h3>
        <button
          onClick={() => {
            const url = showAddForm
              ? `/crm/companies/${companyId}?tab=activities`
              : `/crm/companies/${companyId}?tab=activities&addActivity=true`
            router.push(url)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Activity
        </button>
      </div>

      {/* Inline Activity Form */}
      {showAddForm && (
        <ActivityInlineForm
          companyId={companyId}
          onDone={() => router.push(`/crm/companies/${companyId}?tab=activities`)}
        />
      )}

      {/* Timeline */}
      {activities.length === 0 && !showAddForm ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 text-sm">
          No activities logged yet. Log your first activity to start tracking.
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, i) => {
            const Icon = ACTIVITY_ICONS[activity.activity_type] ?? Cog
            const followUpStatus = getFollowUpStatus(activity.follow_up_date, activity.completed_at)
            const badge = getFollowUpBadge(followUpStatus)

            return (
              <div key={activity.id} className="flex gap-3 relative">
                {/* Timeline line */}
                {i < activities.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200" />
                )}
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                {/* Content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          {formatActivityType(activity.activity_type)}
                        </span>
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
                      {activity.outcome && (
                        <p className="text-xs text-green-600 mt-1">Outcome: {activity.outcome}</p>
                      )}
                      {activity.follow_up_date && (
                        <p className="text-xs text-gray-500 mt-1">Follow-up: {activity.follow_up_date}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                      {formatRelativeTimestamp(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ActivityInlineForm({
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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">Log Activity</h4>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {errors.root && (
          <p className="text-xs text-red-500">{errors.root.message}</p>
        )}
        <input type="hidden" {...register('company_id')} />
        <div className="grid grid-cols-2 gap-3">
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
            rows={3}
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
