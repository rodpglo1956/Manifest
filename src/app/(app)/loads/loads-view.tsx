'use client'

import { useState } from 'react'
import { useRealtimeLoads } from '@/hooks/use-realtime-loads'
import { LoadList } from '@/components/loads/load-list'
import { LoadKanban } from '@/components/loads/load-kanban'
import { exportLoadsToCSV } from '@/lib/csv-export'
import { LayoutList, Columns3, Download } from 'lucide-react'
import type { Load } from '@/types/database'

type LoadWithDriver = Load & {
  driver_first_name?: string | null
  driver_last_name?: string | null
}

interface LoadsViewProps {
  loads: LoadWithDriver[]
  orgId: string | null
}

export function LoadsView({ loads, orgId }: LoadsViewProps) {
  const [view, setView] = useState<'list' | 'kanban'>('list')

  // Subscribe to realtime changes
  useRealtimeLoads(orgId)

  return (
    <div className="space-y-4">
      {/* View toggle and export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              view === 'list'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              view === 'kanban'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Columns3 className="w-4 h-4" />
            Board
          </button>
        </div>

        <button
          type="button"
          onClick={() => exportLoadsToCSV(loads)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <LoadList loads={loads} />
      ) : (
        <LoadKanban loads={loads} />
      )}
    </div>
  )
}
