'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Plus, Search, Building2 } from 'lucide-react'
import { CompanyForm } from '@/components/crm/company-form'
import { formatCompanyType, formatCurrency } from '@/lib/crm/helpers'
import type { CrmCompany, CrmCompanyType } from '@/types/database'

const TABS: { label: string; value: CrmCompanyType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Customers', value: 'customer' },
  { label: 'Brokers', value: 'broker' },
  { label: 'Vendors', value: 'vendor' },
  { label: 'Prospects', value: 'prospect' },
]

function getRevenueBadgeColor(revenue: number): string {
  if (revenue > 100_000) return 'bg-green-100 text-green-700'
  if (revenue > 10_000) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'inactive': return 'bg-gray-100 text-gray-600'
    case 'blacklisted': return 'bg-red-100 text-red-700'
    case 'prospect': return 'bg-blue-100 text-blue-700'
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
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

interface CompaniesClientProps {
  companies: CrmCompany[]
  activeType?: CrmCompanyType
  search?: string
  showAddForm: boolean
}

export function CompaniesClient({ companies, activeType, search, showAddForm }: CompaniesClientProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSearch(value: string) {
    setSearchInput(value)
    // Debounced URL update
    const timeout = setTimeout(() => {
      const params = new URLSearchParams()
      if (activeType) params.set('type', activeType)
      if (value) params.set('search', value)
      startTransition(() => {
        router.push(`/crm/companies?${params.toString()}`)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }

  function handleTabClick(type?: CrmCompanyType) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (searchInput) params.set('search', searchInput)
    router.push(`/crm/companies?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <Link
          href={showAddForm ? '/crm/companies' : '/crm/companies?addCompany=true'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </Link>
      </div>

      {/* Add Company Form (inline, URL-driven) */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">New Company</h2>
          <CompanyForm
            onSuccess={() => router.push('/crm/companies')}
            onCancel={() => router.push('/crm/companies')}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, MC#, or DOT#..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabClick(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeType === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Companies Table */}
      {companies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No companies found. Add your first customer, broker, or vendor.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">MC/DOT</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Primary Contact</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Loads</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Load</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => router.push(`/crm/companies/${company.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{company.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {formatCompanyType(company.company_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {company.mc_number && <span>MC: {company.mc_number}</span>}
                      {company.mc_number && company.dot_number && <span className="mx-1">/</span>}
                      {company.dot_number && <span>DOT: {company.dot_number}</span>}
                      {!company.mc_number && !company.dot_number && '--'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{company.primary_contact_name || '--'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getRevenueBadgeColor(company.total_revenue)}`}>
                        {formatCurrency(company.total_revenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{company.total_loads}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRelativeDate(company.last_load_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(company.status)}`}>
                        {company.status}
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
