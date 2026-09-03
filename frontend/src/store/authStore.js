import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const demoAccounts = [
  {
    role: 'farmer',
    label: 'Farmer portal',
    email: 'farmer@afrera.local',
    password: 'demo123',
    description: 'Sell produce, monitor fields, and track harvest performance.'
  },
  {
    role: 'buyer',
    label: 'Buyer storefront',
    email: 'buyer@afrera.local',
    password: 'demo123',
    description: 'Browse fresh produce and place orders securely.'
  },
  {
    role: 'banker',
    label: 'Bank / finance',
    email: 'banker@afrera.local',
    password: 'demo123',
    description: 'Review credit, payments, and farmer finance performance.'
  },
  {
    role: 'admin',
    label: 'Platform admin',
    email: 'admin@afrera.local',
    password: 'demo123',
    description: 'Manage platform controls, governance, and operational data.'
  }
]

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      initialized: false,

      initializeAuth: () => {
        set({ loading: true })
        const token = localStorage.getItem('access_token')
        const userStr = localStorage.getItem('user')

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({ user, token, isAuthenticated: true, loading: false, initialized: true })
            return
          } catch (error) {
            console.error('Failed to parse user data:', error)
          }
        }

        set({ user: null, token: null, isAuthenticated: false, loading: false, initialized: true })
      },

      checkAuth: () => get().initializeAuth(),

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken || 'demo-access-token')
        localStorage.setItem('user', JSON.stringify(user))
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        }
        set({ user, token: accessToken || 'demo-access-token', isAuthenticated: true, loading: false })
      },

      loginDemo: (role) => {
        const account = demoAccounts.find((entry) => entry.role === role)
        if (!account) return false

        const demoUser = {
          id: `${role}-demo-user`,
          email: account.email,
          name: role === 'admin' ? 'Platform Administrator' : role === 'farmer' ? 'Farmer Operator' : role === 'banker' ? 'Finance Partner' : 'Buyer Customer',
          role,
          permissions: role === 'admin'
            ? ['manage_users', 'view_admin', 'manage_orders', 'manage_platform']
            : role === 'farmer'
              ? ['view_orders', 'sell produce', 'manage_fields', 'view_finance']
              : role === 'banker'
                ? ['view_finance', 'view_credit', 'manage_repayment']
                : ['view_marketplace', 'place_orders', 'manage_cart'],
          sessionId: `${role}-session`
        }

        get().setAuth(demoUser, `${role}-token`, `${role}-refresh-token`)
        return true
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false, loading: false })
      },

      updateUser: (userData) => {
        const currentUser = get().user
        const updatedUser = { ...currentUser, ...userData }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        set({ user: updatedUser })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
