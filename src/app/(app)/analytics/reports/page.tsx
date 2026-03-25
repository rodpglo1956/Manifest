'use client'

import { useState, useEffect, useTransition } from 'react'
import { FileText, Download, Loader2, Calendar } from 'lucide-react'
import { getReportHistory, generateReport } from '@/lib/reports/actions'
import type { ReportType, ReportHistoryItem } from '@/lib/reports/actions'
// ============================================================
// Quick date range helpers
// ============================================================

function getQuickRange(preset: string): { start: string; end: string } {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  switch (preset) {
    case 'this-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: start.toISOString().slice(0, 10), end: today }
    }
    case 'last-month': {
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
    }
    case 'this-quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), q * 3, 1)
      return { start: start.toISOString().slice(0, 10), end: today }
    }
    case 'last-quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const end = new Date(now.getFullYear(), q * 3, 0)
      const start = new Date(end.getFullYear(), Math.floor(end.getMonth() / 3) * 3, 1)
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
    }
    case 'ytd': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: start.toISOString().slice(0, 10), end: today }
    }
    default:
      return { start: today, end: today }
  }
}

// ============================================================
// Report type options
// ============================================================

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'pnl', label: 'P&L Statement' },
  { value: 'fleet', label: 'Fleet Summary' },
  { value: 'compliance', label: 'Compliance Report' },
  { value: 'driver', label: 'Driver Performance' },
]

const QUICK_RANGES = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'ytd', label: 'Year to Date' },
]

// ============================================================
// Page Component
// ============================================================

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('pnl')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [history, setHistory] = useState<ReportHistoryItem[]>([])
  const [generating, startGenerate] = useTransition()
  const [loading, startLoad] = useTransition()
  const [toast, setToast] = useState<{ message: string; url?: string } | null>(null)

  // Load report history on mount
  useEffect(() => {
    startLoad(async () => {
      const result = await getReportHistory()
      if (!result.error) {
        setHistory(result.reports)
      }
    })
  }, [])

  // Set default dates to this month
  useEffect(() => {
    const range = getQuickRange('this-month')
    setStartDate(range.start)
    setEndDate(range.end)
  }, [])

  function handleQuickRange(preset: string) {
    const range = getQuickRange(preset)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  function handleGenerate() {
    if (!startDate || !endDate) return
    startGenerate(async () => {
      const result = await generateReport(reportType, startDate, endDate)
      if (result.error) {
        setToast({ message: `Error: ${result.error}` })
      } else {
        setToast({ message: 'Report generated successfully!', url: result.url ?? undefined })
        // Refresh history
        const historyResult = await getReportHistory()
        if (!historyResult.error) setHistory(historyResult.reports)
      }
      setTimeout(() => setToast(null), 8000)
    })
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 shadow-lg rounded-lg p-4 max-w-sm">
          <p className="text-sm text-gray-900">{toast.message}</p>
          {toast.url && (
            <a
              href={toast.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline mt-1 inline-block"
            >
              Download Report
            </a>
          )}
        </div>
      )}

      {/* Generate Report Form */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Generate Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Quick Range Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_RANGES.map((qr) => (
            <button
              key={qr.value}
              onClick={() => handleQuickRange(qr.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Calendar className="w-3 h-3 inline mr-1" />
              {qr.label}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !startDate || !endDate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate PDF Report
            </>
          )}
        </button>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report History</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No reports generated yet. Select a report type and date range above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Report Type</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Date Range</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Generated At</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Download</th>
                </tr>
              </thead>
              <tbody>
                {history.map((report) => (
                  <tr key={report.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{report.reportType}</td>
                    <td className="py-3 px-2 text-gray-600">{report.dateRange}</td>
                    <td className="py-3 px-2 text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {report.url ? (
                        <a
                          href={report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
