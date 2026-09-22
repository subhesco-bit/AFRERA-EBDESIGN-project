import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowRight, Sprout } from 'lucide-react';
import { publicRoutes, protectedRoutes, farmerRoutes, adminRoutes, dashboardRoutes, managementRoutes } from '../config/routes';
import { useAuthStore } from '../store/authStore';
import { buildServiceDirectory, filterServices, serviceAccess, SERVICE_CATEGORIES } from '../utils/serviceDirectory';

const QUICK_ACTIONS = [
  ['Sell my harvest', '/farmer-sell'], ['Check mandi prices', '/price-check'],
  ['Weather and rain', '/climate'], ['Plan my crops', '/harvest-plan'],
  ['Find seeds', '/seed-vault'], ['Rent a tractor', '/tractor-management'],
  ['Government schemes', '/government-subsidy'], ['Ask a farm advisor', '/farm-advisor'],
];

export default function ServiceDirectoryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(24);
  const query = params.get('q') || '';
  const category = SERVICE_CATEGORIES.some(([id]) => id === params.get('category')) ? params.get('category') : 'all';
  const audience = params.get('audience') === 'all' ? 'all' : 'farmer';
  const services = useMemo(() => buildServiceDirectory([
    { routes: publicRoutes, requiresAuth: false },
    { routes: protectedRoutes, roles: route => route.role ? [route.role] : [] },
    { routes: farmerRoutes, roles: ['farmer', 'admin'] },
    { routes: adminRoutes, roles: ['admin'] },
    { routes: dashboardRoutes, roles: route => [route.role, 'admin'] },
    { routes: managementRoutes, roles: route => route.role ? [route.role] : [] },
  ]), []);
  const results = filterServices(services, { query, category, audience });
  const updateFilter = (name, value) => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set(name, value); else next.delete(name);
      return next;
    }, { replace: true });
    setLimit(24);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      <header className="rounded-2xl bg-green-900 p-6 text-white sm:p-8">
        <p className="mb-3 flex items-center gap-2 text-green-100"><Sprout aria-hidden="true" className="h-5 w-5" /> Your farm, one place</p>
        <h1 className="text-3xl font-bold">Find a service</h1>
        <p className="mt-3 max-w-2xl text-green-100">Start with what you need to do. Explore farming, selling, equipment, money and support before signing in.</p>
        <Link to="/farmer-entrance" className="mt-4 inline-flex min-h-11 items-center gap-2 underline underline-offset-4">New here? Explore the farmer guide <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </header>
      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-3 text-xl font-semibold">What do you want to do?</h2>
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(([label, path]) => <Link key={path} to={path} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-green-200 bg-white p-4 font-medium text-green-900 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">{label}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>)}
        </div>
      </section>
      <section aria-labelledby="directory-title" className="space-y-4">
        <h2 id="directory-title" className="text-xl font-semibold">Explore services</h2>
        <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <label htmlFor="service-search" className="mb-1 block font-medium">Search services</label>
            <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3 h-5 w-5 text-gray-500" /><input id="service-search" type="search" value={query} onChange={event => updateFilter('q', event.target.value)} placeholder="Try seeds, mandi, मौसम…" className="min-h-11 w-full rounded-lg border border-gray-400 py-2 pl-10 pr-3" /></div>
          </div>
          <div><label htmlFor="service-category" className="mb-1 block font-medium">I need help with</label><select id="service-category" value={category} onChange={event => updateFilter('category', event.target.value)} className="min-h-11 w-full rounded-lg border border-gray-400 p-2"><option value="all">Every category</option>{SERVICE_CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
          <div><label htmlFor="service-audience" className="mb-1 block font-medium">Show services for</label><select id="service-audience" value={audience} onChange={event => updateFilter('audience', event.target.value)} className="min-h-11 w-full rounded-lg border border-gray-400 p-2"><option value="farmer">Farmers</option><option value="all">All account types</option></select></div>
        </div>
        <p role="status" className="text-sm text-gray-600">{results.length} services found. Some services require an account or a specific role.</p>
        {results.length === 0 ? <div className="rounded-xl border bg-white p-6"><p>No services match your search. Try a crop, task or category.</p><button type="button" onClick={() => { setParams({}); setLimit(24); }} className="mt-3 min-h-11 rounded-lg border border-green-700 px-4 text-green-800">Clear search and filters</button></div> : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.slice(0, limit).map(service => <li key={service.path} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-semibold"><Link to={service.path} className="text-green-900 underline-offset-4 hover:underline">{service.title}</Link></h3>
              <p className="mt-2 flex-1 text-sm text-gray-600">{service.description}</p>
              <p className="mt-4 text-xs font-medium text-gray-700">{serviceAccess(service, isAuthenticated ? user : null)}</p>
              <Link to={service.path} aria-label={`Open ${service.title}`} className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-green-800">View service <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </li>)}
          </ul>
        )}
        {results.length > limit && <button type="button" onClick={() => setLimit(previous => previous + 24)} className="min-h-12 rounded-lg bg-green-800 px-6 font-medium text-white hover:bg-green-900">Show more services ({results.length - limit} remaining)</button>}
      </section>
    </div>
  );
}
