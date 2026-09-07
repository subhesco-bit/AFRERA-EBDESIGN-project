/**
 * M308_ASSET_MANAGEMENT Frontend Entry Point
 * Migrated from AssetAccountingPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import AssetAccounting from './pages/AssetAccountingPage.jsx';

// Module-specific store
export const useAssetAccountingStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m308_asset_management/read/${id}`);
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
    path: '/m308_asset_management',
    component: AssetAccounting,
    exact: true
  },
  {
    path: '/m308_asset_management/:id',
    component: AssetAccounting,
    exact: true
  }
];

// Main export
export default {
  Component: AssetAccounting,
  store: useAssetAccountingStore,
  routes: moduleRoutes
};
