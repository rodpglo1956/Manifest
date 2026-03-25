import { Suspense } from 'react'
import { getCompanies } from '../actions'
import { CompaniesClient } from './companies-client'
import type { CrmCompany, CrmCompanyType } from '@/types/database'

interface PageProps {
  searchParams: Promise<{
    type?: string
    search?: string
    addCompany?: string
  }>
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const typeFilter = params.type as CrmCompanyType | undefined
  const search = params.search || undefined

  const result = await getCompanies({ type: typeFilter, search })
  const companies = (result.data ?? []) as CrmCompany[]

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
        <CompaniesClient
          companies={companies}
          activeType={typeFilter}
          search={search}
          showAddForm={params.addCompany === 'true'}
        />
      </Suspense>
    </div>
  )
}
