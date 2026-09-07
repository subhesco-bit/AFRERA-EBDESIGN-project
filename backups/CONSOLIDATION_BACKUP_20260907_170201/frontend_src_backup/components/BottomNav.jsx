import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Market' },
  { to: '/modules', label: 'Modules' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/login', label: 'Profile' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav aria-label="Primary" className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
      <div className="max-w-4xl mx-auto flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm ${isActive ? 'text-green-600 font-medium' : 'text-gray-700'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
