import { describe, it, expect } from 'vitest'
import {
  pickupSchema,
  deliverySchema,
  freightSchema,
  rateSchema,
  brokerSchema,
  assignmentSchema,
  loadSchema,
  STEP_FIELDS,
} from '@/schemas/load'

describe('Load Schema', () => {
  describe('pickupSchema', () => {
    it('validates a complete pickup', () => {
      const result = pickupSchema.safeParse({
        pickup_address: '123 Main St',
        pickup_city: 'Dallas',
        pickup_state: 'TX',
        pickup_zip: '75001',
        pickup_date: '2026-04-01',
      })
      expect(result.success).toBe(true)
    })

    it('requires pickup_address', () => {
      const result = pickupSchema.safeParse({
        pickup_city: 'Dallas',
        pickup_state: 'TX',
        pickup_zip: '75001',
        pickup_date: '2026-04-01',
      })
      expect(result.success).toBe(false)
    })

    it('requires pickup_state to be 2 chars', () => {
      const result = pickupSchema.safeParse({
        pickup_address: '123 Main St',
        pickup_city: 'Dallas',
        pickup_state: 'Texas',
        pickup_zip: '75001',
        pickup_date: '2026-04-01',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('deliverySchema', () => {
    it('validates a complete delivery', () => {
      const result = deliverySchema.safeParse({
        delivery_address: '456 Oak Ave',
        delivery_city: 'Houston',
        delivery_state: 'TX',
        delivery_zip: '77001',
        delivery_date: '2026-04-03',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('freightSchema', () => {
    it('validates freight details', () => {
      const result = freightSchema.safeParse({
        commodity: 'Electronics',
        weight: 40000,
        weight_unit: 'lbs',
        pieces: 20,
        equipment_type: 'dry_van',
      })
      expect(result.success).toBe(true)
    })

    it('requires commodity', () => {
      const result = freightSchema.safeParse({
        equipment_type: 'dry_van',
      })
      expect(result.success).toBe(false)
    })

    it('defaults hazmat to false', () => {
      const result = freightSchema.parse({
        commodity: 'Electronics',
        equipment_type: 'dry_van',
      })
      expect(result.hazmat).toBe(false)
    })
  })

  describe('rateSchema', () => {
    it('validates rate details', () => {
      const result = rateSchema.safeParse({
        rate_amount: 2500,
        rate_type: 'flat',
        miles: 280,
      })
      expect(result.success).toBe(true)
    })

    it('requires positive rate_amount', () => {
      const result = rateSchema.safeParse({
        rate_amount: -100,
        rate_type: 'flat',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('brokerSchema', () => {
    it('validates broker with all optional fields', () => {
      const result = brokerSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates broker email when provided', () => {
      const result = brokerSchema.safeParse({
        broker_email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('assignmentSchema', () => {
    it('validates with no assignment', () => {
      const result = assignmentSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('loadSchema (combined)', () => {
    it('validates a complete load', () => {
      const result = loadSchema.safeParse({
        pickup_address: '123 Main St',
        pickup_city: 'Dallas',
        pickup_state: 'TX',
        pickup_zip: '75001',
        pickup_date: '2026-04-01',
        delivery_address: '456 Oak Ave',
        delivery_city: 'Houston',
        delivery_state: 'TX',
        delivery_zip: '77001',
        delivery_date: '2026-04-03',
        commodity: 'Electronics',
        equipment_type: 'dry_van',
        rate_amount: 2500,
        rate_type: 'flat',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('STEP_FIELDS', () => {
    it('has fields for all 6 steps', () => {
      expect(Object.keys(STEP_FIELDS)).toHaveLength(6)
      expect(STEP_FIELDS.pickup).toContain('pickup_address')
      expect(STEP_FIELDS.delivery).toContain('delivery_address')
      expect(STEP_FIELDS.freight).toContain('commodity')
      expect(STEP_FIELDS.rate).toContain('rate_amount')
      expect(STEP_FIELDS.broker).toContain('broker_name')
      expect(STEP_FIELDS.assignment).toContain('driver_id')
    })
  })
})
