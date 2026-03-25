'use client'

import Link from 'next/link'
import { Plus, Truck, FileText } from 'lucide-react'

const actions = [
  {
    label: 'Create Load',
    href: '/loads/new',
    icon: Plus,
  },
  {
    label: 'Dispatch Driver',
    href: '/dispatch',
    icon: Truck,
  },
  {
    label: 'Create Invoice',
    href: '/invoices/new',
    icon: FileText,
  },
] as const

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Icon className="w-4 h-4" />
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}
