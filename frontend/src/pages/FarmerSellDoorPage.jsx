import { Link } from 'react-router-dom'
import { Wheat, ArrowLeft, ArrowRight, LogIn } from 'lucide-react'

// Public door #1 of 4 — "Sell my harvest". See FarmerEntranceHubPage.jsx for
// background on why this exists. This page is intentionally NOT wrapped in
// <ProtectedRoute>: a visitor must be able to read it before deciding whether
// to sign in. The actual selling flow (FarmerSellPage at /farmersell) stays
// behind requiredRole="farmer" — only the explanation is public.
const ACTIONS = [
  {
    label: 'See indicative prices before you list anything',
    to: '/pricecheck',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'Track how your price moves through the season',
    to: '/dynamicpricing',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'Time your sale: glut and season advice',
    to: '/selltiming',
    note: 'Open — no sign-in needed',
  },
  {
    label: 'List a lot with a private floor price and get an advance',
    to: '/farmersell',
    note: 'Requires signing in to this section',
  },
]

function FarmerSellDoorPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer-entrance" className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> All farmer doors
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
            <Wheat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sell my harvest</h1>
            <p className="text-gray-500">Income — your produce, your floor price</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Your minimum acceptable price is never shown to a buyer. You see the agreed price, the
          truck, and the advance — the floor stays yours.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">What you can do here</h2>
          <ul className="space-y-3">
            {ACTIONS.map((action) => (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition group"
                >
                  <span className="text-gray-800">{action.label}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-3">
                    {action.note}
                    <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/pricecheck"
            className="flex-1 px-6 py-3 bg-white border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition text-center"
          >
            Open without signing in
          </Link>
          <Link
            to="/login"
            state={{ from: '/farmersell' }}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign in to this section
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6 text-center">
          Each farmer section signs in separately — selling here does not expose your household
          or field records.
        </p>
      </div>
    </div>
  )
}

export default FarmerSellDoorPage
