/**
 * M101_LIVESTOCK_MANAGEMENT Frontend Entry Point
 * Migrated from LivestockManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import LivestockManagement from './pages/LivestockManagementPage.jsx';

// Module-specific store
export const useLivestockManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m101_livestock_management/read/${id}`);
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
    path: '/m101_livestock_management',
    component: LivestockManagement,
    exact: true
  },
  {
    path: '/m101_livestock_management/:id',
    component: LivestockManagement,
    exact: true
  }
];

// Main export
export default {
  Component: LivestockManagement,
  store: useLivestockManagementStore,
  routes: moduleRoutes
};
