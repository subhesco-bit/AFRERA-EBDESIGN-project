/**
 * M104_SOIL_MANAGEMENT Frontend Entry Point
 * Migrated from SoilManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import SoilManagement from './pages/SoilManagementPage.jsx';

// Module-specific store
export const useSoilManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m104_soil_management/read/${id}`);
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
    path: '/m104_soil_management',
    component: SoilManagement,
    exact: true
  },
  {
    path: '/m104_soil_management/:id',
    component: SoilManagement,
    exact: true
  }
];

// Main export
export default {
  Component: SoilManagement,
  store: useSoilManagementStore,
  routes: moduleRoutes
};
