'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Navigation,
  FileText,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '/loads', label: 'Loads', icon: Package, active: true },
  { href: '/drivers', label: 'Drivers', icon: Users, active: true },
  { href: '/fleet', label: 'Fleet', icon: Truck, active: true },
  { href: '/dispatch', label: 'Dispatch', icon: Navigation, active: true },
  { href: '#', label: 'Invoices', icon: FileText, active: false, comingSoon: true },
  { href: '/settings/team', label: 'Settings', icon: Settings, active: true },
]

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname()

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
