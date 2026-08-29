/**
 * M108_FERTILIZER_MANAGEMENT Frontend Entry Point
 * Migrated from FertilizerInventoryPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import FertilizerInventory from './pages/FertilizerInventoryPage.jsx';

// Module-specific store
export const useFertilizerInventoryStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m108_fertilizer_management/read/${id}`);
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
    path: '/m108_fertilizer_management',
    component: FertilizerInventory,
    exact: true
  },
  {
    path: '/m108_fertilizer_management/:id',
    component: FertilizerInventory,
    exact: true
  }
];

// Main export
export default {
  Component: FertilizerInventory,
  store: useFertilizerInventoryStore,
  routes: moduleRoutes
};
