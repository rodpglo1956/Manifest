import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Load } from '@/types/database'
import { StatusBadge } from '@/components/ui/status-badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Package } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Load Detail | Manifest',
}

interface DriverLoadDetailProps {
  params: Promise<{ id: string }>
}

export default async function DriverLoadDetailPage({ params }: DriverLoadDetailProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get driver record
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    notFound()
  }

  // Fetch load, verifying driver assignment
  const { data: load } = await supabase
    .from('loads')
    .select('*')
    .eq('id', id)
    .eq('driver_id', driver.id)
    .single() as { data: Load | null }

  if (!load) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <Link
        href="/driver/loads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Loads
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
          <p className="text-xl font-mono font-bold">
            {load.load_number || load.id.slice(0, 8)}
          </p>
          <StatusBadge status={load.status} variant="load" />
        </div>

        <div className="p-5 space-y-5">
          {/* Route */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Pickup</p>
                <p className="font-semibold text-gray-900">
                  {[load.pickup_city, load.pickup_state].filter(Boolean).join(', ') || 'TBD'}
                </p>
                {load.pickup_address && (
                  <p className="text-sm text-gray-600">{load.pickup_address}</p>
                )}
                {(load.pickup_date || load.pickup_time) && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {load.pickup_date && new Date(load.pickup_date).toLocaleDateString()}
                    {load.pickup_time && ` ${load.pickup_time}`}
                  </p>
                )}
                {load.pickup_contact_name && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Contact: {load.pickup_contact_name}
                    {load.pickup_contact_phone && ` - ${load.pickup_contact_phone}`}
                  </p>
                )}
                {load.pickup_notes && (
                  <p className="text-sm text-gray-400 mt-0.5 italic">{load.pickup_notes}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Delivery</p>
                <p className="font-semibold text-gray-900">
                  {[load.delivery_city, load.delivery_state].filter(Boolean).join(', ') || 'TBD'}
                </p>
                {load.delivery_address && (
                  <p className="text-sm text-gray-600">{load.delivery_address}</p>
                )}
                {(load.delivery_date || load.delivery_time) && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {load.delivery_date && new Date(load.delivery_date).toLocaleDateString()}
                    {load.delivery_time && ` ${load.delivery_time}`}
                  </p>
                )}
                {load.delivery_contact_name && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Contact: {load.delivery_contact_name}
                    {load.delivery_contact_phone && ` - ${load.delivery_contact_phone}`}
                  </p>
                )}
                {load.delivery_notes && (
                  <p className="text-sm text-gray-400 mt-0.5 italic">{load.delivery_notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Freight info */}
          {(load.commodity || load.equipment_type || load.weight) && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">
                Freight
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {load.commodity && (
                  <div>
                    <span className="text-gray-500">Commodity:</span>{' '}
                    <span className="text-gray-900">{load.commodity}</span>
                  </div>
                )}
                {load.equipment_type && (
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-900">{load.equipment_type.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {load.weight && (
                  <div>
                    <span className="text-gray-500">Weight:</span>{' '}
                    <span className="text-gray-900">
                      {load.weight.toLocaleString()} {load.weight_unit || 'lbs'}
                    </span>
                  </div>
                )}
                {load.pieces && (
                  <div>
                    <span className="text-gray-500">Pieces:</span>{' '}
                    <span className="text-gray-900">{load.pieces}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">
              Documents
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">BOL:</span>
                <span className={load.bol_url ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {load.bol_url ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">POD:</span>
                <span className={load.pod_url ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {load.pod_url ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
