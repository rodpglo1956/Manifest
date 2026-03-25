'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadSchema } from '@/schemas/load'
import type { LoadStatus, RateType, WeightUnit, EquipmentType } from '@/types/database'

export async function createLoad(formData: FormData) {
  const raw: Record<string, unknown> = {}

  // String fields
  const stringFields = [
    'pickup_address', 'pickup_city', 'pickup_state', 'pickup_zip',
    'pickup_date', 'pickup_time', 'pickup_contact_name', 'pickup_contact_phone', 'pickup_notes',
    'delivery_address', 'delivery_city', 'delivery_state', 'delivery_zip',
    'delivery_date', 'delivery_time', 'delivery_contact_name', 'delivery_contact_phone', 'delivery_notes',
    'commodity', 'weight_unit', 'equipment_type', 'rate_type',
    'broker_name', 'broker_contact', 'broker_phone', 'broker_email',
    'broker_mc_number', 'broker_reference', 'notes',
    'driver_id', 'vehicle_id',
  ]

  for (const field of stringFields) {
    const value = formData.get(field)
    if (value !== null) {
      raw[field] = value as string
    }
  }

  // Numeric fields
  const numericFields = [
    'weight', 'pieces', 'temperature_min', 'temperature_max',
    'rate_amount', 'miles', 'fuel_surcharge', 'accessorial_charges',
  ]

  for (const field of numericFields) {
    const value = formData.get(field)
    if (value !== null && value !== '') {
      raw[field] = value
    }
  }

  // Boolean fields
  raw.hazmat = formData.get('hazmat') === 'true'

  // Handle optional UUID fields -- empty strings should become undefined
  if (raw.driver_id === '') raw.driver_id = undefined
  if (raw.vehicle_id === '') raw.vehicle_id = undefined

  const parsed = loadSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { form: ['Not authenticated'] } }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return { error: { form: ['No organization found'] } }
  }

  // Compute total revenue
  const rate = parsed.data.rate_amount ?? 0
  const fuelSurcharge = parsed.data.fuel_surcharge ?? 0
  const accessorial = parsed.data.accessorial_charges ?? 0
  const totalCharges = rate + fuelSurcharge + accessorial

  const { error } = await supabase.from('loads').insert({
    org_id: profile.org_id,
    status: 'booked' as LoadStatus,
    created_by: user.id,

    // Pickup
    pickup_address: parsed.data.pickup_address,
    pickup_city: parsed.data.pickup_city,
    pickup_state: parsed.data.pickup_state,
    pickup_zip: parsed.data.pickup_zip,
    pickup_date: parsed.data.pickup_date,
    pickup_time: parsed.data.pickup_time || null,
    pickup_contact_name: parsed.data.pickup_contact_name || null,
    pickup_contact_phone: parsed.data.pickup_contact_phone || null,
    pickup_notes: parsed.data.pickup_notes || null,

    // Delivery
    delivery_address: parsed.data.delivery_address,
    delivery_city: parsed.data.delivery_city,
    delivery_state: parsed.data.delivery_state,
    delivery_zip: parsed.data.delivery_zip,
    delivery_date: parsed.data.delivery_date,
    delivery_time: parsed.data.delivery_time || null,
    delivery_contact_name: parsed.data.delivery_contact_name || null,
    delivery_contact_phone: parsed.data.delivery_contact_phone || null,
    delivery_notes: parsed.data.delivery_notes || null,

    // Freight
    commodity: parsed.data.commodity,
    weight: parsed.data.weight ?? null,
    weight_unit: (parsed.data.weight_unit as WeightUnit) ?? null,
    pieces: parsed.data.pieces ?? null,
    equipment_type: (parsed.data.equipment_type as EquipmentType) ?? null,
    temperature_min: parsed.data.temperature_min ?? null,
    temperature_max: parsed.data.temperature_max ?? null,
    hazmat: parsed.data.hazmat ?? false,

    // Rate
    rate_amount: parsed.data.rate_amount,
    rate_type: (parsed.data.rate_type as RateType) ?? 'flat',
    miles: parsed.data.miles ?? null,
    fuel_surcharge: parsed.data.fuel_surcharge ?? null,
    accessorial_charges: parsed.data.accessorial_charges ?? null,
    total_charges: totalCharges,

    // Assignment (optional)
    driver_id: parsed.data.driver_id ?? null,
    vehicle_id: parsed.data.vehicle_id ?? null,

    // Broker
    broker_name: parsed.data.broker_name || null,
    broker_contact: parsed.data.broker_contact || null,
    broker_phone: parsed.data.broker_phone || null,
    broker_email: parsed.data.broker_email || null,
    broker_mc_number: parsed.data.broker_mc_number || null,
    broker_reference: parsed.data.broker_reference || null,

    // Documents (empty on creation)
    bol_url: null,
    rate_confirmation_url: null,
    pod_url: null,

    // Notes
    notes: parsed.data.notes || null,

    // load_number is NOT set -- database trigger auto-generates it
  })

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/loads')
}
