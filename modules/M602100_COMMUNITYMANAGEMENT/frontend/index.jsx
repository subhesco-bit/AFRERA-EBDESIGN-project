/**
 * M602100_COMMUNITYMANAGEMENT Frontend Entry Point
 * Migrated from CommunityManagementPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import CommunityManagement from './pages/CommunityManagementPage.jsx';

// Module-specific store
export const useCommunityManagementStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m602100_communitymanagement/read/${id}`);
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
    path: '/m602100_communitymanagement',
    component: CommunityManagement,
    exact: true
  },
  {
    path: '/m602100_communitymanagement/:id',
    component: CommunityManagement,
    exact: true
  }
];

// Main export
export default {
  Component: CommunityManagement,
  store: useCommunityManagementStore,
  routes: moduleRoutes
};
