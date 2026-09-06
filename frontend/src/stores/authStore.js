import { create } from 'zustand';

/**
 * Auth Store (Zustand)
 * Manages authentication state
 */
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Actions - Setters
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Actions - Login
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      // TODO: Call auth service
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      
      if (data.success) {
        set({ 
          user: data.user, 
          token: data.accessToken, 
          isAuthenticated: true,
          loading: false 
        });
        localStorage.setItem('token', data.accessToken);
        return { success: true };
      } else {
        set({ error: data.error, loading: false });
        return { success: false, error: data.error };
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actions - Logout
  logout: () => {
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      error: null 
    });
    localStorage.removeItem('token');
  },

  // Actions - Clear
  clear: () => set({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  })
}));

export default useAuthStore;