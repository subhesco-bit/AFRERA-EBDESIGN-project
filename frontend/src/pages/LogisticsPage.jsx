import { Link } from 'react-router-dom';
import { Truck, Snowflake, AlertTriangle, CloudSun, MapPinned, ArrowRight } from 'lucide-react';

// 2026-09-16: was a 1-line placeholder (`<h1>LogisticsPage</h1>`), the
// live farmer-only `/logistics` route rendering nothing real. Checked for
// a real backend first: services/api.js's `logisticsAPI`
// (getShipments/createShipment) points at `/logistics/shipments`, which
// doesn't match the real mount (`/api/logistics` ->
// services/legacy/logisticsService.js) even ignoring the path mismatch -
// that service is a create/get-by-id shipment CRUD backend (auth-gated,
// operates on a specific shipment id), not a public "browse shipments"
// list a landing page could reasonably call. Built instead as honest
// static content using the platform's own established positioning ("Cold
// chain and delivery coordination from farm to buyer" - see
// HomePage.jsx / Footer.jsx) plus real navigation into the actually
// routed logistics-adjacent pages.
const features = [
  {
    icon: Snowflake,
    title: 'Cold chain',
    description: 'Temperature-controlled handling to keep perishable produce fresh in transit.',
  },
  {
    icon: MapPinned,
    title: 'Farm-to-buyer delivery',
    description: 'Delivery coordination that connects farmers directly with buyers.',
  },
  {
    icon: AlertTriangle,
    title: 'Disruption tracking',
    description: 'Report and monitor blockades, bandhs, and other events affecting routes.',
  },
];

export default function LogisticsPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <Truck className="w-10 h-10 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Manage your logistics and shipping
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cold chain and delivery coordination from farm to buyer, built to handle the
            realities of Northeast India's terrain and infrastructure.
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/logistics-provider"
            className="flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <Truck className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
              Logistics provider portal
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-600">For registered logistics providers.</p>
          </Link>
          <Link
            to="/disruption"
            className="flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <AlertTriangle className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
              Civil disruption management
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-600">Report and track blockades affecting routes.</p>
          </Link>
          <Link
            to="/climate"
            className="flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <CloudSun className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
              Climate & weather
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-600">Forecasts that affect delivery planning.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
