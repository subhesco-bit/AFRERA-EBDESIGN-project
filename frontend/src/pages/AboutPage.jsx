import { Link } from 'react-router-dom';
import {
  ShoppingBasket,
  Users,
  Landmark,
  Building2,
  Truck,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';

// 2026-09-16: was a 1-line placeholder (`<h1>About</h1>`), the live
// `/about` route rendering nothing real. Built from the route's own
// metadata in config/routes.js ("AFRERA connects farmers, buyers,
// government, financial institutions and service providers on one
// platform") and Footer.jsx's already-established tagline and contact
// details - no fabricated stakeholder counts or business metrics, just
// real navigation to routes that genuinely exist.
const stakeholders = [
  {
    icon: Users,
    title: 'Farmers',
    description:
      'List produce, manage land records, track harvests, and access advisory tools built for smallholder operations.',
    to: '/farmer-entrance',
    linkLabel: 'Farmer entrance',
  },
  {
    icon: ShoppingBasket,
    title: 'Buyers',
    description:
      'Source fresh produce and agricultural products directly from farmers and cooperatives, with transparent pricing.',
    to: '/marketplace',
    linkLabel: 'Browse marketplace',
  },
  {
    icon: Landmark,
    title: 'Financial institutions',
    description:
      'Banks and lenders review credit signals, payments, and farmer finance performance through a dedicated portal.',
    to: '/banker-dashboard',
    linkLabel: 'Banker dashboard',
  },
  {
    icon: Truck,
    title: 'Logistics & service providers',
    description:
      'Cold chain operators and logistics providers coordinate delivery from farm to buyer across the platform.',
    to: '/logistics-provider',
    linkLabel: 'Logistics provider portal',
  },
  {
    icon: Building2,
    title: 'Government & institutions',
    description:
      'Government partners get oversight into subsidy programs, compliance, and agricultural sector activity.',
    to: '/government-dashboard',
    linkLabel: 'Government dashboard',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">About AFRERA</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Empowering farmers and connecting rural India through technology and fair trade
            practices. AFRERA brings farmers, buyers, financial institutions, logistics
            providers, and government partners together on one platform.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Who the platform is for</h2>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Every vertical on AFRERA is built around a specific participant in the agricultural
          economy. Here's who we serve and where to find them.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stakeholders.map(({ icon: Icon, title, description, to, linkLabel }) => (
            <div
              key={title}
              className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col"
            >
              <Icon className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 mb-4 flex-1">{description}</p>
              <Link
                to={to}
                className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
              >
                {linkLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our mission</h2>
              <p className="text-gray-600 mb-4">
                AFRERA exists to bridge the gap between rural farmers and urban markets in
                Northeast India - providing fair pricing, financial inclusion, agricultural
                advisory services, and a transparent supply chain from field to buyer.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Get in touch</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>
                    Northeast India Hub
                    <br />
                    Guwahati, Assam 781001
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0 text-green-600" />
                  <span>+91 1800-123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0 text-green-600" />
                  <span>support@afrera.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
