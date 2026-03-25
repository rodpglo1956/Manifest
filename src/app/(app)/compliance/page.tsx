import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard'
import { ComplianceSetup } from '@/components/compliance/compliance-setup'
import { getComplianceDashboard, getComplianceProfile } from '@/lib/compliance/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance | Manifest',
}

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getComplianceProfile()

  if (!profile) {
    // Fetch org data to pre-fill setup form
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    let orgData: { dot_number: string | null; mc_number: string | null; company_type: string } | null = null
    if (userProfile?.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('dot_number, mc_number, company_type')
        .eq('id', userProfile.org_id)
        .single()
      orgData = org
    }

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance</h1>
        <ComplianceSetup
          dotNumber={orgData?.dot_number ?? undefined}
          mcNumber={orgData?.mc_number ?? undefined}
          companyType={orgData?.company_type ?? undefined}
        />
      </div>
    )
  }

  const dashboardData = await getComplianceDashboard()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance</h1>
      <ComplianceDashboard
        healthScore={dashboardData.healthScore}
        metrics={dashboardData.metrics}
        recentAlerts={dashboardData.recentAlerts}
        upcomingItems={dashboardData.upcomingItems}
        isDotRegulated={profile.is_dot_regulated}
      />
    </div>
  )
}
