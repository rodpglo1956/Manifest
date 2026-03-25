import { Suspense } from 'react'
import { getLanes } from '../actions'
import { LanesClient } from './lanes-client'
import type { CrmLane, CrmLaneStatus } from '@/types/database'

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    view?: string
    addLane?: string
  }>
}

export default async function LanesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const statusFilter = params.status as CrmLaneStatus | undefined
  const search = params.search || undefined
  const view = (params.view === 'table' ? 'table' : 'map') as 'map' | 'table'

  const result = await getLanes({ status: statusFilter, search })
  const lanes = (result.data ?? []) as CrmLane[]

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
        <LanesClient
          lanes={lanes}
          activeStatus={statusFilter}
          search={search}
          view={view}
          showAddForm={params.addLane === 'true'}
        />
      </Suspense>
    </div>
  )
}
