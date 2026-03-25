import { z } from 'zod'

export interface DvirItem {
  readonly id: string
  readonly label: string
}

/**
 * 11 FMCSA-required DVIR inspection items per 49 CFR 396.11/396.13
 */
export const DVIR_INSPECTION_ITEMS: readonly DvirItem[] = [
  { id: 'service_brakes', label: 'Service Brakes' },
  { id: 'parking_brake', label: 'Parking Brake' },
  { id: 'steering', label: 'Steering Mechanism' },
  { id: 'lighting', label: 'Lighting Devices & Reflectors' },
  { id: 'tires', label: 'Tires' },
  { id: 'horn', label: 'Horn' },
  { id: 'wipers', label: 'Windshield Wipers' },
  { id: 'mirrors', label: 'Mirrors' },
  { id: 'coupling', label: 'Coupling Devices' },
  { id: 'wheels_rims', label: 'Wheels & Rims' },
  { id: 'emergency_equipment', label: 'Emergency Equipment' },
] as const

export type DVIRItemId = (typeof DVIR_INSPECTION_ITEMS)[number]['id']

const itemResult = z.enum(['pass', 'fail'])

const defectSchema = z.object({
  item_id: z.string(),
  description: z.string().min(1, 'Defect description is required'),
})

/**
 * DVIR (Driver Vehicle Inspection Report) schema
 * Validates pre-trip and post-trip inspections per FMCSA requirements
 */
export const dvirSchema = z
  .object({
    vehicle_id: z.string().uuid('Valid vehicle ID is required'),
    inspection_type: z.enum(['pre_trip', 'post_trip']),
    items: z.record(z.string(), itemResult).refine(
      (items) => Object.keys(items).length >= 11,
      { message: 'All 11 inspection items must be completed' }
    ),
    defects: z.array(defectSchema),
    notes: z.string().optional(),
    odometer: z.number().positive().optional(),
  })
  .refine(
    (data) => {
      // Every item marked 'fail' must have a matching defect entry
      const failedItems = Object.entries(data.items)
        .filter(([, result]) => result === 'fail')
        .map(([id]) => id)

      if (failedItems.length === 0) return true

      const defectItemIds = new Set(data.defects.map((d) => d.item_id))
      return failedItems.every((id) => defectItemIds.has(id))
    },
    { message: 'Each failed item must have a defect description' }
  )

export type DVIRInput = z.input<typeof dvirSchema>
export type DVIRData = z.output<typeof dvirSchema>
