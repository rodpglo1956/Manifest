import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Load } from '@/types/database'

interface LoadListProps {
  loads: (Load & {
    driver_first_name?: string | null
    driver_last_name?: string | null
  })[]
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return '--'
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function LoadList({ loads }: LoadListProps) {
  if (loads.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No loads found</p>
        <p className="text-sm mt-1">Try adjusting your filters or create a new load.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-3 pr-4 font-medium text-gray-500">Load #</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Status</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Pickup</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Delivery</th>
            <th className="pb-3 pr-4 font-medium text-gray-500">Driver</th>
            <th className="pb-3 pr-4 font-medium text-gray-500 text-right">Revenue</th>
            <th className="pb-3 font-medium text-gray-500">Broker</th>
          </tr>
        </thead>
        <tbody>
          {loads.map((load) => (
            <tr
              key={load.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 pr-4">
                <Link
                  href={`/loads/${load.id}`}
                  className="font-mono text-sm font-medium text-primary hover:underline"
                >
                  {load.load_number ?? '--'}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={load.status} variant="load" />
              </td>
              <td className="py-3 pr-4">
                <div className="text-sm">
                  {load.pickup_city && load.pickup_state
                    ? `${load.pickup_city}, ${load.pickup_state}`
                    : load.pickup_city ?? '--'}
                </div>
                <div className="text-xs text-gray-500">{formatDate(load.pickup_date)}</div>
              </td>
              <td className="py-3 pr-4">
                <div className="text-sm">
                  {load.delivery_city && load.delivery_state
                    ? `${load.delivery_city}, ${load.delivery_state}`
                    : load.delivery_city ?? '--'}
                </div>
                <div className="text-xs text-gray-500">{formatDate(load.delivery_date)}</div>
              </td>
              <td className="py-3 pr-4 text-sm">
                {load.driver_first_name
                  ? `${load.driver_first_name} ${load.driver_last_name ?? ''}`
                  : <span className="text-gray-400">Unassigned</span>}
              </td>
              <td className="py-3 pr-4 text-sm text-right font-medium">
                {formatCurrency(load.total_charges)}
              </td>
              <td className="py-3 text-sm text-gray-600">
                {load.broker_name ?? '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
