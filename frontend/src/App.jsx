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
import M001M050OperationalWorkspace from './components/M001M050OperationalWorkspace';
import M001M050ProductionWiredPanel from './components/M001M050ProductionWiredPanel';
import M001M050HighestStandardPanel from './components/M001M050HighestStandardPanel';
import M051M100ProductionWiredPanel from './components/M051M100ProductionWiredPanel';

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

                {Array.from({ length: 150 }, (_, i) => {
                  const moduleNum = i + 1;
                  const code = `M${String(moduleNum).padStart(3, '0')}`;
                  const ModulePage = lazy(() => import(`./modules/${code}/${code}Page.jsx`));
                  const isM001M050 = moduleNum >= 1 && moduleNum <= 50;
                  const isM051M100 = moduleNum >= 51 && moduleNum <= 100;
                  const domainSurface = (
                    <>
                      <ModulePage />
                      {isM001M050 && <M001M050ProductionWiredPanel moduleCode={code} />}
                      {isM001M050 && <M001M050HighestStandardPanel moduleCode={code} />}
                      {isM051M100 && <M051M100ProductionWiredPanel moduleCode={code} />}
                    </>
                  );
                  return (
                    <Route key={`/module/${code}`} path={`/module/${code}`} element={
                      <RoleRoute allowedRoles={['admin']}>
                        <PageTransition transition="fade">
                          <RouteSuspense>
                            {isM001M050 ? <M001M050OperationalWorkspace moduleCode={code}>{domainSurface}</M001M050OperationalWorkspace> : domainSurface}
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
          </Layout>
        </MultilingualProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
