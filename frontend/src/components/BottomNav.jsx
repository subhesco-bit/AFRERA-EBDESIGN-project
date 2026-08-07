import { Link } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
      <div className="max-w-4xl mx-auto flex justify-around py-2">
        <Link to="/" className="text-sm">Home</Link>
        <Link to="/marketplace" className="text-sm">Market</Link>
        <Link to="/modules" className="text-sm">Modules</Link>
        <Link to="/dashboard" className="text-sm">Dashboard</Link>
        <Link to="/login" className="text-sm">Profile</Link>
      </div>
    </nav>
  )
}
