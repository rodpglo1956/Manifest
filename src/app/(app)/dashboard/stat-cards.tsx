'use client'

import { Truck, Package, Users, DollarSign } from 'lucide-react'

interface StatCardsProps {
  activeLoads: number
  bookedToday: number
  driversOnDuty: number
  revenueMtd: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const cards = [
  {
    key: 'active-loads',
    label: 'Active Loads',
    icon: Truck,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    getValue: (props: StatCardsProps) => String(props.activeLoads),
  },
  {
    key: 'booked-today',
    label: 'Booked Today',
    icon: Package,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    getValue: (props: StatCardsProps) => String(props.bookedToday),
  },
  {
    key: 'drivers-on-duty',
    label: 'Drivers on Duty',
    icon: Users,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    getValue: (props: StatCardsProps) => String(props.driversOnDuty),
  },
  {
    key: 'revenue-mtd',
    label: 'Revenue MTD',
    icon: DollarSign,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    getValue: (props: StatCardsProps) => formatCurrency(props.revenueMtd),
  },
] as const

export function StatCards(props: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            data-testid={`stat-card-${card.key}`}
            className={`${card.bgColor} rounded-lg border border-gray-100 p-5`}
          >
            <div className="flex items-center gap-3">
              <div className={`${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {card.getValue(props)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
