import { Link } from 'react-router-dom'
import { Wheat, Home, Sprout, Tractor, ArrowRight, ShieldCheck } from 'lucide-react'

// Central hub for the four "farmer doors" — public landing pages that let a
// first-time visitor see what a section offers before being asked to log in.
//
// Background: every farmer-specific route in this app (/farmerhome,
// /farmersell, /farmerfield, /seedvault, ...) is wrapped in <ProtectedRoute
// requiredRole="farmer">, which immediately redirects an unauthenticated
// visitor to /login with no context. A rural first-time user has no way to
// evaluate the platform before committing to an account. These four doors
// (plus this hub) are the public discovery layer in front of that wall —
// see docs/V43_UX_IMPROVEMENTS_EXTRACTION.md for the full writeup this is
// based on.
const DOORS = [
  {
    path: '/farmer-entrance/sell',
    icon: Wheat,
    title: 'Sell my harvest',
    subtitle: 'Income — your produce, your floor price',
    accent: 'border-green-200 hover:border-green-400',
    iconBg: 'bg-green-100 text-green-600',
  },
  {
    path: '/farmer-entrance/household',
    icon: Home,
    title: 'My household',
    subtitle: 'Family food and goods for the home',
    accent: 'border-orange-200 hover:border-orange-400',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    path: '/farmer-entrance/field',
    icon: Sprout,
    title: 'Field consumables',
    subtitle: 'Seeds, inputs and tools for the farm',
    accent: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    path: '/farmer-entrance/shared',
    icon: Tractor,
    title: 'Shared infra & rental',
    subtitle: 'Equipment, cold storage and processing you do not own',
    accent: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-600',
  },
]

function FarmerEntranceHubPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          One farmer, four different decisions
        </h1>
        <p className="text-lg text-gray-600">
          Selling a harvest, feeding your family, buying seed, and renting a machine are four
          different decisions with four different budgets. We do not put them all behind one
          login. Look around any door below first — signing in only happens when you take an
          action, and only for that section.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {DOORS.map((door) => {
          const Icon = door.icon
          return (
            <Link
              key={door.path}
              to={door.path}
              className={`bg-white rounded-lg shadow p-6 border-2 transition flex flex-col ${door.accent}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${door.iconBg}`}>
                <Icon className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">{door.title}</h2>
              <p className="text-gray-600 mb-4">{door.subtitle}</p>
              <span className="mt-auto inline-flex items-center text-green-700 font-medium">
                Look inside <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="max-w-3xl mx-auto mt-12 bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Each section signs in separately</h3>
          <p className="text-gray-600 text-sm">
            Opening your household basket does not expose your selling records, and renting a
            machine does not open your bank passport. You choose what to share, and when.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FarmerEntranceHubPage
