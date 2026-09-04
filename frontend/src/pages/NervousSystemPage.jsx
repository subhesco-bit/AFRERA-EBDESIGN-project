import { useState } from 'react';
import { Activity } from 'lucide-react';
import { nervousSystemAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/nervousSystemRoutes.js +
 * controllers/nervousSystemController.js + core/nervousSystem.js. Enterprise
 * route control modeled with a biological metaphor (brain/heart/neural
 * pathways/reflex arcs/sensors/motor functions/enterprise route control) -
 * six distinct sub-systems, so one tab per sub-system with ActionCards for
 * each operation, following the ComprehensiveERPPage tab pattern.
 */
const TABS = [
  ['brain', 'Brain'], ['heart', 'Heart'], ['neural', 'Neural Pathways'],
  ['reflex', 'Reflex Arcs'], ['sensor', 'Sensors'], ['motor', 'Motor Functions'],
  ['route', 'Route Control'], ['health', 'System Health'],
];

function NervousSystemPage() {
  const [tab, setTab] = useState('brain');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-rose-700" />
          Nervous System
        </h1>
        <p className="text-gray-600">Enterprise route control: central decision-making, heartbeat operations, neural pathways, reflex arcs, sensors and motor functions.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-rose-700 text-rose-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'brain' && (
        <>
          <ActionCard title="Process Event Through Brain" description="Route an event through the central decision-making brain." hasJsonPayload jsonPlaceholder='{"event_type": "order.created", "entity_id": "123"}' onRun={(_, p) => nervousSystemAPI.processEventThroughBrain(p)} />
          <ActionCard title="Brain Decision History" description="Get the recent decision history." fields={[{ name: 'limit', label: 'Limit', type: 'number', placeholder: '10' }]} onRun={(v) => nervousSystemAPI.getBrainDecisionHistory(v)} />
          <ActionCard title="Brain Focus" description="Get the brain's current focus and consciousness state." onRun={() => nervousSystemAPI.getBrainFocus()} />
        </>
      )}

      {tab === 'heart' && (
        <>
          <ActionCard title="Start Heart Beat" description="Start the core-operations heartbeat." onRun={() => nervousSystemAPI.startHeartBeat()} />
          <ActionCard title="Stop Heart Beat" description="Stop the core-operations heartbeat." onRun={() => nervousSystemAPI.stopHeartBeat()} />
          <ActionCard title="Heart Beat Status" description="Get the current heartbeat status." onRun={() => nervousSystemAPI.getHeartBeatStatus()} />
        </>
      )}

      {tab === 'neural' && (
        <>
          <ActionCard title="Create Neural Pathway" description="Create a neural pathway between two modules." fields={[{ name: 'fromModule', label: 'From Module' }, { name: 'toModule', label: 'To Module' }, { name: 'strength', label: 'Strength', type: 'number', placeholder: '0.5' }]} onRun={(v) => nervousSystemAPI.createNeuralPathway({ ...v, strength: v.strength ? Number(v.strength) : undefined })} />
          <ActionCard title="Neural Pathways" description="List all neural pathways." onRun={() => nervousSystemAPI.getNeuralPathways()} />
          <ActionCard title="Strengthen Pathway" description="Strengthen a neural pathway from usage." fields={[{ name: 'pathwayId', label: 'Pathway ID', placeholder: 'ecommerce-inventory' }]} onRun={(v) => nervousSystemAPI.strengthenNeuralPathway(v.pathwayId)} />
        </>
      )}

      {tab === 'reflex' && (
        <>
          <ActionCard title="Create Reflex Arc" description="Create an automatic reflex response to a trigger event." fields={[{ name: 'triggerEvent', label: 'Trigger Event' }, { name: 'responseAction', label: 'Response Action' }]} hasJsonPayload jsonLabel="Condition (optional)" jsonPlaceholder='{"threshold": 10}' onRun={(v, p) => nervousSystemAPI.createReflexArc({ ...v, condition: Object.keys(p || {}).length ? p : null })} />
          <ActionCard title="Reflex Arcs" description="List all registered reflex arcs." onRun={() => nervousSystemAPI.getReflexArcs()} />
          <ActionCard title="Trigger Reflex" description="Trigger a reflex response for an event." fields={[{ name: 'triggerEvent', label: 'Trigger Event' }]} hasJsonPayload jsonLabel="Context" jsonPlaceholder='{"entity_id": "123"}' onRun={(v, p) => nervousSystemAPI.triggerReflex({ triggerEvent: v.triggerEvent, context: p })} />
        </>
      )}

      {tab === 'sensor' && (
        <>
          <ActionCard title="Register Sensor" description="Register a new sensor." fields={[{ name: 'sensorId', label: 'Sensor ID' }]} hasJsonPayload jsonLabel="Sensor Config" jsonPlaceholder='{"type": "database", "query": "SELECT 1"}' onRun={(v, p) => nervousSystemAPI.registerSensor({ sensorId: v.sensorId, sensorConfig: p })} />
          <ActionCard title="Get Sensor Data" description="Collect and return a sensor's latest reading." fields={[{ name: 'sensorId', label: 'Sensor ID' }]} onRun={(v) => nervousSystemAPI.getSensorData(v.sensorId)} />
          <ActionCard title="Sensors Status" description="Get the status of all registered sensors." onRun={() => nervousSystemAPI.getSensorsStatus()} />
        </>
      )}

      {tab === 'motor' && (
        <>
          <ActionCard title="Execute Motor Function" description="Execute a named motor function/action." fields={[{ name: 'functionName', label: 'Function Name' }]} hasJsonPayload jsonLabel="Parameters" jsonPlaceholder='{"productId": "123"}' onRun={(v, p) => nervousSystemAPI.executeMotorFunction({ functionName: v.functionName, parameters: p })} />
          <ActionCard title="Active Motor Functions" description="List currently active motor functions." onRun={() => nervousSystemAPI.getActiveMotorFunctions()} />
        </>
      )}

      {tab === 'route' && (
        <>
          <ActionCard title="Register Enterprise Route" description="Register a new enterprise-controlled route." hasJsonPayload jsonPlaceholder='{"routeId": "custom_route", "path": "/api/v1/x", "module": "x", "priority": "normal"}' onRun={(_, p) => nervousSystemAPI.registerEnterpriseRoute(p)} />
          <ActionCard title="Route Request" description="Route a request through enterprise control." hasJsonPayload jsonPlaceholder='{"routeConfig": {"routeId": "custom_route"}, "request": {}}' onRun={(_, p) => nervousSystemAPI.routeRequest(p)} />
          <ActionCard title="Optimal Route" description="Get the optimal active route for the current context." onRun={() => nervousSystemAPI.getOptimalRoute()} />
          <ActionCard title="Deactivate Route" description="Deactivate an enterprise-controlled route." fields={[{ name: 'routeId', label: 'Route ID' }]} onRun={(v) => nervousSystemAPI.deactivateEnterpriseRoute(v.routeId)} />
        </>
      )}

      {tab === 'health' && (
        <ActionCard title="Nervous System Health" description="Get an overall health snapshot across brain, heart, neural, sensors, motor and routes." onRun={() => nervousSystemAPI.getNervousSystemHealth()} />
      )}
    </div>
  );
}

export default NervousSystemPage;
