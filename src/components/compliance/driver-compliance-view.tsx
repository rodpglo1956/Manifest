'use client'

import { useState, useEffect, useTransition } from 'react'
import { getComplianceItems, getDriverQualification, completeComplianceItem } from '@/lib/compliance/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2 } from 'lucide-react'
import type { ComplianceItem, DriverQualification } from '@/types/database'

interface DriverComplianceViewProps {
  driverId: string
  driverName: string
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function countdownColor(days: number | null): string {
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-600'
  if (days < 30) return 'text-red-600'
  if (days < 90) return 'text-yellow-600'
  return 'text-green-600'
}

function countdownBg(days: number | null): string {
  if (days === null) return 'bg-gray-50 border-gray-200'
  if (days < 0) return 'bg-red-50 border-red-200'
  if (days < 30) return 'bg-red-50 border-red-200'
  if (days < 90) return 'bg-yellow-50 border-yellow-200'
  return 'bg-green-50 border-green-200'
}

export function DriverComplianceView({ driverId, driverName }: DriverComplianceViewProps) {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [dq, setDq] = useState<(DriverQualification & { completeness: { percentage: number; missing: string[] } }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const [itemsData, dqData] = await Promise.all([
        getComplianceItems({ driverId }),
        getDriverQualification(driverId),
      ])
      setItems(itemsData)
      setDq(dqData)
      setLoading(false)
    }
    load()
  }, [driverId])

  function handleComplete(itemId: string) {
    startTransition(async () => {
      await completeComplianceItem(itemId)
      // Refresh items
      const updated = await getComplianceItems({ driverId })
      setItems(updated)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const cdlDays = dq?.cdl_expiry ? daysUntil(dq.cdl_expiry) : null
  const medDays = dq?.medical_card_expiry ? daysUntil(dq.medical_card_expiry) : null

  return (
    <div className="space-y-4">
      {/* CDL & Medical Card Countdowns */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-lg border p-3 ${countdownBg(cdlDays)}`}>
          <p className="text-xs text-gray-500 mb-1">CDL Expiry</p>
          {cdlDays !== null ? (
            <>
              <p className={`text-2xl font-bold ${countdownColor(cdlDays)}`}>
                {cdlDays < 0 ? 'Expired' : `${cdlDays}d`}
              </p>
              <p className="text-xs text-gray-500">
                {cdlDays < 0 ? `${Math.abs(cdlDays)} days ago` : 'remaining'}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Not on file</p>
          )}
        </div>
        <div className={`rounded-lg border p-3 ${countdownBg(medDays)}`}>
          <p className="text-xs text-gray-500 mb-1">Medical Card</p>
          {medDays !== null ? (
            <>
              <p className={`text-2xl font-bold ${countdownColor(medDays)}`}>
                {medDays < 0 ? 'Expired' : `${medDays}d`}
              </p>
              <p className="text-xs text-gray-500">
                {medDays < 0 ? `${Math.abs(medDays)} days ago` : 'remaining'}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Not on file</p>
          )}
        </div>
      </div>

      {/* DQ File Completeness */}
      {dq && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">DQ File</p>
            <span className={`text-sm font-semibold ${dq.completeness.percentage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
              {dq.completeness.percentage}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${dq.completeness.percentage === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${dq.completeness.percentage}%` }}
            />
          </div>
          {dq.completeness.missing.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Missing:</p>
              <div className="flex flex-wrap gap-1">
                {dq.completeness.missing.map((m) => (
                  <span key={m} className="text-xs bg-yellow-100 text-yellow-700 rounded px-1.5 py-0.5">
                    {m.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compliance Items */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Compliance Items</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No compliance items assigned to you.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={item.status} variant="compliance" />
                    {item.due_date && (
                      <span className="text-xs text-gray-500">
                        Due {item.due_date}
                      </span>
                    )}
                  </div>
                </div>
                {item.status !== 'completed' && item.status !== 'waived' && (
                  <button
                    onClick={() => handleComplete(item.id)}
                    disabled={isPending}
                    className="shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
