'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Plus, Building2, FileText, TrendingUp, Edit2 } from 'lucide-react'
import { RateAgreementForm } from '@/components/crm/rate-agreement-form'
import { LaneForm } from '@/components/crm/lane-form'
import { formatCurrency, formatRatePerMile, isAgreementExpiring } from '@/lib/crm/helpers'
import { linkLaneCompany } from '@/app/(app)/crm/actions'
import type { CrmLane, CrmRateAgreement, CrmCompany, CrmLaneRelationship } from '@/types/database'

const LaneMap = dynamic(() => import('@/components/crm/lane-map'), { ssr: false })

type EnrichedCompany = {
  id: string
  name: string
  company_type: string
  relationship: CrmLaneRelationship | null
  contracted_rate: number | null
}

type EnrichedRateAgreement = CrmRateAgreement & {
  company_name: string | null
}

interface LaneDetailClientProps {
  lane: CrmLane
  companies: EnrichedCompany[]
  rateAgreements: EnrichedRateAgreement[]
  allCompanies: Pick<CrmCompany, 'id' | 'name'>[]
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'inactive': return 'bg-gray-100 text-gray-600'
    case 'seasonal': return 'bg-orange-100 text-orange-700'
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'expired': return 'bg-red-100 text-red-700'
    case 'rejected': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getRelationshipBadgeColor(rel: string): string {
  switch (rel) {
    case 'shipper': return 'bg-blue-100 text-blue-700'
    case 'broker': return 'bg-purple-100 text-purple-700'
    case 'receiver': return 'bg-teal-100 text-teal-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRateType(type: string): string {
  switch (type) {
    case 'per_mile': return 'Per Mile'
    case 'flat_rate': return 'Flat Rate'
    case 'percentage': return 'Percentage'
    case 'hourly': return 'Hourly'
    default: return type
  }
}

export function LaneDetailClient({ lane, companies, rateAgreements, allCompanies }: LaneDetailClientProps) {
  const router = useRouter()
  const [showAddAgreement, setShowAddAgreement] = useState(false)
  const [showLinkCompany, setShowLinkCompany] = useState(false)
  const [showEditLane, setShowEditLane] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Link company form state
  const [linkCompanyId, setLinkCompanyId] = useState('')
  const [linkRelationship, setLinkRelationship] = useState<CrmLaneRelationship>('shipper')
  const [linkRate, setLinkRate] = useState('')

  function handleLinkCompany() {
    if (!linkCompanyId) return
    startTransition(async () => {
      const result = await linkLaneCompany({
        lane_id: lane.id,
        company_id: linkCompanyId,
        relationship: linkRelationship,
        contracted_rate: linkRate ? parseFloat(linkRate) : null,
      })
      if (!result.error) {
        setShowLinkCompany(false)
        setLinkCompanyId('')
        setLinkRate('')
        router.refresh()
      }
    })
  }

  // Build rate history text
  const rateHistory = rateAgreements
    .filter(ra => ra.status === 'active' || ra.status === 'expired')
    .sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime())
    .map(ra => {
      const month = new Date(ra.effective_date).toLocaleDateString('en-US', { month: 'short' })
      return `$${ra.rate_amount.toFixed(2)} (${month})`
    })

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/crm/lanes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Lanes
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {lane.origin_city}, {lane.origin_state} &rarr; {lane.destination_city}, {lane.destination_state}
          </h1>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(lane.status)}`}>
            {lane.status}
          </span>
        </div>
        <button
          onClick={() => setShowEditLane(!showEditLane)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Edit Form */}
      {showEditLane && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Lane</h2>
          <LaneForm
            lane={lane}
            onSuccess={() => { setShowEditLane(false); router.refresh() }}
            onCancel={() => setShowEditLane(false)}
          />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Total Runs</p>
          <p className="text-2xl font-bold text-gray-900">{lane.total_runs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Avg Rate/Mile</p>
          <p className="text-2xl font-bold text-gray-900">{formatRatePerMile(lane.avg_rate_per_mile)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Last Rate</p>
          <p className="text-2xl font-bold text-gray-900">{lane.last_rate ? formatCurrency(lane.last_rate) : '--'}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Last Run</p>
          <p className="text-2xl font-bold text-gray-900">{formatDate(lane.last_run_date)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Distance</p>
          <p className="text-2xl font-bold text-gray-900">{lane.distance_miles ? `${lane.distance_miles} mi` : '--'}</p>
        </div>
      </div>

      {/* Mini Map */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <LaneMap lanes={[lane]} singleLane />
      </div>

      {/* Companies Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            Companies
          </h2>
          <button
            onClick={() => setShowLinkCompany(!showLinkCompany)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Link Company
          </button>
        </div>

        {/* Link Company Form */}
        {showLinkCompany && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={linkCompanyId}
                onChange={(e) => setLinkCompanyId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select company...</option>
                {allCompanies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={linkRelationship}
                onChange={(e) => setLinkRelationship(e.target.value as CrmLaneRelationship)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="shipper">Shipper</option>
                <option value="broker">Broker</option>
                <option value="receiver">Receiver</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Contracted rate"
                value={linkRate}
                onChange={(e) => setLinkRate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleLinkCompany}
                  disabled={!linkCompanyId || isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Linking...' : 'Link'}
                </button>
                <button
                  onClick={() => setShowLinkCompany(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {companies.length === 0 ? (
          <p className="text-sm text-gray-500">No companies linked to this lane yet.</p>
        ) : (
          <div className="space-y-2">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Link href={`/crm/companies/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-primary">
                    {c.name}
                  </Link>
                  {c.relationship && (
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getRelationshipBadgeColor(c.relationship)}`}>
                      {c.relationship}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {c.contracted_rate ? formatCurrency(c.contracted_rate) : '--'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate Agreements Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Rate Agreements
          </h2>
          <button
            onClick={() => setShowAddAgreement(!showAddAgreement)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Agreement
          </button>
        </div>

        {/* Add Agreement Form */}
        {showAddAgreement && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <RateAgreementForm
              companies={allCompanies}
              laneId={lane.id}
              onSuccess={() => { setShowAddAgreement(false); router.refresh() }}
              onCancel={() => setShowAddAgreement(false)}
            />
          </div>
        )}

        {rateAgreements.length === 0 ? (
          <p className="text-sm text-gray-500">No rate agreements for this lane.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Effective</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Expiry</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rateAgreements.map((ra) => {
                  const expiring = isAgreementExpiring(ra.expiry_date)
                  return (
                    <tr
                      key={ra.id}
                      className={expiring ? 'bg-yellow-50' : ''}
                    >
                      <td className="px-4 py-2 text-gray-900">{ra.company_name ?? '--'}</td>
                      <td className="px-4 py-2 text-gray-600">{formatRateType(ra.rate_type)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(ra.rate_amount)}</td>
                      <td className="px-4 py-2 text-gray-600">{formatDate(ra.effective_date)}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {ra.expiry_date ? (
                          <span className={expiring ? 'text-yellow-700 font-medium' : ''}>
                            {formatDate(ra.expiry_date)}
                            {expiring && ' (expiring)'}
                          </span>
                        ) : '--'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(ra.status)}`}>
                          {ra.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rate History */}
      {rateHistory.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Rate History
          </h2>
          <p className="text-sm text-gray-700">
            Rates: {rateHistory.join(' -> ')}
          </p>
        </div>
      )}
    </div>
  )
}
