/**
 * M103_FISHERIES_MANAGEMENT Frontend Entry Point
 * Migrated from FisheriesManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import FisheriesManagement from './pages/FisheriesManagementPage.jsx';

// Module-specific store
export const useFisheriesManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m103_fisheries_management/read/${id}`);
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
    path: '/m103_fisheries_management',
    component: FisheriesManagement,
    exact: true
  },
  {
    path: '/m103_fisheries_management/:id',
    component: FisheriesManagement,
    exact: true
  }
];

// Main export
export default {
  Component: FisheriesManagement,
  store: useFisheriesManagementStore,
  routes: moduleRoutes
};
