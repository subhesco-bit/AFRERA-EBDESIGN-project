/**
 * M290100_MACHINERYACCESS Frontend Entry Point
 * Migrated from MachineryManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import MachineryManagement from './pages/MachineryManagementPage.jsx';

// Module-specific store
export const useMachineryManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m290100_machineryaccess/read/${id}`);
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
    path: '/m290100_machineryaccess',
    component: MachineryManagement,
    exact: true
  },
  {
    path: '/m290100_machineryaccess/:id',
    component: MachineryManagement,
    exact: true
  }
];

// Main export
export default {
  Component: MachineryManagement,
  store: useMachineryManagementStore,
  routes: moduleRoutes
};
