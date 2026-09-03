import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import { errorMonitoring } from './utils/errorMonitoring'
import { LoadingSpinner } from './components/ui/Skeleton'
import { ProtectedRoute, PublicRoute, RoleRoute } from './components/RouteGuard'
import { PageTransition } from './components/RouteTransition'
import { RouteAnalytics, RouteMetadata, UserJourneyTracker, ScrollTracker, EngagementTracker } from './components/RouteAnalytics'
import { RouteErrorBoundary, ErrorPage, NotFoundPage, UnauthorizedPage } from './components/RouteErrorBoundary'
import { RouteSuspense, SmartRouteLoading } from './components/RouteLoading'
import { RoutePreloader } from './utils/routePreloader'
import { publicRoutes, protectedRoutes, farmerRoutes, adminRoutes, dashboardRoutes, managementRoutes, getRouteByPath, getAllRoutes } from './config/routes'
import config from './config/env'
import monitoring from './utils/monitoring'
import analytics from './utils/analytics'
import { MultilingualProvider } from './components/Multilingual/MultilingualProvider'
import { AccessibilityProvider } from './components/Accessibility/AccessibilityProvider'

// Lazy load EconomicDashboard (not in centralized routes yet)
const EconomicDashboard = lazy(() => import('./pages/economic/EconomicDashboard'))

function App() {
  const { user, checkAuth } = useAuthStore()
  const location = useLocation()

  // Initialize authentication check
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Initialize monitoring
  useEffect(() => {
    if (config.ENABLE_ERROR_REPORTING) {
      monitoring.init()
    }
  }, [])

  // Initialize analytics
  useEffect(() => {
    if (config.ENABLE_ANALYTICS) {
      analytics.init()
    }
  }, [])

  // Track active user in monitoring
  useEffect(() => {
    if (user) {
      errorMonitoring.trackActiveUser(user.id, user.sessionId)
      monitoring.setUser(user)
      analytics.setUserId(user.id)
    }
  }, [user])

  // Register service worker for PWA
  useEffect(() => {
    // (2026-08-30) Was registering unconditionally, including under `vite
    // dev` - a cache-first service worker in local dev means every source
    // fix can appear to silently "not work" because the browser is still
    // being served a stale cached bundle from before the fix. Restricted to
    // production builds, where this is actually wanted.
    if (import.meta.env.PROD && config.ENABLE_PWA && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          
        })
        .catch((error) => {
          
        })
    }
  }, [])

  // Get current route configuration
  const currentRoute = getRouteByPath(location.pathname)

  return (
    <ErrorBoundary>
      <RouteAnalytics routeConfig={{ getRouteByPath }} />
      <UserJourneyTracker />
      <ScrollTracker />
      <EngagementTracker />
      <RoutePreloader routes={getAllRoutes()} />
      <AccessibilityProvider>
        <MultilingualProvider>
          <Layout>
            <RouteMetadata route={currentRoute} />
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="xl" />
              </div>
            }>
              <Routes>
                {/* Public Routes */}
                {publicRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <PageTransition transition={route.transition}>
                        <RouteSuspense route={route}>
                          <route.component />
                        </RouteSuspense>
                      </PageTransition>
                    }
                  />
                ))}

                {/* Protected Routes */}
                {protectedRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <ProtectedRoute requiredRole={route.role}>
                        <PageTransition transition={route.transition}>
                          <RouteSuspense route={route}>
                            <route.component />
                          </RouteSuspense>
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Farmer Routes */}
                {farmerRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <RoleRoute allowedRoles={['farmer', 'admin']}>
                        <PageTransition transition={route.transition}>
                          <RouteSuspense route={route}>
                            <route.component />
                          </RouteSuspense>
                        </PageTransition>
                      </RoleRoute>
                    }
                  />
                ))}

                {/* Admin Routes */}
                {adminRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <RoleRoute allowedRoles={['admin']}>
                        <PageTransition transition={route.transition}>
                          <RouteSuspense route={route}>
                            <route.component />
                          </RouteSuspense>
                        </PageTransition>
                      </RoleRoute>
                    }
                  />
                ))}

                {/* Dashboard Routes */}
                {dashboardRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <RoleRoute allowedRoles={[route.role, 'admin']}>
                        <PageTransition transition={route.transition}>
                          <RouteSuspense route={route}>
                            <route.component />
                          </RouteSuspense>
                        </PageTransition>
                      </RoleRoute>
                    }
                  />
                ))}

                {/* Management Routes */}
                {managementRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <ProtectedRoute>
                        <PageTransition transition={route.transition}>
                          <RouteSuspense route={route}>
                            <route.component />
                          </RouteSuspense>
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Economic Dashboard */}
                <Route
                  path="/economic"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <PageTransition transition="fade">
                        <RouteSuspense>
                          <EconomicDashboard />
                        </RouteSuspense>
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                {/* Module Routes (M001-M150) */}
                {Array.from({ length: 150 }, (_, i) => {
                  const moduleNum = i + 1
                  const ModulePage = lazy(() => import(`./modules/M${String(moduleNum).padStart(3, '0')}/M${String(moduleNum).padStart(3, '0')}Page.jsx`))
                  return (
                    <Route
                      key={`/module/M${String(moduleNum).padStart(3, '0')}`}
                      path={`/module/M${String(moduleNum).padStart(3, '0')}`}
                      element={
                        <RoleRoute allowedRoles={['admin']}>
                          <PageTransition transition="fade">
                            <RouteSuspense>
                              <ModulePage />
                            </RouteSuspense>
                          </PageTransition>
                        </RoleRoute>
                      }
                    />
                  )
                })}

                {/* Error Pages */}
                <Route path="/error" element={<ErrorPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Layout>
        </MultilingualProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

export default App
