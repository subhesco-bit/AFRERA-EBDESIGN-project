/**
 * M652100_GOVERNMENTSCHEME Frontend Entry Point
 * Migrated from GovernmentDashboardPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import GovernmentDashboard from './pages/GovernmentDashboardPage.jsx';

// Module-specific store
export const useGovernmentDashboardStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m652100_governmentscheme/read/${id}`);
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
    path: '/m652100_governmentscheme',
    component: GovernmentDashboard,
    exact: true
  },
  {
    path: '/m652100_governmentscheme/:id',
    component: GovernmentDashboard,
    exact: true
  }
];

// Main export
export default {
  Component: GovernmentDashboard,
  store: useGovernmentDashboardStore,
  routes: moduleRoutes
};
