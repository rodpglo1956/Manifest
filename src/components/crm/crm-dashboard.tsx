'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  FileText,
  Clock,
  UserPlus,
  Check,
} from 'lucide-react'
import { formatCurrency } from '@/lib/crm/helpers'
import { updateActivity } from '@/app/(app)/crm/actions'
import type { getCrmDashboard } from '@/app/(app)/crm/actions'

// ============================================================
// Types inferred from getCrmDashboard return
// ============================================================

type DashboardResult = Awaited<ReturnType<typeof getCrmDashboard>>
type DashboardData = NonNullable<DashboardResult['data']>

interface CrmDashboardProps {
  data: DashboardData
}

// ============================================================
// Stat card component
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ElementType
  bgColor: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`${bgColor} p-2 rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Company type badge
// ============================================================

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-700',
    broker: 'bg-purple-100 text-purple-700',
    vendor: 'bg-gray-100 text-gray-700',
    partner: 'bg-green-100 text-green-700',
    prospect: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-full ${colors[type] ?? 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  )
}

// ============================================================
// Days remaining color
// ============================================================

function getDaysRemaining(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const diff = new Date(expiryDate).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDaysColor(days: number | null): string {
  if (days === null) return 'text-gray-500'
  if (days < 7) return 'text-red-600 font-semibold'
  if (days < 14) return 'text-yellow-600'
  return 'text-gray-500'
}

// ============================================================
// Pay performance color
// ============================================================

function getPayColor(days: number | null): string {
  if (days === null) return 'text-gray-500'
  if (days < 30) return 'text-green-600'
  if (days <= 45) return 'text-yellow-600'
  return 'text-red-600'
}

// ============================================================
// Main dashboard component
// ============================================================

export function CrmDashboard({ data }: CrmDashboardProps) {
  const totalRevenue = data.topCompanies.reduce((sum, c) => sum + (c.total_revenue ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CRM Dashboard</h1>
        <Link
          href="/crm/companies?addCompany=true"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Company
        </Link>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Active Agreements"
          value={String(data.expiringAgreements.length)}
          icon={FileText}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Pending Follow-ups"
          value={String(data.pendingFollowUps)}
          icon={Clock}
          bgColor="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          label="New Prospects"
          value={String(data.prospectCount)}
          icon={UserPlus}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content: Revenue + Expiring Agreements */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue by Company (60%) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Revenue by Company (Top 10)</h2>
          {data.topCompanies.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No company revenue data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topCompanies.map((company, i) => {
                const maxRevenue = data.topCompanies[0]?.total_revenue ?? 1
                const pct = maxRevenue > 0 ? ((company.total_revenue ?? 0) / maxRevenue) * 100 : 0
                return (
                  <div key={company.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/crm/companies/${company.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary truncate"
                        >
                          {company.name}
                        </Link>
                        <TypeBadge type={company.company_type} />
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(company.total_revenue ?? 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Expiring Rate Agreements (40%) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Expiring Rate Agreements</h2>
          {data.expiringAgreements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No agreements expiring soon.</p>
          ) : (
            <div className="space-y-3">
              {data.expiringAgreements.map(agreement => {
                const daysLeft = getDaysRemaining(agreement.expiry_date)
                const daysColor = getDaysColor(daysLeft)
                return (
                  <div key={agreement.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {agreement.company_name ?? 'Unknown Company'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatCurrency(agreement.rate_amount)} ({agreement.rate_type})
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-xs ${daysColor}`}>
                          {daysLeft !== null ? `${daysLeft}d left` : '--'}
                        </p>
                        <p className="text-xs text-gray-400">{agreement.expiry_date}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Broker Pay Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Broker Pay Performance (Fastest Payers)</h2>
        {data.brokerPayPerformance.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No broker payment data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-500 pr-4">#</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 pr-4">Broker</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 pr-4">Avg Days to Pay</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 pr-4">Total Loads</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.brokerPayPerformance.map((broker, i) => (
                  <tr key={broker.id} className="border-b border-gray-50">
                    <td className="py-2 text-xs text-gray-400 pr-4">{i + 1}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/crm/companies/${broker.id}`}
                        className="font-medium text-gray-900 hover:text-primary"
                      >
                        {broker.name}
                      </Link>
                    </td>
                    <td className={`py-2 text-right pr-4 font-semibold ${getPayColor(broker.days_to_pay)}`}>
                      {broker.days_to_pay ?? '--'} days
                    </td>
                    <td className="py-2 text-right pr-4 text-gray-600">
                      {broker.total_loads ?? 0}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {formatCurrency(broker.total_revenue ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
