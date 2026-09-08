import { vi } from 'vitest'
import { pushNotificationManager, initializePushNotifications, requestNotificationPermission, getSubscriptionStatus } from '../../utils/pushNotifications'

// Mock navigator and Notification
const mockNavigator = {
  serviceWorker: {
    register: vi.fn(() => Promise.resolve({}))
  }
}

const mockNotification = {
  permission: 'default',
  requestPermission: vi.fn(() => Promise.resolve('granted'))
}

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true
})

Object.defineProperty(global.window, 'PushManager', {
  value: function PushManager() {},
  writable: true
})

describe('Push Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initializePushNotifications', () => {
    it('initializes push notification manager', async () => {
      await initializePushNotifications()

      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('handles unsupported browsers gracefully', async () => {
      // Mock unsupported browser
      const originalServiceWorker = mockNavigator.serviceWorker
      mockNavigator.serviceWorker = undefined

      const result = await initializePushNotifications()

      expect(result).toBe(false)

      // Restore
      mockNavigator.serviceWorker = originalServiceWorker
    })
  })

  describe('requestNotificationPermission', () => {
    it('requests notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValueOnce('granted')

      const result = await requestNotificationPermission()

      expect(mockNotification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('handles denied permission', async () => {
      mockNotification.requestPermission.mockResolvedValueOnce('denied')

      const result = await requestNotificationPermission()

      expect(result).toBe(false)
    })
  })

  describe('getSubscriptionStatus', () => {
    it('returns current subscription status', () => {
      const status = getSubscriptionStatus()

      expect(status).toHaveProperty('isSupported')
      expect(status).toHaveProperty('permission')
      expect(status).toHaveProperty('isSubscribed')
      expect(status).toHaveProperty('subscription')
    })
  })
})
