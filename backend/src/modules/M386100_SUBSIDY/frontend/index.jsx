/**
 * M386100_SUBSIDY Frontend Entry Point
 * Migrated from SubsidyManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import SubsidyManagement from './pages/SubsidyManagementPage.jsx';

// Module-specific store
export const useSubsidyManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m386100_subsidy/read/${id}`);
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
    path: '/m386100_subsidy',
    component: SubsidyManagement,
    exact: true
  },
  {
    path: '/m386100_subsidy/:id',
    component: SubsidyManagement,
    exact: true
  }
];

// Main export
export default {
  Component: SubsidyManagement,
  store: useSubsidyManagementStore,
  routes: moduleRoutes
};
