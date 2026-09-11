import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { errorMonitoring } from './utils/errorMonitoring';
import { LoadingSpinner } from './components/ui/Skeleton';
import { ProtectedRoute, RoleRoute } from './components/RouteGuard';
import { PageTransition } from './components/RouteTransition';
import { RouteAnalytics, RouteMetadata, UserJourneyTracker, ScrollTracker, EngagementTracker } from './components/RouteAnalytics';
import { ErrorPage, NotFoundPage, UnauthorizedPage } from './components/RouteErrorBoundary';
import { RouteSuspense } from './components/RouteLoading';
import { RoutePreloader } from './utils/routePreloader';
import { publicRoutes, protectedRoutes, farmerRoutes, adminRoutes, dashboardRoutes, managementRoutes, getRouteByPath, getAllRoutes } from './config/routes';
import config from './config/env';
import monitoring from './utils/monitoring';
import analytics from './utils/analytics';
import { MultilingualProvider } from './components/Multilingual/MultilingualProvider';
import { AccessibilityProvider } from './components/Accessibility/AccessibilityProvider';
import EnterpriseModuleResolver from './components/EnterpriseModuleResolver';
import EnterprisePageEstateBoundary from './components/EnterprisePageEstateBoundary';

const EconomicDashboard = lazy(() => import('./pages/economic/EconomicDashboard'));

function App() {
  const { user, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => { if (config.ENABLE_ERROR_REPORTING) monitoring.init(); }, []);
  useEffect(() => { if (config.ENABLE_ANALYTICS) analytics.init(); }, []);
  useEffect(() => {
    if (user) {
      errorMonitoring.trackActiveUser(user.id, user.sessionId);
      monitoring.setUser(user);
      analytics.setUserId(user.id);
    }
  }, [user]);
  useEffect(() => {
    if (import.meta.env.PROD && config.ENABLE_PWA && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const currentRoute = getRouteByPath(location.pathname);

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
            <EnterprisePageEstateBoundary>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="xl" /></div>}>
                <Routes>
                  {publicRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<PageTransition transition={route.transition}><RouteSuspense route={route}><route.component /></RouteSuspense></PageTransition>} />
                  ))}
                  {protectedRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<ProtectedRoute requiredRole={route.role}><PageTransition transition={route.transition}><RouteSuspense route={route}><route.component /></RouteSuspense></PageTransition></ProtectedRoute>} />
                  ))}
                  {farmerRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<RoleRoute allowedRoles={['farmer', 'admin']}><PageTransition transition={route.transition}><RouteSuspense route={route}><route.component /></RouteSuspense></PageTransition></RoleRoute>} />
                  ))}
                  {adminRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<RoleRoute allowedRoles={['admin']}><PageTransition transition={route.transition}><RouteSuspense route={route}><route.component /></RouteSuspense></PageTransition></RoleRoute>} />
                  ))}
                  {dashboardRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<RoleRoute allowedRoles={[route.role, 'admin']}><PageTransition transition={route.transition}><RouteSuspense route={route}><route.component /></RouteSuspense></PageTransition></RoleRoute>} />
                  ))}
                  {managementRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<RoleRoute allowedRoles={route.role ? [route.role] : []}><PageTransition transition={route.transition}><RouteSuspense route={route}><route.component /></RouteSuspense></PageTransition></RoleRoute>} />
                  ))}
                  <Route path="/economic" element={<ProtectedRoute requiredRole="admin"><PageTransition transition="fade"><RouteSuspense><EconomicDashboard /></RouteSuspense></PageTransition></ProtectedRoute>} />

                  {Array.from({ length: 550 }, (_, i) => {
                    const moduleNum = i + 1;
                    const code = `M${String(moduleNum).padStart(3, '0')}`;
                    return (
                      <Route key={`/module/${code}`} path={`/module/${code}`} element={
                        <RoleRoute allowedRoles={['admin']}>
                          <PageTransition transition="fade">
                            <RouteSuspense>
                              <EnterpriseModuleResolver moduleCode={code} />
                            </RouteSuspense>
                          </PageTransition>
                        </RoleRoute>
                      } />
                    );
                  })}

                  <Route path="/error" element={<ErrorPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </EnterprisePageEstateBoundary>
          </Layout>
        </MultilingualProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
