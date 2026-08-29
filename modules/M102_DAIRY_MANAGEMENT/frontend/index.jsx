/**
 * M102_DAIRY_MANAGEMENT Frontend Entry Point
 * Migrated from DairyManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import DairyManagement from './pages/DairyManagementPage.jsx';

// Module-specific store
export const useDairyManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m102_dairy_management/read/${id}`);
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
    path: '/m102_dairy_management',
    component: DairyManagement,
    exact: true
  },
  {
    path: '/m102_dairy_management/:id',
    component: DairyManagement,
    exact: true
  }
];

// Main export
export default {
  Component: DairyManagement,
  store: useDairyManagementStore,
  routes: moduleRoutes
};
