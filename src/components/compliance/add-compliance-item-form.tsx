'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createComplianceItem } from '@/lib/compliance/actions'
import { getDOTRequiredCategories, getNonDOTRequiredCategories } from '@/lib/compliance/compliance-helpers'
import type { ComplianceCategory, RecurrenceRule } from '@/types/database'

interface AddComplianceItemFormProps {
  isDotRegulated: boolean
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None (One-time)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'biennial', label: 'Biennial (2 years)' },
  { value: 'custom', label: 'Custom interval' },
]

const ALERT_PRESETS = [90, 60, 30, 14, 7, 1]

export function AddComplianceItemForm({ isDotRegulated }: AddComplianceItemFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState('')
  const [alertDays, setAlertDays] = useState<number[]>([90, 60, 30, 14, 7, 1])

  const categories = isDotRegulated
    ? getDOTRequiredCategories()
    : getNonDOTRequiredCategories()

  function toggleAlertDay(day: number) {
    setAlertDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)

    const data = {
      title: form.get('title') as string,
      category: form.get('category') as ComplianceCategory,
      description: (form.get('description') as string) || null,
      due_date: (form.get('due_date') as string) || null,
      recurrence_rule: recurrence ? (recurrence as RecurrenceRule) : null,
      recurrence_months: recurrence === 'custom'
        ? parseInt(form.get('recurrence_months') as string, 10) || null
        : null,
      alert_days_before: alertDays,
      status: 'upcoming' as const,
    }

    startTransition(async () => {
      const result = await createComplianceItem(data)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/compliance/items')
      }
    })
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Compliance Item</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
              placeholder="e.g., Annual DOT Inspection"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{formatCategory(c)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              name="due_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {recurrence === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Months</label>
              <input
                type="number"
                name="recurrence_months"
                min="1"
                max="120"
                placeholder="Number of months"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            placeholder="Optional notes about this compliance obligation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alert Days Before Due</label>
          <div className="flex flex-wrap gap-2">
            {ALERT_PRESETS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleAlertDay(day)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  alertDays.includes(day)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                }`}
              >
                {day}d
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create Item'}
          </button>
          <a
            href="/compliance/items"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
