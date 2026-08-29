/**
 * M408_KNOWLEDGE_MANAGEMENT Frontend Entry Point
 * Migrated from ResearchDashboardPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import ResearchDashboard from './pages/ResearchDashboardPage.jsx';

// Module-specific store
export const useResearchDashboardStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m408_knowledge_management/read/${id}`);
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
    path: '/m408_knowledge_management',
    component: ResearchDashboard,
    exact: true
  },
  {
    path: '/m408_knowledge_management/:id',
    component: ResearchDashboard,
    exact: true
  }
];

// Main export
export default {
  Component: ResearchDashboard,
  store: useResearchDashboardStore,
  routes: moduleRoutes
};
