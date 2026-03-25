'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications/actions'
import type { Notification, NotificationCategory } from '@/types/database'

// Category colors for notification badges
const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  compliance: 'bg-blue-500',
  maintenance: 'bg-orange-500',
  load: 'bg-green-500',
  billing: 'bg-purple-500',
  crm: 'bg-teal-500',
  driver: 'bg-indigo-500',
  system: 'bg-gray-500',
  marie: 'bg-pink-500',
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  compliance: 'Compliance',
  maintenance: 'Maintenance',
  load: 'Load',
  billing: 'Billing',
  crm: 'CRM',
  driver: 'Driver',
  system: 'System',
  marie: 'Marie AI',
}

/**
 * Format a timestamp to a relative time string
 */
function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())

  // Fetch unread count on mount
  useEffect(() => {
    getUnreadCount().then(({ count }) => setUnreadCount(count))
  }, [])

  // Subscribe to realtime notifications
  useEffect(() => {
    const supabase = supabaseRef.current

    // Get user ID for realtime filter
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const channel = supabase
        .channel('notifications-bell')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refresh unread count on new notification
            getUnreadCount().then(({ count }) => setUnreadCount(count))
            // If dropdown is open, refresh the list
            if (isOpen) {
              getNotifications(10).then(({ data }) => {
                if (data) setNotifications(data)
              })
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    })
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDropdown = useCallback(async () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)

    if (nextOpen && notifications.length === 0) {
      setLoading(true)
      const { data } = await getNotifications(10)
      if (data) setNotifications(data)
      setLoading(false)
    }
  }, [isOpen, notifications.length])

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications
              </div>
            )}

            {!loading && notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  !n.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category dot */}
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[n.category]}`}
                    title={CATEGORY_LABELS[n.category]}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {/* Unread indicator */}
                  {!n.read && (
                    <span className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
