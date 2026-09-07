/**
 * M499100_SHEEP Frontend Entry Point
 * Migrated from SheepFarmingPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import SheepFarming from './pages/SheepFarmingPage.jsx';

// Module-specific store
export const useSheepFarmingStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m499100_sheep/read/${id}`);
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
    path: '/m499100_sheep',
    component: SheepFarming,
    exact: true
  },
  {
    path: '/m499100_sheep/:id',
    component: SheepFarming,
    exact: true
  }
];

// Main export
export default {
  Component: SheepFarming,
  store: useSheepFarmingStore,
  routes: moduleRoutes
};
