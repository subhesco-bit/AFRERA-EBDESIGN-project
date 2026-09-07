/**
 * M105_WEATHER_INTELLIGENCE Frontend Entry Point
 * Migrated from ClimateWeatherPage.jsx
 */

import React from 'react';
import { create } from 'zustand';
import ClimateWeather from './pages/ClimateWeatherPage.jsx';

// Module-specific store
export const useClimateWeatherStore = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/m105_weather_intelligence/read/${id}`);
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
    path: '/m105_weather_intelligence',
    component: ClimateWeather,
    exact: true
  },
  {
    path: '/m105_weather_intelligence/:id',
    component: ClimateWeather,
    exact: true
  }
];

// Main export
export default {
  Component: ClimateWeather,
  store: useClimateWeatherStore,
  routes: moduleRoutes
};
