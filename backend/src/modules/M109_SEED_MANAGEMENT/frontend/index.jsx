/**
 * M109_SEED_MANAGEMENT Frontend Entry Point
 * Migrated from SeedVaultPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import SeedVault from './pages/SeedVaultPage.jsx';

// Module-specific store
export const useSeedVaultStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m109_seed_management/read/${id}`);
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
    path: '/m109_seed_management',
    component: SeedVault,
    exact: true
  },
  {
    path: '/m109_seed_management/:id',
    component: SeedVault,
    exact: true
  }
];

// Main export
export default {
  Component: SeedVault,
  store: useSeedVaultStore,
  routes: moduleRoutes
};
