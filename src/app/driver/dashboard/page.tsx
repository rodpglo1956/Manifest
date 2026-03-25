import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Driver Dashboard | Manifest',
}

export default function DriverDashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-700">No active loads</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your assigned loads will appear here.
        </p>
      </div>
    </div>
  )
}
