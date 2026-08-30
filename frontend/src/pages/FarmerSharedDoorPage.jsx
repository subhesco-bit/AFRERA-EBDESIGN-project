import { Link } from 'react-router-dom'
import { Tractor, ArrowLeft, ArrowRight, LogIn } from 'lucide-react'

// Public door #4 of 4 — "Shared infra & rental". See FarmerEntranceHubPage.jsx
// for background on why this exists. This page is intentionally NOT wrapped
// in <ProtectedRoute>: a visitor must be able to read it before deciding
// whether to sign in. Machinery booking (TractorManagementPage) stays behind
// a plain <ProtectedRoute> — only the explanation is public.
//
// Cold storage / packhouse booking (SharedInfraPage.jsx) was routed at
// /shared-infra on 2026-08-28 — it had a real backend
// (sharedInfraService.js) and a real page all along, just never added to
// routes.js. No longer "coming soon".
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
  {
    label: 'Book cold storage and packhouse capacity',
    to: '/shared-infra',
    note: 'Requires signing in to this section',
  },
]

function FarmerSharedDoorPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer-entrance" className="inline-flex items-center text-sm text-v42-mut hover:text-v42-forest mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> All farmer doors
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-v42-indigo/10 text-v42-indigo flex items-center justify-center flex-shrink-0">
            <Tractor className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-v42-ink">Shared infra & rental</h1>
            <p className="text-v42-mut">Equipment, cold storage and processing you do not own</p>
          </div>
        </div>

        <p className="text-v42-mut mb-8">
          A smallholder should not have to buy a rotavator to use one. Renting and booking shared
          infrastructure is an operating expense, not an investment — so it has its own door, and
          its own budget.
        </p>

        <div className="bg-v42-paddy rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-v42-ink mb-4">What you can do here</h2>
          <ul className="space-y-3">
            {ACTIONS.map((action) => (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-lg border border-v42-line hover:border-v42-indigo hover:bg-v42-paddy2 transition group"
                >
                  <span className="text-v42-ink">{action.label}</span>
                  <span className="flex items-center gap-2 text-xs text-v42-mut flex-shrink-0 ml-3">
                    {action.note}
                    <ArrowRight className="w-4 h-4 text-v42-indigo group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/corridor-economics"
            className="flex-1 px-6 py-3 bg-v42-paddy border-2 border-v42-indigo text-v42-indigo rounded-lg font-semibold hover:bg-v42-paddy2 transition text-center"
          >
            Open without signing in
          </Link>
          <Link
            to="/login"
            state={{ from: '/tractor-management' }}
            className="flex-1 px-6 py-3 bg-v42-indigo text-white rounded-lg font-semibold hover:opacity-90 transition inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign in to this section
          </Link>
        </div>

        <p className="text-sm text-v42-mut mt-6 text-center">
          Each farmer section signs in separately — booking equipment here does not expose your
          selling or household records.
        </p>
      </div>
    </div>
  )
}

export default FarmerSharedDoorPage
