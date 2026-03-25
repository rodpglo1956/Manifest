import { ArrowUp, ArrowDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface KPICardProps {
  label: string
  value: string
  change?: number
  changePercent?: number
  icon?: ReactNode
}

export function KPICard({ label, value, change, changePercent, icon }: KPICardProps) {
  const hasChange = change !== undefined && change !== 0

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {hasChange ? (
          change > 0 ? (
            <>
              <ArrowUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">
                {changePercent !== undefined ? `${Math.abs(changePercent)}%` : ''}
              </span>
              <span className="text-gray-400 ml-1">vs prior period</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-3 h-3 text-red-600" />
              <span className="text-red-600 font-medium">
                {changePercent !== undefined ? `${Math.abs(changePercent)}%` : ''}
              </span>
              <span className="text-gray-400 ml-1">vs prior period</span>
            </>
          )
        ) : (
          <span className="text-gray-400">&mdash;</span>
        )}
      </div>
    </div>
  )
}
