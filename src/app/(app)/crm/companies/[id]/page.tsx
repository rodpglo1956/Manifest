import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCompanyDetail } from '../../actions'
import { CompanyDetailClient } from './company-detail-client'
import type { CrmCompany, CrmContact, CrmLane, CrmRateAgreement, CrmActivity } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    tab?: string
    edit?: string
    addContact?: string
    addActivity?: string
  }>
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams

  const result = await getCompanyDetail(id)
  if (result.error || !result.data) {
    return (
      <div className="space-y-4">
        <Link href="/crm/companies" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Company not found.</p>
        </div>
      </div>
    )
  }

  const company = result.data as CrmCompany & {
    contacts: CrmContact[]
    lanes: Record<string, unknown>[]
    rateAgreements: CrmRateAgreement[]
    activities: CrmActivity[]
  }

  return (
    <div className="space-y-4">
      <Link href="/crm/companies" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </Link>
      <CompanyDetailClient
        company={company}
        activeTab={sp.tab ?? 'contacts'}
        showEdit={sp.edit === 'true'}
        showAddContact={sp.addContact === 'true'}
        showAddActivity={sp.addActivity === 'true'}
      />
    </div>
  )
}
