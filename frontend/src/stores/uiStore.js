import { create } from 'zustand';

/**
 * UI Store (Zustand)
 * Manages UI state
 */
const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  loading: false,
  modalOpen: false,
  modalContent: null,

  // Actions - Setters
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setTheme: (theme) => set({ theme }),
  setNotifications: (notifications) => set({ notifications }),
  setLoading: (loading) => set({ loading }),
  setModalOpen: (modalOpen) => set({ modalOpen }),
  setModalContent: (modalContent) => set({ modalContent }),

  // Actions - Toggle
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  // Actions - Add notification
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }]
  })),

  // Actions - Remove notification
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  // Actions - Clear
  clearNotifications: () => set({ notifications: [] })
}));

export default useUIStore;