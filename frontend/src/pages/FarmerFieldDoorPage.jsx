import { Link } from 'react-router-dom'
import { Sprout, ArrowLeft, ArrowRight, LogIn } from 'lucide-react'

// Public door #3 of 4 — "Field consumables". See FarmerEntranceHubPage.jsx
// for background on why this exists. This page is intentionally NOT wrapped
// in <ProtectedRoute>: a visitor must be able to read it before deciding
// whether to sign in. The seed vault, crop advisor and "what to grow" tools
// stay behind requiredRole="farmer" — only the explanation is public.
const ACTIONS = [
  {
    label: 'Check climate and weather advisory before you plan',
    to: '/climate',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'See land-use and carbon insights for your plot',
    to: '/land-use',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'Seed vault — rare and traditional varieties',
    to: '/seedvault',
    note: 'Requires signing in to this section',
  },
  {
    label: 'What to grow next season',
    to: '/whatgrow',
    note: 'Requires signing in to this section',
  },
  {
    label: 'Farm advisor — inputs, tools and compost advice',
    to: '/farmadvisor',
    note: 'Requires signing in to this section',
  },
]

function FarmerFieldDoorPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer-entrance" className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> All farmer doors
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Field consumables</h1>
            <p className="text-gray-500">Seeds, inputs and tools for the farm</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Buying for the field is a different decision from buying for the kitchen or listing a
          harvest, so it has its own door — and its own budget. Nothing here touches your selling
          or household records.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">What you can do here</h2>
          <ul className="space-y-3">
            {ACTIONS.map((action) => (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition group"
                >
                  <span className="text-gray-800">{action.label}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-3">
                    {action.note}
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/climate"
            className="flex-1 px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition text-center"
          >
            Open without signing in
          </Link>
          <Link
            to="/login"
            state={{ from: '/seedvault' }}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign in to this section
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6 text-center">
          Each farmer section signs in separately — buying for the field here does not expose your
          selling or household records.
        </p>
      </div>
    </div>
  )
}

export default FarmerFieldDoorPage
