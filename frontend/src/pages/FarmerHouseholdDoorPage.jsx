import { Link } from 'react-router-dom'
import { Home, ArrowLeft, ArrowRight, LogIn } from 'lucide-react'

// Public door #2 of 4 — "My household". See FarmerEntranceHubPage.jsx for
// background on why this exists. This page is intentionally NOT wrapped in
// <ProtectedRoute>: a visitor must be able to read it before deciding whether
// to sign in. The farmer's home hub (FarmerHomePage at /farmerhome) stays
// behind requiredRole="farmer" — only the explanation is public.
const ACTIONS = [
  {
    label: 'Browse household goods and everyday essentials',
    to: '/marketplace',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'Check indicative prices before you buy',
    to: '/pricecheck',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'Open your farmer home hub — household and farm overview',
    to: '/farmerhome',
    note: 'Requires signing in to this section',
  },
]

function FarmerHouseholdDoorPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer-entrance" className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> All farmer doors
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Home className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My household</h1>
            <p className="text-gray-500">Family food and goods for the home</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          The first family this platform serves is yours. Feeding and provisioning your household
          is a different budget from selling your harvest or buying seed — so it gets its own
          door, and nothing here touches your selling records.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">What you can do here</h2>
          <ul className="space-y-3">
            {ACTIONS.map((action) => (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition group"
                >
                  <span className="text-gray-800">{action.label}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-3">
                    {action.note}
                    <ArrowRight className="w-4 h-4 text-orange-600 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/marketplace"
            className="flex-1 px-6 py-3 bg-white border-2 border-orange-600 text-orange-700 rounded-lg font-semibold hover:bg-orange-50 transition text-center"
          >
            Open without signing in
          </Link>
          <Link
            to="/login"
            state={{ from: '/farmerhome' }}
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign in to this section
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6 text-center">
          Each farmer section signs in separately — opening your household basket does not expose
          your selling or field records.
        </p>
      </div>
    </div>
  )
}

export default FarmerHouseholdDoorPage
