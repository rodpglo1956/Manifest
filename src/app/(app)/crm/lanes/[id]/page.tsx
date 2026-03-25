import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getLaneDetail, getCompanies } from '../../actions'
import { LaneDetailClient } from './lane-detail-client'
import type { CrmLane, CrmCompany, CrmRateAgreement, CrmLaneRelationship } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LaneDetailPage({ params }: PageProps) {
  const { id } = await params

  const [laneResult, companiesResult] = await Promise.all([
    getLaneDetail(id),
    getCompanies(),
  ])

  if (laneResult.error || !laneResult.data) {
    notFound()
  }

  // getLaneDetail returns { ...lane, companies, rateAgreements } with spread from Supabase query
  // Type assertion needed because Supabase typed client loses lane fields in spread inference
  const data = laneResult.data as unknown as CrmLane & {
    companies: Array<{
      id: string
      name: string
      company_type: string
      relationship: CrmLaneRelationship | null
      contracted_rate: number | null
    }>
    rateAgreements: Array<CrmRateAgreement & { company_name: string | null }>
  }

  const lane: CrmLane = {
    id: data.id,
    org_id: data.org_id,
    origin_city: data.origin_city,
    origin_state: data.origin_state,
    origin_zip: data.origin_zip,
    destination_city: data.destination_city,
    destination_state: data.destination_state,
    destination_zip: data.destination_zip,
    distance_miles: data.distance_miles,
    avg_rate_per_mile: data.avg_rate_per_mile,
    last_rate: data.last_rate,
    last_run_date: data.last_run_date,
    total_runs: data.total_runs,
    preferred_equipment: data.preferred_equipment,
    notes: data.notes,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }

  const companies = data.companies ?? []
  const rateAgreements = data.rateAgreements ?? []

  const allCompanies = ((companiesResult.data ?? []) as CrmCompany[]).map(c => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
        <LaneDetailClient
          lane={lane}
          companies={companies}
          rateAgreements={rateAgreements}
          allCompanies={allCompanies}
        />
      </Suspense>
    </div>
  )
}
