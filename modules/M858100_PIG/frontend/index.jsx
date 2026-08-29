/**
 * M858100_PIG Frontend Entry Point
 * Migrated from PigFarmingPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import PigFarming from './pages/PigFarmingPage.jsx';

// Module-specific store
export const usePigFarmingStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m858100_pig/read/${id}`);
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
    path: '/m858100_pig',
    component: PigFarming,
    exact: true
  },
  {
    path: '/m858100_pig/:id',
    component: PigFarming,
    exact: true
  }
];

// Main export
export default {
  Component: PigFarming,
  store: usePigFarmingStore,
  routes: moduleRoutes
};
