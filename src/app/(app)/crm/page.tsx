import { getCrmDashboard } from './actions'
import { CrmDashboard } from '@/components/crm/crm-dashboard'

export default async function CrmPage() {
  const result = await getCrmDashboard()

  if (result.error || !result.data) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load CRM dashboard.
      </div>
    )
  }

  return <CrmDashboard data={result.data} />
}
