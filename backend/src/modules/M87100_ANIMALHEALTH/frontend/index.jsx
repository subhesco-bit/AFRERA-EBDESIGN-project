/**
 * M87100_ANIMALHEALTH Frontend Entry Point
 * Migrated from AnimalHealthPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import AnimalHealth from './pages/AnimalHealthPage.jsx';

// Module-specific store
export const useAnimalHealthStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m87100_animalhealth/read/${id}`);
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
    path: '/m87100_animalhealth',
    component: AnimalHealth,
    exact: true
  },
  {
    path: '/m87100_animalhealth/:id',
    component: AnimalHealth,
    exact: true
  }
];

// Main export
export default {
  Component: AnimalHealth,
  store: useAnimalHealthStore,
  routes: moduleRoutes
};
