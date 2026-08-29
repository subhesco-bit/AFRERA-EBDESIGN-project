/**
 * M359100_INSURANCE Frontend Entry Point
 * Migrated from InsurancePage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import Insurance from './pages/InsurancePage.jsx';

// Module-specific store
export const useInsuranceStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m359100_insurance/read/${id}`);
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
    path: '/m359100_insurance',
    component: Insurance,
    exact: true
  },
  {
    path: '/m359100_insurance/:id',
    component: Insurance,
    exact: true
  }
];

// Main export
export default {
  Component: Insurance,
  store: useInsuranceStore,
  routes: moduleRoutes
};
