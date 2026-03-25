'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Combined Realtime subscription for dashboard.
 * Single channel with three .on() calls for loads, dispatches, and invoices tables.
 * Triggers router.refresh() on any change to re-render server components.
 *
 * NOTE: Supabase client is created once via useRef to avoid infinite
 * re-subscription loops (do NOT include supabase in useEffect deps).
 */
export function useRealtimeDashboard(orgId: string | null) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!orgId) return

    const supabase = supabaseRef.current
    const handleChange = () => router.refresh()

    const channel: RealtimeChannel = supabase
      .channel(`org:${orgId}:dashboard`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads',
          filter: `org_id=eq.${orgId}`,
        },
        handleChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatches',
          filter: `org_id=eq.${orgId}`,
        },
        handleChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `org_id=eq.${orgId}`,
        },
        handleChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proactive_alerts',
          filter: `org_id=eq.${orgId}`,
        },
        handleChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, router])
}
