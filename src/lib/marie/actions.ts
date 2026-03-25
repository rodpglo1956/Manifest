// Marie utility action wrappers
// These accept plain objects (NOT FormData) and do NOT use redirect() or revalidatePath()
// Called from the Marie API route context via tool executor

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, EquipmentType, RateType } from '@/types/database'

type CreateLoadParams = {
  pickup_city: string
  pickup_state: string
  delivery_city: string
  delivery_state: string
  equipment_type?: string
  rate_amount: number
  rate_type?: string
}

type CreateDispatchParams = {
  load_id: string
  driver_id: string
}

type CreateInvoiceParams = {
  load_id: string
}

export async function createLoadForMarie(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  params: CreateLoadParams
): Promise<{ success: boolean; load_number?: string; load_id?: string; error?: string }> {
  try {
    const totalCharges = params.rate_amount

    const { data, error } = await supabase
      .from('loads')
      .insert({
        org_id: orgId,
        status: 'booked',
        created_by: userId,
        pickup_city: params.pickup_city,
        pickup_state: params.pickup_state,
        delivery_city: params.delivery_city,
        delivery_state: params.delivery_state,
        equipment_type: (params.equipment_type as EquipmentType) ?? null,
        rate_amount: params.rate_amount,
        rate_type: (params.rate_type as RateType) ?? 'flat',
        total_charges: totalCharges,
        hazmat: false,
        // Required fields with sensible defaults for Marie-created loads
        pickup_company: null,
        pickup_address: null,
        pickup_zip: null,
        pickup_date: null,
        delivery_company: null,
        delivery_address: null,
        delivery_zip: null,
        delivery_date: null,
        commodity: null,
        bol_url: null,
        rate_confirmation_url: null,
        pod_url: null,
      })
      .select('id, load_number')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      load_number: data.load_number ?? undefined,
      load_id: data.id,
    }
  } catch (err) {
    return { success: false, error: 'Failed to create load' }
  }
}

export async function createDispatchForMarie(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  params: CreateDispatchParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate load is booked
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('id, status, org_id')
      .eq('id', params.load_id)
      .single()

    if (loadError || !load) {
      return { success: false, error: 'Load not found' }
    }

    if (load.status !== 'booked') {
      return { success: false, error: 'Load must be in booked status to dispatch' }
    }

    // Check driver has no active dispatch
    const { data: activeDispatch } = await supabase
      .from('dispatches')
      .select('id')
      .eq('driver_id', params.driver_id)
      .not('status', 'in', '("completed","rejected")')
      .limit(1)
      .maybeSingle()

    if (activeDispatch) {
      return { success: false, error: 'Driver already has an active dispatch' }
    }

    // Get driver's current vehicle
    const { data: driver } = await supabase
      .from('drivers')
      .select('current_vehicle_id')
      .eq('id', params.driver_id)
      .single()

    const vehicleId = driver?.current_vehicle_id ?? null

    // Create dispatch
    const { error: dispatchError } = await supabase
      .from('dispatches')
      .insert({
        org_id: orgId,
        load_id: params.load_id,
        driver_id: params.driver_id,
        vehicle_id: vehicleId,
        status: 'assigned',
        assigned_by: userId,
      })

    if (dispatchError) {
      return { success: false, error: dispatchError.message }
    }

    // Update load status
    await supabase
      .from('loads')
      .update({
        status: 'dispatched',
        driver_id: params.driver_id,
        vehicle_id: vehicleId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.load_id)

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Failed to create dispatch' }
  }
}

export async function createInvoiceForMarie(
  supabase: SupabaseClient<Database>,
  params: CreateInvoiceParams
): Promise<{ success: boolean; invoice_id?: string; error?: string }> {
  try {
    // Validate load is delivered
    const { data: load, error: fetchError } = await supabase
      .from('loads')
      .select(
        'id, org_id, broker_name, broker_email, rate_amount, fuel_surcharge, accessorial_charges, total_charges'
      )
      .eq('id', params.load_id)
      .eq('status', 'delivered')
      .single()

    if (fetchError || !load) {
      return { success: false, error: 'Load not found or not in delivered status' }
    }

    const today = new Date()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        org_id: load.org_id,
        load_id: load.id,
        bill_to_company: load.broker_name || '',
        bill_to_email: load.broker_email || null,
        amount: load.rate_amount || 0,
        fuel_surcharge: load.fuel_surcharge || 0,
        accessorials: load.accessorial_charges || 0,
        total: load.total_charges || 0,
        status: 'draft',
        issued_date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
      })
      .select('id')
      .single()

    if (insertError || !invoice) {
      return { success: false, error: insertError?.message ?? 'Failed to create invoice' }
    }

    // Update load status to invoiced
    await supabase
      .from('loads')
      .update({ status: 'invoiced', updated_at: new Date().toISOString() })
      .eq('id', params.load_id)

    return { success: true, invoice_id: invoice.id }
  } catch (err) {
    return { success: false, error: 'Failed to create invoice' }
  }
}
