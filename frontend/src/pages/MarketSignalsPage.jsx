import { useState } from 'react';
import { AlertTriangle, Award, ShieldAlert } from 'lucide-react';
import ActionCard from '../components/common/ActionCard';
import { glutWarningAPI, sellerRankingAPI, civilDisruptionAPI } from '../services/api';

/**
 * Market signals hub: three real, mounted backend route files that had zero
 * frontend caller anywhere in the app -
 * backend/src/routes/glutWarningRoutes.js (/api/v1/glut-warning),
 * backend/src/routes/sellerRankingRoutes.js (/api/v1/seller-ranking),
 * backend/src/routes/civilDisruptionRoutes.js (/api/v1/civil-disruptions).
 * Grouped here since all three are read/action oriented market-risk signals
 * a farmer/trader would check before selling or shipping, following the
 * ActionCard pattern from WaterManagementPage.jsx.
 */
const TABS = [
  { id: 'glut', label: 'Glut Warning', icon: AlertTriangle },
  { id: 'sellers', label: 'Seller Ranking', icon: Award },
  { id: 'disruptions', label: 'Civil Disruptions', icon: ShieldAlert },
];

function MarketSignalsPage() {
  const [tab, setTab] = useState('glut');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Market Signals</h1>
        <p className="text-gray-600">Oversupply (glut) early-warning, seller trust ranking, and civil disruption / blockade risk</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <t.icon className="w-5 h-5 mr-2" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'glut' && (
        <div>
          <ActionCard
            title="Check Glut Risk"
            description="Check oversupply (glut) risk for a category, optionally scoped to a state."
            fields={[{ name: 'categoryId', label: 'Category ID' }, { name: 'stateId', label: 'State ID' }]}
            onRun={(v) => glutWarningAPI.checkGlutRisk(v.categoryId, v.stateId)}
          />
          <ActionCard
            title="Scan All Categories"
            description="Scan all categories for glut risk, optionally scoped to a state."
            fields={[{ name: 'stateId', label: 'State ID' }]}
            onRun={(v) => glutWarningAPI.scanAllCategories(v.stateId)}
          />
        </div>
      )}

      {tab === 'sellers' && (
        <div>
          <ActionCard
            title="Get Ranked Sellers"
            description="Get DB-backed trust-ranked sellers, optionally filtered by category/state."
            fields={[
              { name: 'categoryId', label: 'Category ID' },
              { name: 'stateId', label: 'State ID' },
              { name: 'limit', label: 'Limit', type: 'number' },
            ]}
            onRun={(v) => sellerRankingAPI.getRankedSellers(v)}
          />
          <ActionCard
            title="Get Seller Trust Score"
            description="Get the trust score for a specific seller."
            fields={[{ name: 'userId', label: 'Seller User ID' }]}
            onRun={(v) => sellerRankingAPI.getSellerTrustScore(v.userId)}
          />
        </div>
      )}

      {tab === 'disruptions' && (
        <div>
          <ActionCard
            title="Report Civil Disruption"
            description="Report a new civil disruption / blockade event."
            hasJsonPayload
            jsonLabel="Event data (JSON)"
            jsonPlaceholder='{"state": "Assam", "district": "Kamrup", "type": "road_blockade", "description": "Highway blocked near Rangia", "startDate": "2026-08-29"}'
            onRun={(_, payload) => civilDisruptionAPI.report(payload)}
          />
          <ActionCard
            title="List Active Disruptions"
            description="List currently active disruptions, optionally filtered by state/district."
            fields={[{ name: 'state', label: 'State' }, { name: 'district', label: 'District' }]}
            onRun={(v) => civilDisruptionAPI.listActive(v)}
          />
          <ActionCard
            title="Verify Disruption (Admin)"
            description="Verify a reported disruption event. Requires admin."
            fields={[{ name: 'id', label: 'Disruption ID' }]}
            onRun={(v) => civilDisruptionAPI.verify(v.id)}
          />
          <ActionCard
            title="Resolve Disruption (Admin)"
            description="Mark a disruption as resolved with an end date. Requires admin."
            fields={[{ name: 'id', label: 'Disruption ID' }, { name: 'endDate', label: 'End date', placeholder: '2026-09-01' }]}
            onRun={(v) => civilDisruptionAPI.resolve(v.id, v.endDate)}
          />
          <ActionCard
            title="Check Shipment Risk"
            description="Check civil disruption risk for a specific shipment's route."
            fields={[{ name: 'shipmentId', label: 'Shipment ID' }]}
            onRun={(v) => civilDisruptionAPI.checkShipmentRisk(v.shipmentId)}
          />
        </div>
      )}
    </div>
  );
}

export default MarketSignalsPage;
