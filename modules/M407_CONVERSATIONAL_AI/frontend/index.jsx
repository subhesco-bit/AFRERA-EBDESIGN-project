/**
 * M407_CONVERSATIONAL_AI Frontend Entry Point
 * Migrated from FarmAdvisorPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import FarmAdvisor from './pages/FarmAdvisorPage.jsx';

// Module-specific store
export const useFarmAdvisorStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m407_conversational_ai/read/${id}`);
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
    path: '/m407_conversational_ai',
    component: FarmAdvisor,
    exact: true
  },
  {
    path: '/m407_conversational_ai/:id',
    component: FarmAdvisor,
    exact: true
  }
];

// Main export
export default {
  Component: FarmAdvisor,
  store: useFarmAdvisorStore,
  routes: moduleRoutes
};
