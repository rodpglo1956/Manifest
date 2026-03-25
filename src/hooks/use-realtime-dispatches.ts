'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to Supabase Realtime changes on the dispatches table for a given org.
 * Triggers router.refresh() on any change to re-render server components.
 *
 * NOTE: Supabase client is created once via useRef to avoid infinite
 * re-subscription loops (do NOT include supabase in useEffect deps).
 */
export function useRealtimeDispatches(orgId: string | null) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!orgId) return

    const supabase = supabaseRef.current

    const channel: RealtimeChannel = supabase
      .channel(`org:${orgId}:dispatch`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatches',
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, router])
}
