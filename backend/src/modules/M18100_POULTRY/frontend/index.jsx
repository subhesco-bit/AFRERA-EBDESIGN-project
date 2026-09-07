/**
 * M18100_POULTRY Frontend Entry Point
 * Migrated from PoultryManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import PoultryManagement from './pages/PoultryManagementPage.jsx';

// Module-specific store
export const usePoultryManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m18100_poultry/read/${id}`);
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
    path: '/m18100_poultry',
    component: PoultryManagement,
    exact: true
  },
  {
    path: '/m18100_poultry/:id',
    component: PoultryManagement,
    exact: true
  }
];

// Main export
export default {
  Component: PoultryManagement,
  store: usePoultryManagementStore,
  routes: moduleRoutes
};
