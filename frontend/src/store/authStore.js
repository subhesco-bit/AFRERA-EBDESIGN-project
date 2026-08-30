import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      initializeAuth: () => {
        const token = localStorage.getItem('access_token')
        const userStr = localStorage.getItem('user')

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({ user, token, isAuthenticated: true })
          } catch (error) {
            console.error('Failed to parse user data:', error)
            set({ user: null, token: null, isAuthenticated: false })
          }
        }
      },

      // Alias for initializeAuth. App.jsx and RouteGuard.jsx both call
      // checkAuth() on mount, but this store never defined it - only
      // initializeAuth existed, so every page load threw
      // "checkAuth is not a function" inside App's own useEffect (which
      // sits above ErrorBoundary in the tree, so nothing caught it) and
      // React unmounted the whole root, producing a blank white page on
      // every load. Root cause of the 2026-08-29 blank-screen incident.
      checkAuth: () => get().initializeAuth(),
      
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('user', JSON.stringify(user))
        if (refreshToken) {
          // Was previously storing accessToken again under this key, which broke
          // token refresh: /auth/refresh rejects an access token because it isn't
          // signed with tokenType: 'refresh', silently logging users out every
          // time their short-lived access token expired.
          localStorage.setItem('refresh_token', refreshToken)
        }
        set({ user, token: accessToken, isAuthenticated: true })
      },
      
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
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
