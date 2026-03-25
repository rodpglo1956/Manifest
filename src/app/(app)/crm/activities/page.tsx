import { Suspense } from 'react'
import { getActivities, getCompanies } from '../actions'
import { ActivitiesClient } from './activities-client'
import type { CrmActivity, CrmActivityType, CrmCompany } from '@/types/database'

interface PageProps {
  searchParams: Promise<{
    type?: string
    company?: string
    addActivity?: string
    offset?: string
  }>
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const typeFilter = params.type as CrmActivityType | undefined
  const companyFilter = params.company || undefined
  const offset = parseInt(params.offset || '0', 10)
  const limit = 50

  const [activitiesResult, companiesResult] = await Promise.all([
    getActivities({
      type: typeFilter,
      companyId: companyFilter,
      limit: limit + offset,
    }),
    getCompanies(),
  ])

  const activities = (activitiesResult.data ?? []) as CrmActivity[]
  const companies = (companiesResult.data ?? []) as CrmCompany[]

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
        <ActivitiesClient
          activities={activities}
          companies={companies}
          activeType={typeFilter}
          activeCompany={companyFilter}
          showAddForm={params.addActivity === 'true'}
          hasMore={activities.length >= limit + offset}
          currentOffset={offset}
        />
      </Suspense>
    </div>
  )
}
