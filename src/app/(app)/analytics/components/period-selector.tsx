'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const periods = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
] as const

export function PeriodSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') ?? 'month'

  const handleSelect = useCallback(
    (period: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('period', period)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {periods.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleSelect(value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            current === value
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
