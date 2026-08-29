/**
 * M200_ORGANIZATION_MANAGEMENT Frontend Entry Point
 * Migrated from PlatformManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import PlatformManagement from './pages/PlatformManagementPage.jsx';

// Module-specific store
export const usePlatformManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m200_organization_management/read/${id}`);
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
    path: '/m200_organization_management',
    component: PlatformManagement,
    exact: true
  },
  {
    path: '/m200_organization_management/:id',
    component: PlatformManagement,
    exact: true
  }
];

// Main export
export default {
  Component: PlatformManagement,
  store: usePlatformManagementStore,
  routes: moduleRoutes
};
