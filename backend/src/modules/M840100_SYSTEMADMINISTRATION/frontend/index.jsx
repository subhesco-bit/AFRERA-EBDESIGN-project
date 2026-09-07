/**
 * M840100_SYSTEMADMINISTRATION Frontend Entry Point
 * Migrated from SystemAdministrationPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import SystemAdministration from './pages/SystemAdministrationPage.jsx';

// Module-specific store
export const useSystemAdministrationStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m840100_systemadministration/read/${id}`);
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
    path: '/m840100_systemadministration',
    component: SystemAdministration,
    exact: true
  },
  {
    path: '/m840100_systemadministration/:id',
    component: SystemAdministration,
    exact: true
  }
];

// Main export
export default {
  Component: SystemAdministration,
  store: useSystemAdministrationStore,
  routes: moduleRoutes
};
