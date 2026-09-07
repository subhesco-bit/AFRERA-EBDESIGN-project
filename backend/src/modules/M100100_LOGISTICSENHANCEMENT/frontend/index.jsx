/**
 * M100100_LOGISTICSENHANCEMENT Frontend Entry Point
 * Migrated from LogisticsProviderPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import LogisticsProvider from './pages/LogisticsProviderPage.jsx';

// Module-specific store
export const useLogisticsProviderStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m100100_logisticsenhancement/read/${id}`);
      const result = await response.json();
      if (result.success) {
        set({ data: result.data, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  clearError: () => set({ error: null }),
  clearData: () => set({ data: null })
}));

// Module routes configuration
export const moduleRoutes = [
  {
    path: '/m100100_logisticsenhancement',
    component: LogisticsProvider,
    exact: true
  },
  {
    path: '/m100100_logisticsenhancement/:id',
    component: LogisticsProvider,
    exact: true
  }
];

// Main export
export default {
  Component: LogisticsProvider,
  store: useLogisticsProviderStore,
  routes: moduleRoutes
};
