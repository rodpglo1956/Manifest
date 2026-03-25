import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getComplianceItems, getComplianceProfile } from '@/lib/compliance/actions'
import { ComplianceItemsTable } from '@/components/compliance/compliance-items-table'
import { AddComplianceItemForm } from '@/components/compliance/add-compliance-item-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance Items | Manifest',
}

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string; addItem?: string }>
}

export default async function ComplianceItemsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams

  const profile = await getComplianceProfile()
  if (!profile) {
    redirect('/compliance')
  }

  const filters: { status?: string; category?: string } = {}
  if (params.status) filters.status = params.status
  if (params.category) filters.category = params.category

  const items = await getComplianceItems(filters)
  const isDotRegulated = profile.is_dot_regulated
  const showAddForm = params.addItem === 'true'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Items</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage regulatory obligations, deadlines, and compliance requirements
          </p>
        </div>
        <a
          href={showAddForm ? '/compliance/items' : '/compliance/items?addItem=true'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          {showAddForm ? 'Close Form' : 'Add Compliance Item'}
        </a>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddComplianceItemForm isDotRegulated={isDotRegulated} />
        </div>
      )}

      <ComplianceItemsTable items={items} isDotRegulated={isDotRegulated} />
    </div>
  )
}
