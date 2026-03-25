'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { CompanyForm } from '@/components/crm/company-form'
import { ContactList } from '@/components/crm/contact-list'
import { CompanyActivityTimeline } from '@/components/crm/company-activity-timeline'
import { formatCompanyType, formatCurrency, formatRatePerMile } from '@/lib/crm/helpers'
import { isAgreementExpiring } from '@/lib/crm/helpers'
import type { CrmCompany, CrmContact, CrmRateAgreement, CrmActivity } from '@/types/database'

const TABS = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'lanes', label: 'Lanes' },
  { key: 'rates', label: 'Rate Agreements' },
  { key: 'activities', label: 'Activities' },
]

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'inactive': return 'bg-gray-100 text-gray-600'
    case 'blacklisted': return 'bg-red-100 text-red-700'
    case 'prospect': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getAgreementStatusColor(status: string, expiryDate: string | null): string {
  if (status === 'active' && expiryDate && isAgreementExpiring(expiryDate)) {
    return 'bg-yellow-100 text-yellow-700'
  }
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'expired': return 'bg-red-100 text-red-700'
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'rejected': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

interface CompanyDetailClientProps {
  company: CrmCompany & {
    contacts: CrmContact[]
    lanes: Record<string, unknown>[]
    rateAgreements: CrmRateAgreement[]
    activities: CrmActivity[]
  }
  activeTab: string
  showEdit: boolean
  showAddContact: boolean
  showAddActivity: boolean
}

export function CompanyDetailClient({
  company,
  activeTab,
  showEdit,
  showAddContact,
  showAddActivity,
}: CompanyDetailClientProps) {
  const router = useRouter()
  const baseUrl = `/crm/companies/${company.id}`

  function tabUrl(tab: string) {
    return `${baseUrl}?tab=${tab}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              {formatCompanyType(company.company_type)}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusColor(company.status)}`}>
              {company.status}
            </span>
          </div>
        </div>
        <Link
          href={showEdit ? baseUrl : `${baseUrl}?edit=true`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          {showEdit ? 'Cancel Edit' : 'Edit'}
        </Link>
      </div>

      {/* Edit Form (inline) */}
      {showEdit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Company</h2>
          <CompanyForm
            company={company}
            onSuccess={() => router.push(baseUrl)}
            onCancel={() => router.push(baseUrl)}
          />
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">MC Number</span>
            <span className="font-medium">{company.mc_number || '--'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">DOT Number</span>
            <span className="font-medium">{company.dot_number || '--'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Credit Score</span>
            <span className="font-medium">{company.credit_score ?? '--'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Days to Pay</span>
            <span className="font-medium">{company.days_to_pay ?? '--'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Payment Terms</span>
            <span className="font-medium">{company.payment_terms || '--'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Factoring Company</span>
            <span className="font-medium">{company.factoring_company || '--'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Address</span>
            <span className="font-medium">
              {company.address_line1
                ? `${company.address_line1}, ${company.city || ''} ${company.state || ''} ${company.zip || ''}`
                : '--'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Website</span>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span className="font-medium">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(company.total_revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{company.total_loads}</p>
          <p className="text-xs text-gray-500 mt-1">Total Loads</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatRatePerMile(company.avg_rate_per_mile)}</p>
          <p className="text-xs text-gray-500 mt-1">Avg Rate/Mile</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatRelativeDate(company.last_load_date)}</p>
          <p className="text-xs text-gray-500 mt-1">Last Load</p>
        </div>
      </div>

      {/* Tabbed Sections */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(tabUrl(tab.key))}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'contacts' && (
        <ContactList
          contacts={company.contacts}
          companyId={company.id}
          showAddForm={showAddContact}
        />
      )}

      {activeTab === 'lanes' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {company.lanes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No lanes associated with this company.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Origin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Destination</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Relationship</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Contracted Rate</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {company.lanes.map((lane, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{String(lane.origin_city || '')}, {String(lane.origin_state || '')}</td>
                    <td className="px-4 py-3">{String(lane.destination_city || '')}, {String(lane.destination_state || '')}</td>
                    <td className="px-4 py-3 capitalize">{String(lane.relationship || '--')}</td>
                    <td className="px-4 py-3 text-right">{lane.contracted_rate ? formatCurrency(Number(lane.contracted_rate)) : '--'}</td>
                    <td className="px-4 py-3 text-right">{lane.distance_miles ? `${lane.distance_miles} mi` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {company.rateAgreements.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No rate agreements for this company.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rate Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Effective</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Expiry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {company.rateAgreements.map((ra) => (
                  <tr key={ra.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 capitalize">{ra.rate_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(ra.rate_amount)}</td>
                    <td className="px-4 py-3">{ra.effective_date}</td>
                    <td className={`px-4 py-3 ${ra.expiry_date && isAgreementExpiring(ra.expiry_date) ? 'text-yellow-600 font-medium' : ''}`}>
                      {ra.expiry_date || '--'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getAgreementStatusColor(ra.status, ra.expiry_date)}`}>
                        {ra.status === 'active' && ra.expiry_date && isAgreementExpiring(ra.expiry_date) ? 'expiring soon' : ra.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <CompanyActivityTimeline
          activities={company.activities}
          companyId={company.id}
          showAddForm={showAddActivity}
        />
      )}
    </div>
  )
}
