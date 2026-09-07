/**
 * M82100_GOAT Frontend Entry Point
 * Migrated from GoatFarmingPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import GoatFarming from './pages/GoatFarmingPage.jsx';

// Module-specific store
export const useGoatFarmingStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m82100_goat/read/${id}`);
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
    path: '/m82100_goat',
    component: GoatFarming,
    exact: true
  },
  {
    path: '/m82100_goat/:id',
    component: GoatFarming,
    exact: true
  }
];

// Main export
export default {
  Component: GoatFarming,
  store: useGoatFarmingStore,
  routes: moduleRoutes
};
