/**
 * M74100_OPERATIONSMANAGEMENT Frontend Entry Point
 * Migrated from OperationsManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import OperationsManagement from './pages/OperationsManagementPage.jsx';

// Module-specific store
export const useOperationsManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m74100_operationsmanagement/read/${id}`);
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
    path: '/m74100_operationsmanagement',
    component: OperationsManagement,
    exact: true
  },
  {
    path: '/m74100_operationsmanagement/:id',
    component: OperationsManagement,
    exact: true
  }
];

// Main export
export default {
  Component: OperationsManagement,
  store: useOperationsManagementStore,
  routes: moduleRoutes
};
