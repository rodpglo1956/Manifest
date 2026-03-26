import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { isEnterprisePlan } from '@/lib/white-label/config'
import { BrandSettings } from '@/components/white-label/brand-settings'
import type { WhiteLabelConfig, BillingAccount } from '@/types/database'

export const metadata: Metadata = {
  title: 'White Label Settings | Manifest',
}

export default async function WhiteLabelPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/onboarding')
  }

  const orgId = profile.org_id

  // Check billing plan
  const { data: billingData } = await supabase
    .from('billing_accounts')
    .select('plan')
    .eq('org_id', orgId)
    .single()

  const billing = billingData as BillingAccount | null

  if (!billing || !isEnterprisePlan(billing.plan)) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          White Label Settings
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Customize your platform branding.
        </p>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            White-label branding is available on the Enterprise plan
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Rebrand Manifest as your own product with custom logos, colors, and
            domain.
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center rounded-md bg-[var(--brand-primary,#EC008C)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  // Load existing config
  const { data: configData } = await supabase
    .from('white_label_config')
    .select('*')
    .eq('org_id', orgId)
    .single()

  const config = (configData as WhiteLabelConfig | null) ?? null

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        White Label Settings
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Customize your platform branding, colors, and support contact
        information.
      </p>
      <BrandSettings config={config} />
    </div>
  )
}
