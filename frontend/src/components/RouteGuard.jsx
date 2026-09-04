/**
 * Enterprise-Grade Route Guards
 *
 * Production-ready route protection with:
 * - Authentication checks
 * - Role-based access control
 * - Permission verification
 * - Route middleware execution
 * - Redirect handling
 * - Loading states
 * - Error handling
 */

import { useEffect, useState } from 'react';

import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './ui/Skeleton';

/**
 * Protected Route Component
 * Requires authentication
 */
export function ProtectedRoute({ children, requiredRole, requiredPermissions, redirectTo = '/login' }) {
  const { user, isAuthenticated, checkAuth, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth();
      setIsChecking(false);
    };

    checkAuthentication();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking) {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        navigate(redirectTo, {
          state: { from: location.pathname },
        });
        return;
      }

      // Check role requirement
      if (requiredRole && user?.role !== requiredRole) {
        navigate('/unauthorized');
        return;
      }

      // Check permissions
      if (requiredPermissions?.length) {
        const hasPermission = requiredPermissions.every((perm) =>
          user?.permissions?.includes(perm),
        );
        if (!hasPermission) {
          navigate('/unauthorized');
          return;
        }
      }
    }
  }, [isChecking, isAuthenticated, user, requiredRole, requiredPermissions, navigate, redirectTo, location]);

  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return children;
}

/**
 * Public Route Component
 * Redirects authenticated users to dashboard
 */
export function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return children;
}

/**
 * Role-based Route Component
 * Requires specific role
 */
export function RoleRoute({ children, allowedRoles = [], redirectTo = '/unauthorized' }) {
  const { user, isAuthenticated, initialized, initializeAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      navigate(redirectTo);
    }
  }, [initialized, initializeAuth, isAuthenticated, user, allowedRoles, navigate, redirectTo]);

  if (!initialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return null; // Will redirect
  }

  return children;
}

/**
 * Permission-based Route Component
 * Requires specific permissions
 */
export function PermissionRoute({ children, requiredPermissions = [], redirectTo = '/unauthorized' }) {
  const { user, isAuthenticated, initialized, initializeAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(perm =>
        user?.permissions?.includes(perm),
      );
      if (!hasPermission) {
        navigate(redirectTo);
      }
    }
  }, [initialized, initializeAuth, isAuthenticated, user, requiredPermissions, navigate, redirectTo]);

  if (!initialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every(perm =>
      user?.permissions?.includes(perm),
    );
    if (!hasPermission) {
      return null; // Will redirect
    }
  }

  return children;
}

/**
 * Route Middleware Hook
 * Executes middleware functions before rendering route
 */
export function useRouteMiddleware(middleware = []) {
  const [isExecuting, setIsExecuting] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const executeMiddleware = async () => {
      try {
        for (const middlewareFn of middleware) {
          await middlewareFn();
        }
        setIsExecuting(false);
      } catch (err) {
        setError(err);
        setIsExecuting(false);
      }
    };

    executeMiddleware();
  }, [middleware]);

  return { isExecuting, error };
}

/**
 * Common middleware functions
 */
export const routeMiddleware = {
  /**
   * Check if user has verified email
   */
  requireVerifiedEmail: () => {
    const { user } = useAuthStore.getState();
    if (!user?.emailVerified) {
      throw new Error('Email verification required');
    }
  },

  /**
   * Check if user has completed profile
   */
  requireCompleteProfile: () => {
    const { user } = useAuthStore.getState();
    if (!user?.profileComplete) {
      throw new Error('Profile completion required');
    }
  },

  /**
   * Check if user has accepted terms
   */
  requireTermsAccepted: () => {
    const { user } = useAuthStore.getState();
    if (!user?.termsAccepted) {
      throw new Error('Terms acceptance required');
    }
  },

  /**
   * Log route access for analytics
   */
  logRouteAccess: (path) => {
    // Analytics tracking would go here

  },

  /**
   * Check maintenance mode
   */
  checkMaintenanceMode: () => {
    const isMaintenance = false; // Would check from API
    if (isMaintenance) {
      throw new Error('System under maintenance');
    }
  },
};
