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
