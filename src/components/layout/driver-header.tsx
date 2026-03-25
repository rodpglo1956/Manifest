'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, User } from 'lucide-react'

export function DriverHeader() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-1.5 rounded-md hover:bg-gray-100"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <span className="text-lg font-bold text-primary">Manifest</span>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
        aria-label="Profile"
      >
        <User className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  )
}
