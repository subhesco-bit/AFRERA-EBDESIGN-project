import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, ShoppingBag, UserRound } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/marketplace', label: 'Market', icon: ShoppingBag },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/login', label: 'Profile', icon: UserRound },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Primary mobile navigation" className="fixed bottom-0 left-0 right-0 z-sticky border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid min-h-16 max-w-4xl grid-cols-4 gap-1 px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-1 ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
