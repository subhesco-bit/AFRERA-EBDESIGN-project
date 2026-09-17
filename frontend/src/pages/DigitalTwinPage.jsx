import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Radio, CloudSun, Sprout, ArrowRight, Plus } from 'lucide-react';
import { digitalTwinAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// 2026-09-16: was a 1-line placeholder, then (earlier this session)
// rewritten as honest static content after checking `/api/digitaltwin`
// (routes/digitalTwinRoutes.js) and finding only a bare "Route
// operational" scaffold. That check missed a *different* real,
// DB-backed implementation at `/api/v1/digital-twin`
// (services/legacy/digitalTwinService.js - create/list/get/simulate/
// ingest-sensor-data, digital_twins table, real migrations 072/094) -
// found during a later duplicate-service audit and now mounted (see
// index.js). `digitalTwinAPI` in api.js already pointed at this exact
// path, added correctly in anticipation before this backend was found.
// Real data now drives the page; the static concept cards and
// monitoring-page links stay since they're still accurate and useful.
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
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = useState('');
  const [twinName, setTwinName] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['digital-twins'],
    queryFn: () => digitalTwinAPI.getDigitalTwin().then((r) => r.data.twins || []),
  });

  const createTwin = useMutation({
    mutationFn: () =>
      digitalTwinAPI.createDigitalTwin({ farmId, configuration: { name: twinName || undefined } }),
    onSuccess: () => {
      setFarmId('');
      setTwinName('');
      queryClient.invalidateQueries({ queryKey: ['digital-twins'] });
    },
  });

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

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your digital twins</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (farmId.trim()) createTwin.mutate();
          }}
          className="flex flex-wrap gap-2 mb-6"
        >
          <Input
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            placeholder="Farm ID"
            className="w-48"
            aria-label="Farm ID"
          />
          <Input
            value={twinName}
            onChange={(e) => setTwinName(e.target.value)}
            placeholder="Twin name (optional)"
            className="w-56"
            aria-label="Twin name"
          />
          <Button type="submit" disabled={!farmId.trim() || createTwin.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            {createTwin.isPending ? 'Creating...' : 'Create twin'}
          </Button>
        </form>
        {createTwin.isError && (
          <p className="text-sm text-red-600 mb-4">
            Failed to create digital twin: {createTwin.error?.response?.data?.error || createTwin.error?.message}
          </p>
        )}

        {isLoading && <p className="text-gray-500">Loading digital twins...</p>}
        {error && <p className="text-red-600">Failed to load digital twins: {error.message}</p>}
        {!isLoading && !error && (data || []).length === 0 && (
          <p className="text-gray-500 text-sm">No digital twins yet. Create one for a farm above.</p>
        )}
        {!isLoading && !error && (data || []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((twin) => (
              <div key={twin.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900">{twin.name}</h3>
                <p className="text-sm text-gray-600">{twin.farmName || `Farm ${twin.farmId}`}</p>
                {twin.location && <p className="text-xs text-gray-500">{twin.location}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  Last update: {twin.lastUpdate ? new Date(twin.lastUpdate).toLocaleString() : 'never'}
                </p>
              </div>
            ))}
          </div>
        )}
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
