import { Link } from 'react-router-dom'
import { Tractor, ArrowLeft, ArrowRight, LogIn, Clock } from 'lucide-react'

// Public door #4 of 4 — "Shared infra & rental". See FarmerEntranceHubPage.jsx
// for background on why this exists. This page is intentionally NOT wrapped
// in <ProtectedRoute>: a visitor must be able to read it before deciding
// whether to sign in. Machinery booking (TractorManagementPage) stays behind
// a plain <ProtectedRoute> — only the explanation is public.
//
// Cold storage / packhouse booking has a real backend service
// (backend/src/services/sharedInfraService.js) but no page or route mounts
// it yet, so that action is labelled "coming soon" rather than linked —
// see the ground rule against pointing at functionality that doesn't exist
// in the UI yet.
const ACTIONS = [
  {
    label: 'See corridor and logistics economics for moving your produce',
    to: '/corridor-economics',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'Rent tractors and machinery, book by the day',
    to: '/tractor-management',
    note: 'Requires signing in to this section',
  },
]

function FarmerSharedDoorPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer-entrance" className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> All farmer doors
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Tractor className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Shared infra & rental</h1>
            <p className="text-gray-500">Equipment, cold storage and processing you do not own</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          A smallholder should not have to buy a rotavator to use one. Renting and booking shared
          infrastructure is an operating expense, not an investment — so it has its own door, and
          its own budget.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">What you can do here</h2>
          <ul className="space-y-3">
            {ACTIONS.map((action) => (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
                >
                  <span className="text-gray-800">{action.label}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-3">
                    {action.note}
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-400">
                <span>Cold storage and packhouse booking</span>
                <span className="flex items-center gap-2 text-xs flex-shrink-0 ml-3">
                  <Clock className="w-4 h-4" /> Coming soon
                </span>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/corridor-economics"
            className="flex-1 px-6 py-3 bg-white border-2 border-blue-600 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
          >
            Open without signing in
          </Link>
          <Link
            to="/login"
            state={{ from: '/tractor-management' }}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign in to this section
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6 text-center">
          Each farmer section signs in separately — booking equipment here does not expose your
          selling or household records.
        </p>
      </div>
    </div>
  )
}

export default FarmerSharedDoorPage
