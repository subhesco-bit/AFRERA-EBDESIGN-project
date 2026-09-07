/**
 * M77100_WATERMANAGEMENT Frontend Entry Point
 * Migrated from WaterManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import WaterManagement from './pages/WaterManagementPage.jsx';

// Module-specific store
export const useWaterManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m77100_watermanagement/read/${id}`);
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
    path: '/m77100_watermanagement',
    component: WaterManagement,
    exact: true
  },
  {
    path: '/m77100_watermanagement/:id',
    component: WaterManagement,
    exact: true
  }
];

// Main export
export default {
  Component: WaterManagement,
  store: useWaterManagementStore,
  routes: moduleRoutes
};
