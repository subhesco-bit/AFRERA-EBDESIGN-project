/**
 * M746100_ANALYTICS Frontend Entry Point
 * Migrated from AnalyticsPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import Analytics from './pages/AnalyticsPage.jsx';

// Module-specific store
export const useAnalyticsStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m746100_analytics/read/${id}`);
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
    path: '/m746100_analytics',
    component: Analytics,
    exact: true
  },
  {
    path: '/m746100_analytics/:id',
    component: Analytics,
    exact: true
  }
];

// Main export
export default {
  Component: Analytics,
  store: useAnalyticsStore,
  routes: moduleRoutes
};
