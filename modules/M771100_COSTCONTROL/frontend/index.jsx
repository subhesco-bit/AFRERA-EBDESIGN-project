/**
 * M771100_COSTCONTROL Frontend Entry Point
 * Migrated from CostControlPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import CostControl from './pages/CostControlPage.jsx';

// Module-specific store
export const useCostControlStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m771100_costcontrol/read/${id}`);
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
    path: '/m771100_costcontrol',
    component: CostControl,
    exact: true
  },
  {
    path: '/m771100_costcontrol/:id',
    component: CostControl,
    exact: true
  }
];

// Main export
export default {
  Component: CostControl,
  store: useCostControlStore,
  routes: moduleRoutes
};
