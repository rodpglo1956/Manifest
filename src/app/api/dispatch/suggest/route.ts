// Smart routing suggestion API endpoint
// POST /api/dispatch/suggest - accepts { load_id }, returns { suggestions }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreDriversForLoad } from '@/lib/routing/scoring'
import type { Load } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let loadId: string
  try {
    const body = await request.json()
    loadId = body.load_id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!loadId || typeof loadId !== 'string') {
    return NextResponse.json({ error: 'load_id is required' }, { status: 400 })
  }

  // Fetch load
  const { data: load } = await supabase
    .from('loads')
    .select('*')
    .eq('id', loadId)
    .single()

  if (!load) {
    return NextResponse.json({ error: 'Load not found' }, { status: 404 })
  }

  const suggestions = await scoreDriversForLoad(supabase, load as Load)

  return NextResponse.json({ suggestions })
}
