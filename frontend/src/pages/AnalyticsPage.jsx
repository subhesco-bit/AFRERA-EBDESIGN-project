import { Link } from 'react-router-dom';
import {
  Search,
  CloudSun,
  LineChart,
  Truck,
  FileBarChart,
  ArrowRight,
} from 'lucide-react';

// 2026-09-16: was a 1-line placeholder (`<h1>Analytics</h1>`), the live
// protected `/analytics` route rendering nothing real. Checked for a real
// backend first: services/api.js's `analyticsAPI` (getStats/getReports)
// points at `/analytics/stats` and `/analytics/reports`, which don't
// exist on the backend under any mount; the only related mount,
// `/api/analyticsreport` (routes/analyticsReportRoutes.js), is a bare
// 38-line "Route operational" scaffold with no real stats endpoint - not
// wired here, since there is genuinely nothing real to query. Built
// instead as a hub into AFRERA's real, already-routed analytics pages
// (see config/routes.js's protectedRoutes) rather than fabricated charts
// or numbers.
const analyticsAreas = [
  {
    icon: LineChart,
    title: 'Market Intelligence',
    description: 'Market trends, price analysis, and demand forecasting.',
    to: '/analytics/market-intelligence',
  },
  {
    icon: CloudSun,
    title: 'Weather Analytics',
    description: 'Weather monitoring and agricultural planning.',
    to: '/analytics/weather',
  },
  {
    icon: Truck,
    title: 'Supply Chain Analytics',
    description: 'End-to-end supply chain visibility and analytics.',
    to: '/analytics/supply-chain',
  },
  {
    icon: Search,
    title: 'Advanced Search',
    description: 'Comprehensive search across products, farmers, and market data.',
    to: '/analytics/advanced-search',
  },
  {
    icon: FileBarChart,
    title: 'Reports Dashboard',
    description: 'Generate and manage comprehensive reports.',
    to: '/reports/dashboard',
  },
];

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 max-w-2xl">
          View your analytics and insights across the platform - pick an area below to dig in.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyticsAreas.map(({ icon: Icon, title, description, to }) => (
          <Link
            key={to}
            to={to}
            className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <Icon className="w-7 h-7 text-green-600 mb-3" />
            <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-1">
              {title}
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h2>
            <p className="text-sm text-gray-600">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
