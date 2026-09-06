import { create } from 'zustand';

/**
 * Farmer Store (Zustand)
 * Manages farmer-related state
 */
const useFarmerStore = create((set) => ({
  farmer: null,
  farms: [],
  orders: [],
  income: null,
  loading: false,
  error: null,

  // Actions - Setters
  setFarmer: (farmer) => set({ farmer }),
  setFarms: (farms) => set({ farms }),
  setOrders: (orders) => set({ orders }),
  setIncome: (income) => set({ income }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Actions - Update
  updateFarmer: (updates) => set((state) => ({
    farmer: { ...state.farmer, ...updates }
  })),

  updateFarm: (farmId, updates) => set((state) => ({
    farms: state.farms.map(farm => 
      farm.id === farmId ? { ...farm, ...updates } : farm
    )
  })),

  // Actions - Clear
  clearFarmerState: () => set({
    farmer: null,
    farms: [],
    orders: [],
    income: null,
    loading: false,
    error: null
  })
}));

export default useFarmerStore;