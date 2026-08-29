/**
 * M615100_LOGISTICS Frontend Entry Point
 * Migrated from LogisticsPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import Logistics from './pages/LogisticsPage.jsx';

// Module-specific store
export const useLogisticsStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m615100_logistics/read/${id}`);
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
    path: '/m615100_logistics',
    component: Logistics,
    exact: true
  },
  {
    path: '/m615100_logistics/:id',
    component: Logistics,
    exact: true
  }
];

// Main export
export default {
  Component: Logistics,
  store: useLogisticsStore,
  routes: moduleRoutes
};
