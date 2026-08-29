/**
 * M400_AI_CORE Frontend Entry Point
 * Migrated from AIBackbonePage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import AIBackbone from './pages/AIBackbonePage.jsx';

// Module-specific store
export const useAIBackboneStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m400_ai_core/read/${id}`);
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
    path: '/m400_ai_core',
    component: AIBackbone,
    exact: true
  },
  {
    path: '/m400_ai_core/:id',
    component: AIBackbone,
    exact: true
  }
];

// Main export
export default {
  Component: AIBackbone,
  store: useAIBackboneStore,
  routes: moduleRoutes
};
