import { Link } from 'react-router-dom';
import { Boxes, Radio, CloudSun, Sprout, ArrowRight } from 'lucide-react';

// 2026-09-16: was a 1-line placeholder (`<h1>DigitalTwinPage</h1>`), the
// live `/digital-twin` route (dashboardRoutes, role 'farmer' - see
// config/routes.js and App.jsx's RoleRoute) rendering nothing real.
// Checked for a real backend first: services/api.js's `digitalTwinAPI`
// (getDigitalTwin/createDigitalTwin) points at `/digital-twin`, and even
// the correct mount (`/api/digitaltwin` -> routes/digitalTwinRoutes.js)
// is a bare 38-line "Route operational" scaffold with no real simulation
// endpoint - not wired here, since there is genuinely nothing real to
// query. Built instead as honest static content describing what a
// digital twin means for a farm operation, plus real navigation into the
// actually routed monitoring pages that would feed one.
const concepts = [
  {
    icon: Radio,
    title: 'Live field data',
    description: 'IoT sensors and monitoring feed real-time conditions from your fields.',
  },
  {
    icon: Sprout,
    title: 'Crop modeling',
    description: 'A digital model of your crops helps track growth stages and health over time.',
  },
  {
    icon: CloudSun,
    title: 'Environmental context',
    description: 'Weather and climate data ground the model in real conditions, not guesswork.',
  },
];

export default function DigitalTwinPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <Boxes className="w-10 h-10 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Digital Twin</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A digital twin is a live model of your farm - built from the same field, crop, and
            climate data you already track on AFRERA, kept up to date as conditions change.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {concepts.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-lg p-6">
              <Icon className="w-8 h-8 text-green-600 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Feed your digital twin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/iot-monitoring"
            className="flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <Radio className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
              IoT Monitoring
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-600">Connect and monitor field sensor devices.</p>
          </Link>
          <Link
            to="/crop-monitoring"
            className="flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <Sprout className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
              Crop Monitoring
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-600">Track crop growth and field conditions.</p>
          </Link>
          <Link
            to="/climate"
            className="flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <CloudSun className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
              Climate & Weather
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-600">Bring in forecasts and climate context.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
