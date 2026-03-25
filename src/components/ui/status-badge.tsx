type StatusVariant = 'driver' | 'vehicle' | 'load' | 'dispatch' | 'invoice' | 'compliance' | 'inspection'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
}

const colorMap: Record<StatusVariant, Record<string, { dot: string; bg: string; text: string }>> = {
  driver: {
    active: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    inactive: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    terminated: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  },
  vehicle: {
    active: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    in_shop: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    out_of_service: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    parked: { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
    sold: { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
    totaled: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  },
  load: {
    booked: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    dispatched: { dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    in_transit: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
    at_pickup: { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    loaded: { dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
    at_delivery: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    delivered: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    invoiced: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
    paid: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    canceled: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  },
  dispatch: {
    assigned: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    accepted: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    en_route_pickup: { dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    at_pickup: { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    en_route_delivery: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
    at_delivery: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    completed: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    rejected: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  },
  invoice: {
    draft: { dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' },
    sent: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    paid: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    overdue: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    void: { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-500' },
  },
  compliance: {
    upcoming: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    due_soon: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    overdue: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    completed: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    waived: { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
    not_applicable: { dot: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-500' },
  },
  inspection: {
    pass: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    fail: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    conditional: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  },
}

const defaultColors = { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' }

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusBadge({ status, variant = 'driver' }: StatusBadgeProps) {
  const colors = colorMap[variant]?.[status] ?? defaultColors

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {formatStatusLabel(status)}
    </span>
  )
}
