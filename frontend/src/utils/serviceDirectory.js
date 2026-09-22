const EXCLUDED = new Set(['/', '/login', '/register', '/services']);
export const SERVICE_CATEGORIES = [
  ['grow', 'Grow crops', /crop|seed|soil|field|harvest|irrigat|fertiliz|pest|agronom|agricultur|climate|weather/],
  ['animals', 'Care for animals', /livestock|cattle|dairy|poultry|sheep|goat|pig|veterinar|fish|aquacul|animal/],
  ['sell', 'Buy and sell', /market|sell|price|pricing|commerce|procure|buy|product|order|cart|checkout|trade/],
  ['money', 'Money and records', /financ|bank|loan|credit|insurance|wallet|payment|ledger|account|revenue|cost|subsid|escrow/],
  ['equipment', 'Equipment and transport', /tractor|machin|equipment|logistic|transport|storage|warehouse|infra|fleet|asset/],
  ['learn', 'Learn and get help', /knowledge|train|learn|support|community|skill|library|advis|health|family|food|nutrition/],
  ['technology', 'AI and farm technology', /\bai\b|intelligence|digital|iot|sensor|blockchain|automat|analytics/],
  ['platform', 'Other services', /./],
];
const FARMER_TERMS = {
  '/farmer-sell': 'sell my harvest fasal bechna फसल बेचें',
  '/farmer-field': 'my farm khet खेत',
  '/seed-vault': 'seeds beej बीज',
  '/climate': 'weather rain mausam barish मौसम बारिश',
  '/price-check': 'mandi bhav bazaar भाव मंडी',
  '/government-subsidy': 'sarkari yojana subsidy योजना सरकारी',
  '/tractor-management': 'rent tractor kiraya ट्रैक्टर किराया',
  '/farm-advisor': 'help salah madad सलाह मदद',
};

export function buildServiceDirectory(groups) {
  const seen = new Set();
  // Match App.jsx order, including first-match handling for duplicate paths.
  return groups.flatMap(({ routes, roles = [], requiresAuth = true }) => routes.flatMap(route => {
    if (seen.has(route.path)) return [];
    seen.add(route.path);
    // Detail pages need a real record ID; never link to a literal :id.
    if (EXCLUDED.has(route.path) || /[:*]/.test(route.path)) return [];
    const title = (route.title || route.path).replace(/\s+-\s+AFRERA.*$/i, '');
    const searchText = `${title} ${route.description || ''} ${route.keywords || ''} ${route.path} ${FARMER_TERMS[route.path] || ''}`.toLocaleLowerCase();
    const allowedRoles = typeof roles === 'function' ? roles(route) : roles;
    const category = SERVICE_CATEGORIES.find(([, , pattern]) => pattern.test(`${title} ${route.path}`.toLowerCase()))[0];
    return [{ path: route.path, title, description: route.description || '', searchText, category, roles: allowedRoles, requiresAuth }];
  })).sort((a, b) => a.title.localeCompare(b.title));
}

export function filterServices(services, { query = '', category = 'all', audience = 'farmer' } = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return services.filter(service =>
    (category === 'all' || service.category === category) &&
    (audience === 'all' || service.roles.length === 0 || service.roles.includes(audience)) &&
    words.every(word => service.searchText.includes(word)),
  );
}

export function serviceAccess(service, user) {
  if (!service.requiresAuth) return 'Open to everyone';
  if (service.roles.length && !service.roles.includes(user?.role)) return `${service.roles.join(' / ')} account required`;
  return user ? 'Open service' : 'Sign in to use';
}
