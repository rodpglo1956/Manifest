'use client'

import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { completeComplianceItem } from '@/lib/compliance/actions'
import { getDOTRequiredCategories, getNonDOTRequiredCategories } from '@/lib/compliance/compliance-helpers'
import type { ComplianceItem, ComplianceItemStatus, ComplianceCategory } from '@/types/database'

interface ComplianceItemsTableProps {
  items: ComplianceItem[]
  isDotRegulated: boolean
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'waived', label: 'Waived' },
]

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getDaysRemaining(dueDate: string | null): number | null {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysRemainingDisplay(days: number | null): string {
  if (days === null) return '--'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  return `${days}d`
}

function getDaysRemainingColor(days: number | null): string {
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-600 font-medium'
  if (days <= 14) return 'text-yellow-600 font-medium'
  return 'text-gray-500'
}

type SortField = 'title' | 'category' | 'status' | 'due_date'
type SortDir = 'asc' | 'desc'

function MarkCompleteButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()
  const [showDocInput, setShowDocInput] = useState(false)
  const [docUrl, setDocUrl] = useState('')
  const [completed, setCompleted] = useState(false)

  function handleComplete() {
    startTransition(async () => {
      const urls = docUrl.trim() ? [docUrl.trim()] : undefined
      const result = await completeComplianceItem(itemId, urls)
      if (!result.error) {
        setCompleted(true)
        setShowDocInput(false)
      }
    })
  }

  if (completed) {
    return <span className="text-xs text-green-600 font-medium">Done</span>
  }

  if (showDocInput) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="url"
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          placeholder="Document URL (optional)"
          className="w-36 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-primary focus:border-primary"
        />
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowDocInput(false)}
          className="px-1 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowDocInput(true)}
      className="text-xs text-primary hover:underline"
    >
      Mark Complete
    </button>
  )
}

export function ComplianceItemsTable({ items, isDotRegulated }: ComplianceItemsTableProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Build category options based on DOT status
  const availableCategories = isDotRegulated
    ? getDOTRequiredCategories()
    : getNonDOTRequiredCategories()

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...availableCategories.map((c) => ({ value: c, label: formatCategory(c) })),
  ]

  // Filter items
  let filtered = items
  if (statusFilter !== 'all') {
    filtered = filtered.filter((item) => item.status === statusFilter)
  }
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((item) => item.category === categoryFilter)
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  }

  // Sort items
  filtered = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
      case 'category':
        cmp = a.category.localeCompare(b.category)
        break
      case 'status':
        cmp = a.status.localeCompare(b.status)
        break
      case 'due_date':
        cmp = (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
        break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field
    return (
      <th
        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
        onClick={() => toggleSort(field)}
      >
        {label}
        {isActive && (
          <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
        )}
      </th>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary flex-1 min-w-[200px]"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No compliance items found</p>
          <a
            href="/compliance/items?addItem=true"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Add a compliance item
          </a>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="title" label="Title" />
                <SortHeader field="category" label="Category" />
                <SortHeader field="status" label="Status" />
                <SortHeader field="due_date" label="Due Date" />
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const days = getDaysRemaining(item.due_date)
                const isActionable = item.status !== 'completed' && item.status !== 'waived' && item.status !== 'not_applicable'

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {formatCategory(item.category)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={item.status} variant="compliance" />
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {item.due_date
                        ? new Date(item.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '--'}
                    </td>
                    <td className={`px-3 py-3 text-sm ${getDaysRemainingColor(days)}`}>
                      {getDaysRemainingDisplay(days)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 truncate max-w-[120px]">
                      {item.assigned_to ?? '--'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {isActionable && <MarkCompleteButton itemId={item.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Showing {filtered.length} of {items.length} items
      </p>
    </div>
  )
}
