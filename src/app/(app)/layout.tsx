'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

// Note: Auth check is handled by middleware -- if user reaches this layout,
// they are authenticated with an org. We pass display info from a client-side hook.
// In a real production app, this would fetch from server. For now, we use a
// simple client approach since middleware already guards access.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        userDisplayName=""
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex">
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6 lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  )
}
