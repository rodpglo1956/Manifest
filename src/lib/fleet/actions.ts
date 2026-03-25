'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  maintenanceRecordSchema,
  maintenanceScheduleSchema,
  fuelTransactionSchema,
} from '@/schemas/fleet'
import { calculateCostPerMile, calculateFleetCostPerMile } from '@/lib/fleet/fleet-helpers'
import type { MaintenanceType, FuelSource, VehicleClass, MaintenancePriority } from '@/types/database'

// ============================================================
// Auth + Org helper
// ============================================================

async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' as const, supabase, user: null, orgId: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return { error: 'No organization found' as const, supabase, user, orgId: null }
  }

  return { error: null, supabase, user, orgId: profile.org_id }
}

// ============================================================
// Maintenance Record actions
// ============================================================

export async function getMaintenanceRecords(vehicleId?: string) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('maintenance_records')
    .select('*')
    .eq('org_id', orgId)
    .order('date_in', { ascending: false })

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }

  const { data, error: dbError } = await query

  if (dbError) return { error: { form: [dbError.message] }, data: null }
  return { error: null, data }
}

export async function createMaintenanceRecord(formData: FormData) {
  const raw = {
    vehicle_id: formData.get('vehicle_id') as string,
    maintenance_type: formData.get('maintenance_type') as string,
    description: formData.get('description') as string,
    vendor_name: formData.get('vendor_name') as string || undefined,
    vendor_location: formData.get('vendor_location') as string || undefined,
    odometer_at_service: formData.get('odometer_at_service') as string || undefined,
    cost_parts: formData.get('cost_parts') as string || '0',
    cost_labor: formData.get('cost_labor') as string || '0',
    cost_total: formData.get('cost_total') as string || '0',
    warranty_covered: formData.get('warranty_covered') === 'true',
    date_in: formData.get('date_in') as string,
    date_out: formData.get('date_out') as string || undefined,
    next_service_odometer: formData.get('next_service_odometer') as string || undefined,
    next_service_date: formData.get('next_service_date') as string || undefined,
  }

  const parsed = maintenanceRecordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map((i) => i.message) } }
  }

  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  // Auto-calculate cost_total from parts + labor
  const costTotal =
    parsed.data.cost_parts + parsed.data.cost_labor > 0
      ? parsed.data.cost_parts + parsed.data.cost_labor
      : parsed.data.cost_total

  const { error: dbError } = await supabase.from('maintenance_records').insert({
    org_id: orgId,
    vehicle_id: parsed.data.vehicle_id,
    maintenance_type: parsed.data.maintenance_type as MaintenanceType,
    description: parsed.data.description,
    vendor_name: parsed.data.vendor_name || null,
    vendor_location: parsed.data.vendor_location || null,
    odometer_at_service: parsed.data.odometer_at_service ?? null,
    cost_parts: parsed.data.cost_parts,
    cost_labor: parsed.data.cost_labor,
    cost_total: costTotal,
    warranty_covered: parsed.data.warranty_covered,
    date_in: parsed.data.date_in,
    date_out: parsed.data.date_out || null,
    document_urls: parsed.data.document_urls || null,
    next_service_odometer: parsed.data.next_service_odometer ?? null,
    next_service_date: parsed.data.next_service_date || null,
  })

  if (dbError) return { error: { form: [dbError.message] } }

  // Update vehicle odometer if odometer_at_service provided
  if (parsed.data.odometer_at_service) {
    await supabase
      .from('vehicles')
      .update({
        current_odometer: parsed.data.odometer_at_service,
        odometer_updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.vehicle_id)
  }

  revalidatePath('/fleet')
  return { error: null }
}

export async function updateMaintenanceRecord(id: string, formData: FormData) {
  const raw = {
    vehicle_id: formData.get('vehicle_id') as string,
    maintenance_type: formData.get('maintenance_type') as string,
    description: formData.get('description') as string,
    vendor_name: formData.get('vendor_name') as string || undefined,
    vendor_location: formData.get('vendor_location') as string || undefined,
    odometer_at_service: formData.get('odometer_at_service') as string || undefined,
    cost_parts: formData.get('cost_parts') as string || '0',
    cost_labor: formData.get('cost_labor') as string || '0',
    cost_total: formData.get('cost_total') as string || '0',
    warranty_covered: formData.get('warranty_covered') === 'true',
    date_in: formData.get('date_in') as string,
    date_out: formData.get('date_out') as string || undefined,
    next_service_odometer: formData.get('next_service_odometer') as string || undefined,
    next_service_date: formData.get('next_service_date') as string || undefined,
  }

  const parsed = maintenanceRecordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map((i) => i.message) } }
  }

  const { error, supabase } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  const costTotal =
    parsed.data.cost_parts + parsed.data.cost_labor > 0
      ? parsed.data.cost_parts + parsed.data.cost_labor
      : parsed.data.cost_total

  const { error: dbError } = await supabase
    .from('maintenance_records')
    .update({
      maintenance_type: parsed.data.maintenance_type as MaintenanceType,
      description: parsed.data.description,
      vendor_name: parsed.data.vendor_name || null,
      vendor_location: parsed.data.vendor_location || null,
      odometer_at_service: parsed.data.odometer_at_service ?? null,
      cost_parts: parsed.data.cost_parts,
      cost_labor: parsed.data.cost_labor,
      cost_total: costTotal,
      warranty_covered: parsed.data.warranty_covered,
      date_in: parsed.data.date_in,
      date_out: parsed.data.date_out || null,
      next_service_odometer: parsed.data.next_service_odometer ?? null,
      next_service_date: parsed.data.next_service_date || null,
    })
    .eq('id', id)

  if (dbError) return { error: { form: [dbError.message] } }

  revalidatePath('/fleet')
  return { error: null }
}

export async function getUpcomingMaintenance() {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const { data, error: dbError } = await supabase
    .from('compliance_items')
    .select('*, vehicles(unit_number)')
    .eq('org_id', orgId)
    .eq('category', 'scheduled_service')
    .in('status', ['upcoming', 'due_soon', 'overdue'])
    .order('due_date', { ascending: true })

  if (dbError) return { error: { form: [dbError.message] }, data: null }
  return { error: null, data }
}

// ============================================================
// Maintenance Schedule actions
// ============================================================

export async function getMaintenanceSchedules(vehicleId?: string) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('org_id', orgId)
    .order('maintenance_type', { ascending: true })

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }

  const { data, error: dbError } = await query

  if (dbError) return { error: { form: [dbError.message] }, data: null }
  return { error: null, data }
}

export async function createMaintenanceSchedule(formData: FormData) {
  const raw = {
    vehicle_id: formData.get('vehicle_id') as string || undefined,
    vehicle_class: formData.get('vehicle_class') as string || undefined,
    maintenance_type: formData.get('maintenance_type') as string,
    interval_miles: formData.get('interval_miles') as string || undefined,
    interval_days: formData.get('interval_days') as string || undefined,
    description: formData.get('description') as string || undefined,
    estimated_cost: formData.get('estimated_cost') as string || undefined,
    priority: formData.get('priority') as string || 'normal',
    active: formData.get('active') !== 'false',
  }

  const parsed = maintenanceScheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map((i) => i.message) } }
  }

  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  const { error: dbError } = await supabase.from('maintenance_schedules').insert({
    org_id: orgId,
    vehicle_id: parsed.data.vehicle_id || null,
    vehicle_class: (parsed.data.vehicle_class as VehicleClass) || null,
    maintenance_type: parsed.data.maintenance_type as MaintenanceType,
    interval_miles: parsed.data.interval_miles ?? null,
    interval_days: parsed.data.interval_days ?? null,
    description: parsed.data.description || null,
    estimated_cost: parsed.data.estimated_cost ?? null,
    priority: parsed.data.priority as MaintenancePriority,
    active: parsed.data.active,
  })

  if (dbError) return { error: { form: [dbError.message] } }

  revalidatePath('/fleet')
  return { error: null }
}

export async function updateMaintenanceSchedule(id: string, formData: FormData) {
  const raw = {
    vehicle_id: formData.get('vehicle_id') as string || undefined,
    vehicle_class: formData.get('vehicle_class') as string || undefined,
    maintenance_type: formData.get('maintenance_type') as string,
    interval_miles: formData.get('interval_miles') as string || undefined,
    interval_days: formData.get('interval_days') as string || undefined,
    description: formData.get('description') as string || undefined,
    estimated_cost: formData.get('estimated_cost') as string || undefined,
    priority: formData.get('priority') as string || 'normal',
    active: formData.get('active') !== 'false',
  }

  const parsed = maintenanceScheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map((i) => i.message) } }
  }

  const { error, supabase } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  const { error: dbError } = await supabase
    .from('maintenance_schedules')
    .update({
      vehicle_id: parsed.data.vehicle_id || null,
      vehicle_class: (parsed.data.vehicle_class as VehicleClass) || null,
      maintenance_type: parsed.data.maintenance_type as MaintenanceType,
      interval_miles: parsed.data.interval_miles ?? null,
      interval_days: parsed.data.interval_days ?? null,
      description: parsed.data.description || null,
      estimated_cost: parsed.data.estimated_cost ?? null,
      priority: parsed.data.priority as MaintenancePriority,
      active: parsed.data.active,
    })
    .eq('id', id)

  if (dbError) return { error: { form: [dbError.message] } }

  revalidatePath('/fleet')
  return { error: null }
}

export async function deleteMaintenanceSchedule(id: string) {
  const { error, supabase } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  const { error: dbError } = await supabase
    .from('maintenance_schedules')
    .delete()
    .eq('id', id)

  if (dbError) return { error: { form: [dbError.message] } }

  revalidatePath('/fleet')
  return { error: null }
}

// ============================================================
// Fuel Transaction actions
// ============================================================

export async function getFuelTransactions(vehicleId?: string, limit?: number) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  let query = supabase
    .from('fuel_transactions')
    .select('*')
    .eq('org_id', orgId)
    .order('transaction_date', { ascending: false })

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error: dbError } = await query

  if (dbError) return { error: { form: [dbError.message] }, data: null }
  return { error: null, data }
}

export async function createFuelTransaction(formData: FormData) {
  const raw = {
    vehicle_id: formData.get('vehicle_id') as string,
    driver_id: formData.get('driver_id') as string || undefined,
    transaction_date: formData.get('transaction_date') as string,
    location: formData.get('location') as string || undefined,
    city: formData.get('city') as string || undefined,
    state: formData.get('state') as string || undefined,
    gallons: formData.get('gallons') as string,
    price_per_gallon: formData.get('price_per_gallon') as string || undefined,
    total_cost: formData.get('total_cost') as string,
    odometer_reading: formData.get('odometer_reading') as string || undefined,
    source: formData.get('source') as string || 'manual',
  }

  const parsed = fuelTransactionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map((i) => i.message) } }
  }

  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  const { error: dbError } = await supabase.from('fuel_transactions').insert({
    org_id: orgId,
    vehicle_id: parsed.data.vehicle_id,
    driver_id: parsed.data.driver_id || null,
    transaction_date: parsed.data.transaction_date,
    location: parsed.data.location || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    gallons: parsed.data.gallons,
    price_per_gallon: parsed.data.price_per_gallon ?? null,
    total_cost: parsed.data.total_cost,
    odometer_reading: parsed.data.odometer_reading ?? null,
    source: parsed.data.source as FuelSource,
  })

  if (dbError) return { error: { form: [dbError.message] } }

  // Update vehicle odometer if odometer_reading provided
  if (parsed.data.odometer_reading) {
    await supabase
      .from('vehicles')
      .update({
        current_odometer: parsed.data.odometer_reading,
        odometer_updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.vehicle_id)
  }

  // Recalculate avg_mpg from last 10 fuel transactions with odometer readings
  const { data: recentFuel } = await supabase
    .from('fuel_transactions')
    .select('odometer_reading, gallons')
    .eq('vehicle_id', parsed.data.vehicle_id)
    .not('odometer_reading', 'is', null)
    .order('odometer_reading', { ascending: true })
    .limit(10)

  if (recentFuel && recentFuel.length >= 2) {
    let totalMiles = 0
    let totalGallons = 0
    for (let i = 1; i < recentFuel.length; i++) {
      const miles = (recentFuel[i].odometer_reading ?? 0) - (recentFuel[i - 1].odometer_reading ?? 0)
      if (miles > 0) {
        totalMiles += miles
        totalGallons += recentFuel[i].gallons
      }
    }
    if (totalGallons > 0) {
      const avgMpg = Math.round((totalMiles / totalGallons) * 100) / 100
      await supabase
        .from('vehicles')
        .update({ avg_mpg: avgMpg })
        .eq('id', parsed.data.vehicle_id)
    }
  }

  revalidatePath('/fleet')
  return { error: null }
}

// ============================================================
// Vehicle Assignment actions
// ============================================================

export async function assignVehicle(vehicleId: string, driverId: string, reason?: string) {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  // Close any existing open assignment for this vehicle
  await supabase
    .from('vehicle_assignments')
    .update({ unassigned_at: new Date().toISOString() })
    .eq('vehicle_id', vehicleId)
    .is('unassigned_at', null)

  // Create new assignment record
  const { error: insertError } = await supabase.from('vehicle_assignments').insert({
    org_id: orgId,
    vehicle_id: vehicleId,
    driver_id: driverId,
    reason: reason || null,
  })

  if (insertError) return { error: { form: [insertError.message] } }

  // Update vehicle.current_driver_id
  await supabase
    .from('vehicles')
    .update({ current_driver_id: driverId })
    .eq('id', vehicleId)

  // Update driver.current_vehicle_id
  await supabase
    .from('drivers')
    .update({ current_vehicle_id: vehicleId })
    .eq('id', driverId)

  revalidatePath('/fleet')
  return { error: null }
}

export async function unassignVehicle(vehicleId: string, reason?: string) {
  const { error, supabase } = await getAuthContext()
  if (error) return { error: { form: [error] } }

  // Get current driver before unassigning
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('current_driver_id')
    .eq('id', vehicleId)
    .single()

  // Close current assignment
  await supabase
    .from('vehicle_assignments')
    .update({
      unassigned_at: new Date().toISOString(),
      reason: reason || null,
    })
    .eq('vehicle_id', vehicleId)
    .is('unassigned_at', null)

  // Clear vehicle.current_driver_id
  await supabase
    .from('vehicles')
    .update({ current_driver_id: null })
    .eq('id', vehicleId)

  // Clear driver.current_vehicle_id
  if (vehicle?.current_driver_id) {
    await supabase
      .from('drivers')
      .update({ current_vehicle_id: null })
      .eq('id', vehicle.current_driver_id)
  }

  revalidatePath('/fleet')
  return { error: null }
}

export async function getVehicleAssignmentHistory(vehicleId: string) {
  const { error, supabase } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  const { data, error: dbError } = await supabase
    .from('vehicle_assignments')
    .select('*, drivers(first_name, last_name)')
    .eq('vehicle_id', vehicleId)
    .order('assigned_at', { ascending: false })

  if (dbError) return { error: { form: [dbError.message] }, data: null }
  return { error: null, data }
}

// ============================================================
// Cost Per Mile actions
// ============================================================

export async function getVehicleCostPerMile(vehicleId: string) {
  const { error, supabase } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  // Get vehicle info
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('purchase_price, current_value, purchase_date, current_odometer, insurance_policy')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) return { error: { form: ['Vehicle not found'] }, data: null }

  // Sum maintenance costs
  const { data: maintenanceData } = await supabase
    .from('maintenance_records')
    .select('cost_total')
    .eq('vehicle_id', vehicleId)

  const maintenanceCosts = maintenanceData?.reduce((sum, r) => sum + (r.cost_total || 0), 0) ?? 0

  // Sum fuel costs
  const { data: fuelData } = await supabase
    .from('fuel_transactions')
    .select('total_cost')
    .eq('vehicle_id', vehicleId)

  const fuelCosts = fuelData?.reduce((sum, r) => sum + (r.total_cost || 0), 0) ?? 0

  // Calculate months owned
  let monthsOwned: number | undefined
  if (vehicle.purchase_date) {
    const purchaseDate = new Date(vehicle.purchase_date)
    const now = new Date()
    monthsOwned = (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - purchaseDate.getMonth())
    if (monthsOwned < 1) monthsOwned = 1
  }

  const totalMiles = vehicle.current_odometer ?? 0

  const costPerMile = calculateCostPerMile({
    maintenanceCosts,
    fuelCosts,
    purchasePrice: vehicle.purchase_price ?? undefined,
    currentValue: vehicle.current_value ?? undefined,
    monthsOwned,
    totalMiles,
  })

  // Calculate depreciation
  const depreciation =
    vehicle.purchase_price !== null && vehicle.current_value !== null
      ? vehicle.purchase_price - vehicle.current_value
      : 0

  const total = maintenanceCosts + fuelCosts + depreciation

  return {
    error: null,
    data: {
      costPerMile,
      breakdown: {
        maintenance: maintenanceCosts,
        fuel: fuelCosts,
        depreciation,
        insurance: 0,
        total,
      },
      totalMiles,
    },
  }
}

export async function getFleetCostSummary() {
  const { error, supabase, orgId } = await getAuthContext()
  if (error) return { error: { form: [error] }, data: null }

  // Get all active vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, unit_number, current_odometer')
    .eq('org_id', orgId)
    .eq('status', 'active')

  if (!vehicles || vehicles.length === 0) {
    return {
      error: null,
      data: {
        fleetCostPerMile: 0,
        topExpensiveVehicles: [] as { vehicleId: string; unitNumber: string; totalCost: number; maintenanceCosts: number; fuelCosts: number }[],
        totalMaintenanceCosts: 0,
        totalFuelCosts: 0,
      },
    }
  }

  // Get all maintenance costs
  const { data: allMaintenance } = await supabase
    .from('maintenance_records')
    .select('vehicle_id, cost_total')
    .eq('org_id', orgId)

  // Get all fuel costs
  const { data: allFuel } = await supabase
    .from('fuel_transactions')
    .select('vehicle_id, total_cost')
    .eq('org_id', orgId)

  // Build per-vehicle cost map
  const vehicleCosts = vehicles.map((v) => {
    const maintenanceCosts = allMaintenance
      ?.filter((m) => m.vehicle_id === v.id)
      .reduce((sum, m) => sum + (m.cost_total || 0), 0) ?? 0

    const fuelCosts = allFuel
      ?.filter((f) => f.vehicle_id === v.id)
      .reduce((sum, f) => sum + (f.total_cost || 0), 0) ?? 0

    const totalMiles = v.current_odometer ?? 0

    return {
      vehicleId: v.id,
      unitNumber: v.unit_number,
      maintenanceCosts,
      fuelCosts,
      totalMiles,
      totalCost: maintenanceCosts + fuelCosts,
    }
  })

  // Calculate fleet-wide cost per mile
  const fleetCostPerMile = calculateFleetCostPerMile(
    vehicleCosts.map((vc) => ({
      maintenanceCosts: vc.maintenanceCosts,
      fuelCosts: vc.fuelCosts,
      totalMiles: vc.totalMiles,
    }))
  )

  // Top 5 most expensive vehicles
  const topExpensiveVehicles = [...vehicleCosts]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5)
    .map((vc) => ({
      vehicleId: vc.vehicleId,
      unitNumber: vc.unitNumber,
      totalCost: vc.totalCost,
      maintenanceCosts: vc.maintenanceCosts,
      fuelCosts: vc.fuelCosts,
    }))

  const totalMaintenanceCosts = vehicleCosts.reduce((sum, vc) => sum + vc.maintenanceCosts, 0)
  const totalFuelCosts = vehicleCosts.reduce((sum, vc) => sum + vc.fuelCosts, 0)

  return {
    error: null,
    data: {
      fleetCostPerMile,
      topExpensiveVehicles,
      totalMaintenanceCosts,
      totalFuelCosts,
    },
  }
}
