/**
 * M445100_VILLAGEPROFILE Frontend Entry Point
 * Migrated from VillageRegistryPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import VillageRegistry from './pages/VillageRegistryPage.jsx';

// Module-specific store
export const useVillageRegistryStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m445100_villageprofile/read/${id}`);
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
    path: '/m445100_villageprofile',
    component: VillageRegistry,
    exact: true
  },
  {
    path: '/m445100_villageprofile/:id',
    component: VillageRegistry,
    exact: true
  }
];

// Main export
export default {
  Component: VillageRegistry,
  store: useVillageRegistryStore,
  routes: moduleRoutes
};
