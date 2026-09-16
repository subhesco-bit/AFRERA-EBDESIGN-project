import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Calculator, BadgeCheck, ArrowRight } from 'lucide-react';

// 2026-09-16: was a 1-line placeholder (`<h1>InsurancePage</h1>`), the
// live farmer-only `/insurance` route rendering nothing real. Checked for
// a real backend first: services/api.js's `insuranceAPI`
// (getPolicies/createPolicy) points at `/insurance/policies`, which
// doesn't match the real mount (`/api/insurance` ->
// services/legacy/insuranceService.js) even ignoring the path mismatch -
// that service is a create/get-by-id policy CRUD backend (auth-gated,
// operates on a specific policy id), not a public "browse insurance
// products" list a landing page could reasonably call. Built instead as
// honest static content using the platform's own established positioning
// ("Crop and asset protection built for smallholder farmers" - see
// HomePage.jsx / Footer.jsx) plus real navigation into the actually
// routed insurance-adjacent pages.
const features = [
  {
    icon: ShieldCheck,
    title: 'Crop protection',
    description: 'Coverage for crop loss from weather events, pests, and other agricultural risks.',
  },
  {
    icon: FileText,
    title: 'Asset protection',
    description: 'Protect farm equipment, livestock, and other agricultural assets.',
  },
  {
    icon: BadgeCheck,
    title: 'Built for smallholders',
    description: 'Policies designed around the realities of smallholder farming operations.',
  },
];

export default function InsurancePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <ShieldCheck className="w-10 h-10 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Agricultural insurance options
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Crop and asset protection built for smallholder farmers, so a bad season or an
            unexpected loss doesn't set you back for good.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-lg p-6">
              <Icon className="w-8 h-8 text-green-600 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Already have a policy?</h2>
            <p className="text-sm text-gray-600">
              Manage your existing policies, track claims, and review coverage.
            </p>
          </div>
          <Link
            to="/insurance-management"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition whitespace-nowrap"
          >
            Insurance management
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <Link
            to="/financial/emi-calculator"
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <Calculator className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">EMI Calculator</h3>
              <p className="text-xs text-gray-600">Plan premium and loan payments together.</p>
            </div>
          </Link>
          <Link
            to="/financial/credit-score"
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <BadgeCheck className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Credit Score</h3>
              <p className="text-xs text-gray-600">Check your credit standing for financing.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
