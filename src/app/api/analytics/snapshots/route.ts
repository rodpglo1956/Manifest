import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get org_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Parse days parameter (default 30, max 90)
  const searchParams = request.nextUrl.searchParams
  const daysParam = parseInt(searchParams.get('days') ?? '30', 10)
  const days = Math.min(Math.max(daysParam || 30, 1), 90)

  // Calculate start date
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data: snapshots, error } = await supabase
    .from('daily_snapshots')
    .select('*')
    .eq('org_id', profile.org_id)
    .gte('snapshot_date', startDateStr)
    .order('snapshot_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }

  return NextResponse.json({ snapshots: snapshots ?? [] })
}
