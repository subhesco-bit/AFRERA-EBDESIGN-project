/**
 * M501100_IDENTITYMANAGEMENT Frontend Entry Point
 * Migrated from IdentityManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import IdentityManagement from './pages/IdentityManagementPage.jsx';

// Module-specific store
export const useIdentityManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m501100_identitymanagement/read/${id}`);
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
    path: '/m501100_identitymanagement',
    component: IdentityManagement,
    exact: true
  },
  {
    path: '/m501100_identitymanagement/:id',
    component: IdentityManagement,
    exact: true
  }
];

// Main export
export default {
  Component: IdentityManagement,
  store: useIdentityManagementStore,
  routes: moduleRoutes
};
