/**
 * M401_AI_GATEWAY Frontend Entry Point
 * Migrated from AIDashboard.jsx
 */

import React from 'react';
import { create } from 'zustand';
import AIDashboard from './pages/AIDashboard.jsx';

// Module-specific store
export const useAIDashboardStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m401_ai_gateway/read/${id}`);
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
    path: '/m401_ai_gateway',
    component: AIDashboard,
    exact: true
  },
  {
    path: '/m401_ai_gateway/:id',
    component: AIDashboard,
    exact: true
  }
];

// Main export
export default {
  Component: AIDashboard,
  store: useAIDashboardStore,
  routes: moduleRoutes
};
