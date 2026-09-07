/**
 * M865100_PROJECTSYSTEMS Frontend Entry Point
 * Migrated from ProjectSystemsPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import ProjectSystems from './pages/ProjectSystemsPage.jsx';

// Module-specific store
export const useProjectSystemsStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m865100_projectsystems/read/${id}`);
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
    path: '/m865100_projectsystems',
    component: ProjectSystems,
    exact: true
  },
  {
    path: '/m865100_projectsystems/:id',
    component: ProjectSystems,
    exact: true
  }
];

// Main export
export default {
  Component: ProjectSystems,
  store: useProjectSystemsStore,
  routes: moduleRoutes
};
