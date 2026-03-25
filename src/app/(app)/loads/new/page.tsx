import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoadWizard } from '@/components/loads/load-form/load-wizard'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Load | Manifest',
}

export default async function NewLoadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Fetch drivers and vehicles for the assignment step
  const [driversResult, vehiclesResult] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, first_name, last_name, status')
      .eq('org_id', profile.org_id)
      .order('last_name', { ascending: true }),
    supabase
      .from('vehicles')
      .select('id, unit_number, make, model, status')
      .eq('org_id', profile.org_id)
      .order('unit_number', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/loads"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to Loads
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Create New Load</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <LoadWizard
          drivers={(driversResult.data ?? []) as { id: string; first_name: string; last_name: string; status: 'active' | 'inactive' | 'terminated' }[]}
          vehicles={(vehiclesResult.data ?? []) as { id: string; unit_number: string; make: string | null; model: string | null; status: 'active' | 'inactive' }[]}
        />
      </div>
    </div>
  )
}
