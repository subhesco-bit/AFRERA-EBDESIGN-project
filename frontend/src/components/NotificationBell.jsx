import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { notificationAPI } from '../services/api'

// Real UI consumer for the M010 notification system (notificationAPI in
// services/api.js) — previously fully built on the backend (13 methods,
// live-mounted at /api/v1/modules/m010/*) with zero frontend caller.
// Polls for the current user's notifications and lets them mark items read.
function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await notificationAPI.getNotifications({ userId: user.id, limit: 20 })
      setNotifications(res.data?.data?.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch on mount and poll every 60s for logged-in users only.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.id, loadNotifications])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (err) {
      setError(err.message || 'Failed to mark notification read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications read')
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 text-v42-paddy/90 hover:text-v42-turmeric transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => {
          setOpen((v) => !v)
          if (!open) loadNotifications()
        }}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {loading && <div className="px-4 py-6 text-center text-sm text-gray-500">Loading...</div>}
          {error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}

          {!loading && !error && notifications.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-gray-50 last:border-0 flex items-start justify-between gap-2 ${
                  n.read ? '' : 'bg-green-50/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{n.title}</div>
                  <div className="text-xs text-gray-600 line-clamp-2">{n.message}</div>
                  {n.created_at && (
                    <div className="text-[11px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    aria-label="Mark as read"
                    className="shrink-0 p-1 text-gray-400 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
