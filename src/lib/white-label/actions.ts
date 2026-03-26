'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_BRAND, isEnterprisePlan } from './config'
import type { WhiteLabelConfig } from '@/types/database'

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
// Get white-label config for current org
// ============================================================

export type WhiteLabelBrand = {
  brand_name: string
  logo_url: string
  primary_color: string
  secondary_color: string
}

export async function getWhiteLabelConfig(): Promise<WhiteLabelBrand> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return { ...DEFAULT_BRAND }

  // Check if org is on enterprise plan
  const { data: billing } = await supabase
    .from('billing_accounts')
    .select('plan')
    .eq('org_id', orgId)
    .single()

  if (!billing || !isEnterprisePlan(billing.plan)) {
    return { ...DEFAULT_BRAND }
  }

  const { data } = await supabase
    .from('white_label_config')
    .select('*')
    .eq('org_id', orgId)
    .single()

  const config = data as WhiteLabelConfig | null

  if (!config || !config.enabled) {
    return { ...DEFAULT_BRAND }
  }

  return {
    ...DEFAULT_BRAND,
    ...config,
    brand_name: config.brand_name || DEFAULT_BRAND.brand_name,
    logo_url: config.logo_url || DEFAULT_BRAND.logo_url,
    primary_color: config.primary_color || DEFAULT_BRAND.primary_color,
    secondary_color: config.secondary_color || DEFAULT_BRAND.secondary_color,
  }
}

// ============================================================
// Save white-label config (enterprise only)
// ============================================================

export async function saveWhiteLabelConfig(data: {
  enabled?: boolean
  brand_name?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  secondary_color?: string
  custom_domain?: string
  support_email?: string
  support_phone?: string
}): Promise<{ error?: string }> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return { error: error || 'No organization' }

  // Verify enterprise tier
  const { data: billing } = await supabase
    .from('billing_accounts')
    .select('plan')
    .eq('org_id', orgId)
    .single()

  if (!billing || !isEnterprisePlan(billing.plan)) {
    return { error: 'White-label requires an Enterprise plan' }
  }

  const { error: upsertError } = await supabase
    .from('white_label_config')
    .upsert(
      { org_id: orgId, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'org_id' }
    )

  if (upsertError) return { error: upsertError.message }

  revalidatePath('/settings/white-label')
  return {}
}

// ============================================================
// Upload logo to Supabase Storage
// ============================================================

export async function uploadLogo(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return { error: error || 'No organization' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${orgId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('white-label')
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from('white-label')
    .getPublicUrl(path)

  return { url: urlData.publicUrl }
}
