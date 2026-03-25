'use server'

import { createClient } from '@/lib/supabase/server'

// ============================================================
// Auth helper
// ============================================================

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const, supabase, orgId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organization found' as const, supabase, orgId: null }

  return { error: null, supabase, orgId: profile.org_id }
}

// ============================================================
// Report types
// ============================================================

export type ReportType = 'pnl' | 'fleet' | 'compliance' | 'driver'

export type ReportHistoryItem = {
  name: string
  reportType: string
  dateRange: string
  createdAt: string
  url: string
}

export type GenerateReportResult = {
  error: string | null
  url: string | null
  filename: string | null
  generated_at: string | null
}

// ============================================================
// Report history
// ============================================================

const REPORT_TYPE_LABELS: Record<string, string> = {
  pnl: 'P&L Statement',
  fleet: 'Fleet Summary',
  compliance: 'Compliance Report',
  driver: 'Driver Performance',
}

function parseReportFilename(name: string): { type: string; dateRange: string } {
  // Format: pnl_2024-01-01_2024-03-31.pdf
  const match = name.match(/^(pnl|fleet|compliance|driver)_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.pdf$/)
  if (!match) return { type: 'Report', dateRange: '' }
  return {
    type: REPORT_TYPE_LABELS[match[1]] ?? match[1],
    dateRange: `${match[2]} to ${match[3]}`,
  }
}

export async function getReportHistory(): Promise<{
  error: string | null
  reports: ReportHistoryItem[]
}> {
  const { error, supabase, orgId } = await getAuthContext()
  if (error || !orgId) return { error: error ?? 'Unauthorized', reports: [] }

  const { data: files, error: listError } = await supabase.storage
    .from('reports')
    .list(orgId, {
      sortBy: { column: 'created_at', order: 'desc' },
      limit: 50,
    })

  if (listError) {
    return { error: null, reports: [] }
  }

  // Generate signed URLs for each file
  const reports: ReportHistoryItem[] = []
  for (const file of files ?? []) {
    if (!file.name.endsWith('.pdf')) continue

    const { data: signedUrlData } = await supabase.storage
      .from('reports')
      .createSignedUrl(`${orgId}/${file.name}`, 3600)

    const parsed = parseReportFilename(file.name)
    reports.push({
      name: file.name,
      reportType: parsed.type,
      dateRange: parsed.dateRange,
      createdAt: file.created_at ?? new Date().toISOString(),
      url: signedUrlData?.signedUrl ?? '',
    })
  }

  return { error: null, reports }
}

// ============================================================
// Generate report (server action wrapper)
// ============================================================

export async function generateReport(
  type: ReportType,
  startDate: string,
  endDate: string
): Promise<GenerateReportResult> {
  try {
    // Call the API route internally via fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_type: type,
        start_date: startDate,
        end_date: endDate,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Generation failed' }))
      return { error: err.error ?? 'Failed to generate report', url: null, filename: null, generated_at: null }
    }

    const result = await response.json()
    return {
      error: null,
      url: result.url,
      filename: result.filename,
      generated_at: result.generated_at,
    }
  } catch (err) {
    console.error('Report generation error:', err)
    return { error: 'Failed to generate report', url: null, filename: null, generated_at: null }
  }
}
