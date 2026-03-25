'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Menu } from 'lucide-react'

interface AppHeaderProps {
  userDisplayName: string
  onMenuToggle?: () => void
}

export function AppHeader({ userDisplayName, onMenuToggle }: AppHeaderProps) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <span className="text-xl font-bold text-primary">Manifest</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">
          {userDisplayName}
        </span>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">
            {signingOut ? 'Signing out...' : 'Sign out'}
          </span>
        </button>
      </div>
    </header>
  )
}
