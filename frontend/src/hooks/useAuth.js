import { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

/**
 * useAuth Hook
 * Authentication hook for managing user authentication state
 * 
 * Returns:
 * - user: current user object
 * - token: authentication token
 * - isAuthenticated: boolean
 * - loading: boolean
 * - error: error message
 * - login: login function
 * - logout: logout function
 */
export default function useAuth() {
  const { user, token, isAuthenticated, loading, error, login, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken && !token) {
      // TODO: Validate token with backend
      console.log('Token found, validating...');
    }
  }, []);

  const handleLogin = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      navigate('/farmer/dashboard');
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout
  };
}