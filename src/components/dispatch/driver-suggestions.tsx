'use client'

import { useEffect, useState, useTransition } from 'react'
import { MapPin, CheckCircle, Truck, TrendingUp, Route, Loader2 } from 'lucide-react'
import { createDispatch } from '@/app/(app)/dispatch/actions'
import type { DriverSuggestion, ScoringFactors } from '@/types/marie'
import type { Vehicle } from '@/types/database'

interface DriverSuggestionsProps {
  loadId: string
  vehicles: Pick<Vehicle, 'id' | 'unit_number' | 'make' | 'model'>[]
  onClose: () => void
}

type FetchState = 'loading' | 'error' | 'empty' | 'loaded'

const factorConfig: { key: keyof ScoringFactors; label: string; Icon: typeof MapPin }[] = [
  { key: 'proximity', label: 'Proximity', Icon: MapPin },
  { key: 'availability', label: 'Availability', Icon: CheckCircle },
  { key: 'equipment', label: 'Equipment', Icon: Truck },
  { key: 'performance', label: 'Performance', Icon: TrendingUp },
  { key: 'lane', label: 'Lane', Icon: Route },
]

export function getScoreColor(score: number): string {
  if (score > 70) return 'text-green-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

export function getScoreBgColor(score: number): string {
  if (score > 70) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function DriverSuggestions({ loadId, vehicles, onClose }: DriverSuggestionsProps) {
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [suggestions, setSuggestions] = useState<DriverSuggestion[]>([])
  const [isPending, startTransition] = useTransition()
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSuggestions() {
      try {
        const res = await fetch('/api/dispatch/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ load_id: loadId }),
        })

        if (cancelled) return

        if (!res.ok) {
          setFetchState('error')
          return
        }

        const data = await res.json()
        if (cancelled) return

        if (!data.suggestions || data.suggestions.length === 0) {
          setFetchState('empty')
          return
        }

        setSuggestions(data.suggestions)
        setFetchState('loaded')
      } catch {
        if (!cancelled) setFetchState('error')
      }
    }

    fetchSuggestions()
    return () => { cancelled = true }
  }, [loadId])

  const handleAssign = (driverId: string) => {
    setAssigningDriverId(driverId)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('load_id', loadId)
      formData.set('driver_id', driverId)

      const result = await createDispatch(formData)
      if (!result.error) {
        onClose()
      }
      setAssigningDriverId(null)
    })
  }

  if (fetchState === 'loading') {
    return (
      <div className="space-y-3" data-testid="suggestions-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-32" />
        ))}
      </div>
    )
  }

  if (fetchState === 'error') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="suggestions-error">
        <p className="text-sm text-red-700">Could not load suggestions. Try manual assignment.</p>
      </div>
    )
  }

  if (fetchState === 'empty') {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg" data-testid="suggestions-empty">
        <p className="text-sm text-gray-600">No available drivers found for this load.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="suggestions-list">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.driver_id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{suggestion.driver_name}</p>
              <p className={`text-lg font-bold ${getScoreColor(suggestion.score)}`}>
                Score: {suggestion.score}/100
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAssign(suggestion.driver_id)}
              disabled={isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && assigningDriverId === suggestion.driver_id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {factorConfig.map(({ key, label, Icon }) => {
              const value = suggestion.factors[key]
              const pct = Math.round(value * 100)
              return (
                <div key={key} className="text-center">
                  <Icon className="w-3.5 h-3.5 mx-auto text-gray-400 mb-1" />
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div
                      className={`h-1.5 rounded-full ${getScoreBgColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">{label}</p>
                  <p className="text-xs font-medium text-gray-700">{pct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
