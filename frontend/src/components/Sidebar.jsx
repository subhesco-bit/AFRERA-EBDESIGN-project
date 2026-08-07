import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="p-4 text-lg font-semibold">AFRERA</div>
      <nav className="flex-1 px-2 pb-4 space-y-1">
        <Link to="/" className="block px-3 py-2 rounded hover:bg-gray-50">Home</Link>
        <Link to="/marketplace" className="block px-3 py-2 rounded hover:bg-gray-50">Marketplace</Link>
        <Link to="/modules" className="block px-3 py-2 rounded hover:bg-gray-50">Modules</Link>
        <Link to="/analytics" className="block px-3 py-2 rounded hover:bg-gray-50">Analytics</Link>
        <Link to="/forms" className="block px-3 py-2 rounded hover:bg-gray-50">Forms</Link>
        <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-50">Dashboard</Link>
        <Link to="/admin-dashboard" className="block px-3 py-2 rounded hover:bg-gray-50">Admin</Link>
      </nav>
    </aside>
  )
}
