/**
 * M868100_HORTICULTUREMANAGEMENT Frontend Entry Point
 * Migrated from HorticultureManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import HorticultureManagement from './pages/HorticultureManagementPage.jsx';

// Module-specific store
export const useHorticultureManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m868100_horticulturemanagement/read/${id}`);
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
    path: '/m868100_horticulturemanagement',
    component: HorticultureManagement,
    exact: true
  },
  {
    path: '/m868100_horticulturemanagement/:id',
    component: HorticultureManagement,
    exact: true
  }
];

// Main export
export default {
  Component: HorticultureManagement,
  store: useHorticultureManagementStore,
  routes: moduleRoutes
};
