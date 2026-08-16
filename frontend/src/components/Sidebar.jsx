import { Link, useLocation } from 'react-router-dom'

const SIDEBAR_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/sell/new-product', label: 'Add Product' },
  { to: '/variety-directory', label: 'Variety Directory' },
  { to: '/modules', label: 'Modules' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/forms', label: 'Forms' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/enterprise-control', label: 'Enterprise Control' },
  { to: '/ai-backbone', label: 'AI Backbone' },
  { to: '/diet-recipes', label: 'Diet & Recipes' },
  { to: '/wearables', label: 'Wearables' },
  { to: '/defense-fitness-prep', label: 'Defense Fitness Prep' },
  { to: '/admin-dashboard', label: 'Admin' },
  { to: '/admin/crop-value-review', label: 'Crop Value Review' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="p-4 text-lg font-semibold">AFRERA</div>
      <nav aria-label="Sidebar" className="flex-1 px-2 pb-4 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded hover:bg-gray-50 ${isActive ? 'bg-green-50 text-green-700 font-medium' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
