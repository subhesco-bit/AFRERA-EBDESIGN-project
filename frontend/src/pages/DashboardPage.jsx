import { Link } from 'react-router-dom';
import {
  ShoppingBasket,
  ShoppingCart,
  Wallet,
  BarChart3,
  Users,
  ShieldCheck,
  Truck,
  FileBarChart,
  Landmark,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// 2026-09-16: was a 1-line placeholder (`<h1>Dashboard</h1>`), the live
// protected `/dashboard` route rendering nothing real for every logged-in
// user. Built as a generic authenticated landing page: a real
// personalized welcome from authStore.js's actual `user` shape
// (name/role - see demoAccounts and loginDemo()), and a grid of links to
// real, already-routed feature areas. No fabricated account numbers
// (balance, order counts) - dashboardAPI/walletAPI in services/api.js are
// unverified generic stubs, not confirmed against a real backend, so
// nothing account-specific is shown, same principle as the rest of this
// batch. Cards that require a role AFRERA doesn't grant everyone
// (Farmer Portal, Insurance, Logistics need 'farmer' or 'admin' per
// App.jsx's RoleRoute; role-specific dashboards need their own role) are
// only shown to users who can actually reach them, so this page never
// links to a dead end.
const commonCards = [
  {
    icon: ShoppingBasket,
    title: 'Marketplace',
    description: 'Browse and buy agricultural products directly from farmers.',
    to: '/marketplace',
  },
  {
    icon: ShoppingCart,
    title: 'Cart',
    description: 'View and manage items in your shopping cart.',
    to: '/cart',
  },
  {
    icon: Wallet,
    title: 'Wallet',
    description: 'Manage your digital wallet and payments.',
    to: '/wallet',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'View analytics and insights across the platform.',
    to: '/analytics',
  },
  {
    icon: FileBarChart,
    title: 'Reports',
    description: 'Generate and review reports.',
    to: '/reports/dashboard',
  },
];

const farmerCards = [
  {
    icon: Users,
    title: 'Farmer Portal',
    description: 'Manage land records, track harvests, and access advisory tools.',
    to: '/farmer-portal',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance',
    description: 'Crop and asset protection built for smallholder farmers.',
    to: '/insurance',
  },
  {
    icon: Truck,
    title: 'Logistics',
    description: 'Cold chain and delivery coordination from farm to buyer.',
    to: '/logistics',
  },
];

const roleDashboards = {
  banker: {
    icon: Landmark,
    title: 'Banker Dashboard',
    description: 'Review credit, payments, and farmer finance performance.',
    to: '/banker-dashboard',
  },
  admin: {
    icon: Settings,
    title: 'Admin Settings',
    description: 'Platform administration and configuration.',
    to: '/admin/settings',
  },
};

function DashboardCard({ icon: Icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-green-300 transition"
    >
      <Icon className="w-8 h-8 text-green-600 mb-3" />
      <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-1">
        {title}
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </h2>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isFarmerOrAdmin = user?.role === 'farmer' || user?.role === 'admin';
  const roleDashboard = user?.role ? roleDashboards[user.role] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{user?.name ? `, ${user.name}` : ' back'}
        </h1>
        <p className="text-gray-600">
          {user?.role
            ? `Signed in as ${user.role}. Here's where you can pick up.`
            : "Here's where you can pick up."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {commonCards.map((card) => (
          <DashboardCard key={card.to} {...card} />
        ))}
        {isFarmerOrAdmin && farmerCards.map((card) => <DashboardCard key={card.to} {...card} />)}
        {roleDashboard && <DashboardCard key={roleDashboard.to} {...roleDashboard} />}
      </div>
    </div>
  );
}
