import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OOComplianceDashboard } from '@/components/compliance/oo-compliance-dashboard'
import { ComplianceSetup } from '@/components/compliance/compliance-setup'
import { Shield } from 'lucide-react'
import type { Metadata } from 'next'
import type { ComplianceProfile } from '@/types/database'

export const metadata: Metadata = {
  title: 'Compliance | Manifest',
}

export default async function OOCompliancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/onboarding')
  }

  // Detect owner-operator via org_members count === 1 (per Phase 4 convention)
  const { count: memberCount } = await supabase
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const isOwnerOperator = (memberCount ?? 0) === 1

  if (!isOwnerOperator) {
    // Non-OO users should use the Command mode compliance page
    redirect('/compliance')
  }

  // Get compliance profile
  const { data: complianceProfile } = await supabase
    .from('compliance_profiles')
    .select('*')
    .eq('org_id', profile.org_id)
    .maybeSingle()

  // If no profile, show setup prompt
  if (!complianceProfile) {
    // Get org details for pre-filling
    const { data: org } = await supabase
      .from('organizations')
      .select('dot_number, mc_number, company_type')
      .eq('id', profile.org_id)
      .single()

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-gray-900">Compliance</h1>
        </div>
        <ComplianceSetup
          dotNumber={org?.dot_number ?? undefined}
          mcNumber={org?.mc_number ?? undefined}
          companyType={org?.company_type ?? undefined}
        />
      </div>
    )
  }

  const cp = complianceProfile as ComplianceProfile

  // Get linked driver record for this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, current_vehicle_id')
    .eq('user_id', user.id)
    .single()

  // Get vehicle IDs owned by the org
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('org_id', profile.org_id)
    .eq('status', 'active')

  const vehicleIds = vehicles?.map((v) => v.id) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-gray-900">Compliance</h1>
      </div>

      <OOComplianceDashboard
        driverId={driver?.id ?? null}
        vehicleIds={vehicleIds}
        isDotRegulated={cp.is_dot_regulated}
        hasIftaLicense={!!cp.ifta_license_number}
        orgId={profile.org_id}
      />
    </div>
  )
}
