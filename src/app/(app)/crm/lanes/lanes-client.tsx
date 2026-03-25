'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Plus, Search, Map, Table2, Route } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { LaneForm } from '@/components/crm/lane-form'
import { formatRatePerMile } from '@/lib/crm/helpers'
import type { CrmLane, CrmLaneStatus } from '@/types/database'

const LaneMap = dynamic(() => import('@/components/crm/lane-map'), { ssr: false })

const STATUS_TABS: { label: string; value: CrmLaneStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Seasonal', value: 'seasonal' },
]

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'inactive': return 'bg-gray-100 text-gray-600'
    case 'seasonal': return 'bg-orange-100 text-orange-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface LanesClientProps {
  lanes: CrmLane[]
  activeStatus?: CrmLaneStatus
  search?: string
  view: 'map' | 'table'
  showAddForm: boolean
}

export function LanesClient({ lanes, activeStatus, search, view, showAddForm }: LanesClientProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [isPending, startTransition] = useTransition()

  function buildUrl(overrides: { status?: CrmLaneStatus | undefined; search?: string; view?: string; addLane?: boolean }) {
    const params = new URLSearchParams()
    const s = overrides.status !== undefined ? overrides.status : activeStatus
    if (s) params.set('status', s)
    const q = overrides.search !== undefined ? overrides.search : searchInput
    if (q) params.set('search', q)
    const v = overrides.view ?? view
    if (v) params.set('view', v)
    if (overrides.addLane) params.set('addLane', 'true')
    return `/crm/lanes?${params.toString()}`
  }

  function handleSearch(value: string) {
    setSearchInput(value)
    setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl({ search: value }))
      })
    }, 300)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lanes</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <Link
              href={buildUrl({ view: 'map' })}
              className={`px-3 py-1.5 text-sm ${view === 'map' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Map className="w-4 h-4" />
            </Link>
            <Link
              href={buildUrl({ view: 'table' })}
              className={`px-3 py-1.5 text-sm ${view === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Table2 className="w-4 h-4" />
            </Link>
          </div>
          <Link
            href={showAddForm ? '/crm/lanes' : buildUrl({ addLane: true })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lane
          </Link>
        </div>
      </div>

      {/* Add Lane Form (inline, URL-driven) */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">New Lane</h2>
          <LaneForm
            onSuccess={() => router.push('/crm/lanes')}
            onCancel={() => router.push('/crm/lanes')}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by origin or destination city..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              startTransition(() => {
                router.push(buildUrl({ status: tab.value }))
              })
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeStatus === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {lanes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No lanes found. Add your first lane to start tracking routes.</p>
        </div>
      ) : view === 'map' ? (
        <LaneMap lanes={lanes} onSelectLane={(id) => router.push(`/crm/lanes/${id}`)} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Origin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Destination</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Distance</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Avg Rate/Mile</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Runs</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Run</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lanes.map((lane) => (
                  <tr
                    key={lane.id}
                    onClick={() => router.push(`/crm/lanes/${lane.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lane.origin_city}, {lane.origin_state}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lane.destination_city}, {lane.destination_state}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {lane.distance_miles ? `${lane.distance_miles} mi` : '--'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatRatePerMile(lane.avg_rate_per_mile)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{lane.total_runs}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(lane.last_run_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(lane.status)}`}>
                        {lane.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPending && (
        <div className="fixed top-16 right-4 bg-white shadow-lg rounded-lg px-3 py-2 text-xs text-gray-500">
          Loading...
        </div>
      )}
    </div>
  )
}
