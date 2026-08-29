/**
 * M403_AGRICULTURAL_AI Frontend Entry Point
 * Migrated from ClimateAdvisoryPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import ClimateAdvisory from './pages/ClimateAdvisoryPage.jsx';

// Module-specific store
export const useClimateAdvisoryStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m403_agricultural_ai/read/${id}`);
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
    path: '/m403_agricultural_ai',
    component: ClimateAdvisory,
    exact: true
  },
  {
    path: '/m403_agricultural_ai/:id',
    component: ClimateAdvisory,
    exact: true
  }
];

// Main export
export default {
  Component: ClimateAdvisory,
  store: useClimateAdvisoryStore,
  routes: moduleRoutes
};
