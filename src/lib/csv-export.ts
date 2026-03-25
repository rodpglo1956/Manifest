import type { Load } from '@/types/database'

const CSV_HEADERS = [
  'Load #',
  'Status',
  'Pickup Company',
  'Pickup City/State',
  'Pickup Date',
  'Delivery Company',
  'Delivery City/State',
  'Delivery Date',
  'Driver',
  'Revenue',
  'Broker',
] as const

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

type LoadWithDriver = Load & {
  driver_first_name?: string | null
  driver_last_name?: string | null
}

/**
 * Generate a CSV string from an array of loads and trigger a browser download.
 */
export function exportLoadsToCSV(loads: LoadWithDriver[]): void {
  const headerLine = CSV_HEADERS.map((h) => escapeCSV(h)).join(',')

  const rows = loads.map((load) => {
    const pickupLocation = [load.pickup_city, load.pickup_state]
      .filter(Boolean)
      .join(', ')
    const deliveryLocation = [load.delivery_city, load.delivery_state]
      .filter(Boolean)
      .join(', ')
    const driver = load.driver_first_name
      ? `${load.driver_first_name} ${load.driver_last_name ?? ''}`.trim()
      : ''
    const revenue =
      load.total_charges !== null && load.total_charges !== undefined
        ? load.total_charges.toFixed(2)
        : ''

    return [
      load.load_number ?? '',
      load.status,
      load.pickup_city ?? '',
      pickupLocation,
      load.pickup_date ?? '',
      load.delivery_city ?? '',
      deliveryLocation,
      load.delivery_date ?? '',
      driver,
      revenue,
      load.broker_name ?? '',
    ]
      .map((v) => escapeCSV(v))
      .join(',')
  })

  const csv = [headerLine, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `loads-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
