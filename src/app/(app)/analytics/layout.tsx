'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/analytics', label: 'Overview', exact: true },
  { href: '/analytics/operations', label: 'Operations' },
  { href: '/analytics/fleet', label: 'Fleet' },
  { href: '/analytics/drivers', label: 'Drivers' },
  { href: '/analytics/customers', label: 'Customers' },
  { href: '/analytics/reports', label: 'Reports' },
]

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(tab: { href: string; exact?: boolean }) {
    if (tab.exact) return pathname === tab.href
    return pathname.startsWith(tab.href)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <nav className="mt-4 flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => {
            const active = isActive(tab)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {children}
    </div>
  )
}
