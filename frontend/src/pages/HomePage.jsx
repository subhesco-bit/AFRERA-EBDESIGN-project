import { Link } from 'react-router-dom';
import { ShoppingBasket, Users, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// 2026-09-16: was a 1-line placeholder (`<h1>Home</h1>`), the site root
// (`/`) rendering nothing real for every visitor. Built against the
// platform's own established positioning (Footer.jsx's real tagline and
// nav targets) and real, already-verified routes - no fabricated stats
// or numbers, just navigation to features that genuinely exist.
const verticals = [
  {
    icon: ShoppingBasket,
    title: 'Marketplace',
    description: 'Buy and sell agricultural products directly, with transparent pricing.',
    to: '/marketplace',
  },
  {
    icon: Users,
    title: 'Farmer Portal',
    description: 'Manage land records, track harvests, and access advisory tools.',
    to: '/farmer-portal',
  },
  {
    icon: Truck,
    title: 'Logistics',
    description: 'Cold chain and delivery coordination from farm to buyer.',
    to: '/logistics',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance',
    description: 'Crop and asset protection built for smallholder farmers.',
    to: '/insurance',
  },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div>
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Fair trade for Northeast India's farmers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            AFRERA connects farmers directly with buyers, and brings marketplace,
            logistics, insurance, and financial tools together on one platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Browse Marketplace
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {verticals.map(({ icon: Icon, title, description, to }) => (
            <Link
              key={to}
              to={to}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-green-300 transition"
            >
              <Icon className="w-8 h-8 text-green-600 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
