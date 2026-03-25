'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Navigation,
  FileText,
  Shield,
  Settings,
  Wrench,
  Fuel,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Building2,
  Route,
  MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  subItems?: { href: string; label: string; icon: LucideIcon }[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '/loads', label: 'Loads', icon: Package, active: true },
  { href: '/drivers', label: 'Drivers', icon: Users, active: true },
  {
    href: '/fleet',
    label: 'Fleet',
    icon: Truck,
    active: true,
    subItems: [
      { href: '/fleet', label: 'Vehicles', icon: Truck },
      { href: '/fleet/dashboard', label: 'Dashboard', icon: BarChart3 },
      { href: '/fleet/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/fleet/fuel', label: 'Fuel', icon: Fuel },
    ],
  },
  { href: '/dispatch', label: 'Dispatch', icon: Navigation, active: true },
  { href: '/invoices', label: 'Invoices', icon: FileText, active: true },
  { href: '/compliance', label: 'Compliance', icon: Shield, active: true },
  {
    href: '/crm',
    label: 'CRM',
    icon: Building2,
    active: true,
    subItems: [
      { href: '/crm', label: 'Dashboard', icon: BarChart3 },
      { href: '/crm/companies', label: 'Companies', icon: Building2 },
      { href: '/crm/lanes', label: 'Lanes', icon: Route },
      { href: '/crm/activities', label: 'Activities', icon: MessageSquare },
    ],
  },
  { href: '/settings/team', label: 'Settings', icon: Settings, active: true },
]

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Auto-expand fleet group if on a fleet page
    const initial = new Set<string>()
    if (pathname.startsWith('/fleet')) {
      initial.add('Fleet')
    }
    if (pathname.startsWith('/crm')) {
      initial.add('CRM')
    }
    return initial
  })

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  function isSubItemActive(href: string): boolean {
    // Exact match for /fleet (Vehicles) and /crm (Dashboard), prefix match for others
    if (href === '/fleet') {
      return pathname === '/fleet' || pathname.startsWith('/fleet/') && pathname.match(/^\/fleet\/[a-f0-9-]+/) !== null
    }
    if (href === '/crm') {
      return pathname === '/crm'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-14 left-0 bottom-0 w-60 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active && pathname.startsWith(item.href)
            const isDisabled = !item.active
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedGroups.has(item.label)

            if (isDisabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 cursor-default"
                  title="Coming soon"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-gray-300">Soon</span>
                </div>
              )
            }

            if (hasSubItems) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-light text-primary font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                    <span>{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {item.subItems!.map((sub) => {
                        const SubIcon = sub.icon
                        const subActive = isSubItemActive(sub.href)
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onClose}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                              subActive
                                ? 'bg-primary-light text-primary font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <SubIcon
                              className={`w-4 h-4 ${subActive ? 'text-primary' : 'text-gray-400'}`}
                            />
                            <span>{sub.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
