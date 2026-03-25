// Marie context builder - fetches org data for system prompt
// All queries go through user's supabase client (RLS enforced)

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type OrgContext = {
  loads: unknown[]
  drivers: unknown[]
  invoices: unknown[]
  dispatches: unknown[]
  summary: {
    activeLoads: number
    activeDrivers: number
    pendingInvoices: number
    activeDispatches: number
  }
}

export async function buildOrgContext(
  supabase: SupabaseClient<Database>
): Promise<OrgContext> {
  const [loadsResult, driversResult, invoicesResult, dispatchesResult] =
    await Promise.all([
      supabase
        .from('loads')
        .select(
          'id, load_number, status, pickup_city, pickup_state, delivery_city, delivery_state, rate_amount, total_charges, driver_id'
        )
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('drivers')
        .select('id, first_name, last_name, status, current_vehicle_id'),
      supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, total, due_date, bill_to_company'
        )
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('dispatches')
        .select('id, load_id, driver_id, status')
        .not('status', 'in', '("completed","rejected")'),
    ])

  const loads = loadsResult.data ?? []
  const drivers = driversResult.data ?? []
  const invoices = invoicesResult.data ?? []
  const dispatches = dispatchesResult.data ?? []

  const terminalStatuses = ['canceled', 'paid']
  const activeLoads = loads.filter(
    (l) => !terminalStatuses.includes(l.status)
  ).length
  const activeDrivers = drivers.filter((d) => d.status === 'active').length
  const pendingInvoices = invoices.filter((i) =>
    ['draft', 'sent'].includes(i.status)
  ).length

  return {
    loads,
    drivers,
    invoices,
    dispatches,
    summary: {
      activeLoads,
      activeDrivers,
      pendingInvoices,
      activeDispatches: dispatches.length,
    },
  }
}
