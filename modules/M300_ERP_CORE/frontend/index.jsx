/**
 * M300_ERP_CORE Frontend Entry Point
 * Migrated from ERPDashboard.jsx
 */

import React from 'react';
import { create } from 'zustand';
import ERPDashboard from './pages/ERPDashboard.jsx';

// Module-specific store
export const useERPDashboardStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m300_erp_core/read/${id}`);
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
    path: '/m300_erp_core',
    component: ERPDashboard,
    exact: true
  },
  {
    path: '/m300_erp_core/:id',
    component: ERPDashboard,
    exact: true
  }
];

// Main export
export default {
  Component: ERPDashboard,
  store: useERPDashboardStore,
  routes: moduleRoutes
};
