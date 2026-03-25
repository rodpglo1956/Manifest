import { getCustomerAnalytics } from '@/lib/analytics/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer Analytics | Manifest',
}

function daysToPayColor(days: number | null): string {
  if (days === null) return 'text-gray-400'
  if (days < 30) return 'text-green-600'
  if (days <= 45) return 'text-yellow-600'
  return 'text-red-600'
}

function paymentRating(days: number | null): {
  label: string
  colorClass: string
} {
  if (days === null) return { label: '--', colorClass: 'bg-gray-100 text-gray-500' }
  if (days < 15) return { label: 'Excellent', colorClass: 'bg-green-100 text-green-800' }
  if (days <= 30) return { label: 'Good', colorClass: 'bg-blue-100 text-blue-800' }
  if (days <= 45) return { label: 'Fair', colorClass: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Poor', colorClass: 'bg-red-100 text-red-800' }
}

export default async function CustomersAnalyticsPage() {
  const { error, customers } = await getCustomerAnalytics()

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  // Split brokers from the full list (by name convention or status)
  // Since CRM uses company_type but getCustomerAnalytics returns status,
  // we filter brokers by checking if status contains 'broker' pattern
  // For now, all customers shown in profitability, separate broker section below
  const brokers = customers.filter((c) => c.status === 'broker' || c.name.toLowerCase().includes('broker'))
  const allCustomers = customers

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer & Broker Analytics</h1>

      {/* Section 1: Customer Profitability */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Customer Profitability</h3>
        {allCustomers.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No customer data yet. Complete loads to see profitability rankings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Company Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Loads</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Avg Rate/Mile</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Avg Days to Pay</th>
                </tr>
              </thead>
              <tbody>
                {allCustomers.map((c) => {
                  const avgRate =
                    c.total_loads > 0
                      ? (c.total_revenue / c.total_loads).toFixed(2)
                      : '--'

                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : c.status === 'prospect'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${c.total_revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{c.total_loads}</td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {avgRate === '--' ? '--' : `$${avgRate}`}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${daysToPayColor(c.avg_days_to_pay)}`}>
                        {c.avg_days_to_pay !== null ? `${c.avg_days_to_pay} days` : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Broker Reliability */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Broker Reliability</h3>
        {brokers.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No broker data yet. Complete loads to see broker reliability ratings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Broker Name</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Loads</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Avg Days to Pay</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Payment Rating</th>
                </tr>
              </thead>
              <tbody>
                {brokers.map((b) => {
                  const rating = paymentRating(b.avg_days_to_pay)

                  return (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{b.name}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{b.total_loads}</td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${b.total_revenue.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${daysToPayColor(b.avg_days_to_pay)}`}>
                        {b.avg_days_to_pay !== null ? `${b.avg_days_to_pay} days` : '--'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rating.colorClass}`}
                        >
                          {rating.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
