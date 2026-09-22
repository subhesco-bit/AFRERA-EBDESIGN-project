import { buildServiceDirectory, filterServices, serviceAccess } from './serviceDirectory';
import { publicRoutes, protectedRoutes, farmerRoutes, adminRoutes, dashboardRoutes, managementRoutes } from '../config/routes';

const directory = buildServiceDirectory([
  { routes: publicRoutes, requiresAuth: false },
  { routes: protectedRoutes, roles: route => route.role ? [route.role] : [] },
  { routes: farmerRoutes, roles: ['farmer', 'admin'] },
  { routes: adminRoutes, roles: ['admin'] },
  { routes: dashboardRoutes, roles: route => [route.role, 'admin'] },
  { routes: managementRoutes, roles: route => route.role ? [route.role] : [] },
]);

describe('service discovery from real registered routes', () => {
  test('covers every static service route once, without login or record placeholders', () => {
    const paths = [...new Set([...publicRoutes, ...protectedRoutes, ...farmerRoutes, ...adminRoutes, ...dashboardRoutes, ...managementRoutes].map(route => route.path))]
      .filter(path => !['/', '/login', '/register', '/services'].includes(path) && !/[:*]/.test(path));
    expect(directory.map(service => service.path).sort()).toEqual(paths.sort());
  });
  test('searches farmer vocabulary and Hindi', () => {
    expect(filterServices(directory, { query: '  MANDI  ' }).some(service => service.path === '/price-check')).toBe(true);
    expect(filterServices(directory, { query: 'मौसम' }).some(service => service.path === '/climate')).toBe(true);
    expect(filterServices(directory, { query: 'beej' }).some(service => service.path === '/seed-vault')).toBe(true);
  });
  test('shows role restricted services only when all account types are selected', () => {
    expect(filterServices(directory).some(service => service.path === '/admin/settings')).toBe(false);
    expect(filterServices(directory, { audience: 'all' }).some(service => service.path === '/admin/settings')).toBe(true);
  });
  test('combines category with all search terms', () => {
    expect(filterServices(directory, { query: 'weather', category: 'grow' }).length).toBeGreaterThan(0);
    expect(filterServices(directory, { query: 'weather nonexistentword', category: 'grow' })).toEqual([]);
  });
  test('labels access without making service availability claims', () => {
    expect(serviceAccess(directory.find(service => service.path === '/climate'))).toBe('Open to everyone');
    const sell = directory.find(service => service.path === '/farmer-sell');
    expect(serviceAccess(sell, { role: 'buyer' })).toContain('account required');
    expect(serviceAccess(sell, { role: 'farmer' })).toBe('Open service');
    expect(serviceAccess(directory.find(service => service.path === '/cart'))).toBe('Sign in to use');
  });
});
