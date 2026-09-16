import { Link } from 'react-router-dom';
import {
  Sprout,
  HelpCircle,
  Archive,
  Tag,
  Scale,
  CalendarClock,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

// 2026-09-16: was a 1-line placeholder (`<h1>Discover</h1>`), the live
// `/discover` route (farmer-only, see config/routes.js's farmerRoutes and
// App.jsx's RoleRoute allowedRoles=['farmer','admin']) rendering nothing
// real. No discoverAPI exists in services/api.js and nothing in the
// backend exposes a generic "opportunities" feed, so this is built as a
// navigational hub into AFRERA's real, already-routed farmer decision
// tools rather than fabricated recommendations.
const tools = [
  {
    icon: Sprout,
    title: 'What to Grow',
    description: 'Get recommendations on what to grow based on your land and season.',
    to: '/what-grow',
  },
  {
    icon: HelpCircle,
    title: 'Farm Advisor',
    description: 'Get expert farming advice tailored to your fields and crops.',
    to: '/farm-advisor',
  },
  {
    icon: Archive,
    title: 'Seed Vault',
    description: 'Access seed varieties and variety-specific information.',
    to: '/seed-vault',
  },
  {
    icon: Tag,
    title: 'Price Check',
    description: 'Check current market prices before you sell.',
    to: '/price-check',
  },
  {
    icon: Scale,
    title: 'Compare',
    description: 'Compare products and prices across the marketplace.',
    to: '/compare',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Pricing',
    description: 'Use dynamic pricing tools to price your produce competitively.',
    to: '/dynamic-pricing',
  },
  {
    icon: CalendarClock,
    title: 'Sell Timing',
    description: 'Optimize when you sell to get the best outcome.',
    to: '/sell-timing',
  },
  {
    icon: ShoppingBag,
    title: 'Pre-Order',
    description: 'Browse and manage pre-orders for upcoming harvests.',
    to: '/pre-order',
  },
];

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <p className="text-gray-600 max-w-2xl">
          Explore the tools AFRERA gives you to plan what to grow, check prices, and time your
          sales.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map(({ icon: Icon, title, description, to }) => (
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
