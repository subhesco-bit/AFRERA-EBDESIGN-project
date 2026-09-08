/**
 * API Warning Service
 * Frontend client for API warning system
 * Production-Grade Warning Management
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Generate a new warning
 */
export const generateWarning = async (warningData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/warnings/generate`, warningData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate warning:', error);
    throw error;
  }
};

/**
 * Get warnings for current user
 */
export const getUserWarnings = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/warnings/user`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user warnings:', error);
    throw error;
  }
};

/**
 * Get system-wide warnings (admin only)
 */
export const getSystemWarnings = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/warnings/system`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system warnings:', error);
    throw error;
  }
};

/**
 * Get warning statistics
 */
export const getWarningStats = async (timeRange = '24h') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/warnings/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: { timeRange }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch warning stats:', error);
    throw error;
  }
};

/**
 * Acknowledge a warning
 */
export const acknowledgeWarning = async (warningId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/warnings/${warningId}/acknowledge`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to acknowledge warning:', error);
    throw error;
  }
};

/**
 * Clean expired warnings (admin only)
 */
export const cleanupWarnings = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/warnings/cleanup`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to cleanup warnings:', error);
    throw error;
  }
};

/**
 * Get warning metrics (admin only)
 */
export const getWarningMetrics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/warnings/metrics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch warning metrics:', error);
    throw error;
  }
};

/**
 * Reset warning metrics (admin only)
 */
export const resetWarningMetrics = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/warnings/metrics/reset`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to reset warning metrics:', error);
    throw error;
  }
};

/**
 * Health check for warning system
 */
export const getWarningHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/warnings/health`);
    return response.data;
  } catch (error) {
    console.error('Failed to check warning system health:', error);
    throw error;
  }
};

// Warning context for React Context API
export const warningAPI = {
  generateWarning,
  getUserWarnings,
  getSystemWarnings,
  getWarningStats,
  acknowledgeWarning,
  cleanupWarnings,
  getWarningMetrics,
  resetWarningMetrics,
  getWarningHealth
};

export default warningAPI;