'use client'

import { DriverHeader } from '@/components/layout/driver-header'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Navigation, Package, Settings } from 'lucide-react'

const bottomNavItems = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/dispatch', label: 'Dispatch', icon: Navigation },
  { href: '/driver/loads', label: 'Loads', icon: Package },
  { href: '/driver/settings', label: 'Settings', icon: Settings },
]

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DriverHeader />
      <main className="flex-1 p-4 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href) && item.href !== '#'
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
