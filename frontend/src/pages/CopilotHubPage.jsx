import { useState } from 'react';
import CopilotChat, { COPILOT_META } from '../components/AI/CopilotChat';

/**
 * Copilot Hub
 *
 * 2026-08-31: presents all 6 domain-specific "16gm" AI copilots (Finance,
 * Logistics, Warehouse, Insurance, Nutrition, Marketplace) that had a real,
 * complete backend and API client but no UI at all — see CopilotChat.jsx
 * for the full context. One selectable hub rather than 6 separate bespoke
 * pages, to make the already-real backend actually usable now; richer,
 * domain-specific dashboards (route maps for Logistics, inventory layout
 * for Warehouse, etc.) remain a real follow-up, not delivered here.
 */
function CopilotHubPage() {
  const [active, setActive] = useState('finance');
  const types = Object.keys(COPILOT_META);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Copilots</h1>
        <p className="text-gray-600">Domain-specific AI assistants for finance, logistics, warehouse, insurance, nutrition, and marketplace questions — answered from your real, recorded data where available.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {types.map((type) => {
          const meta = COPILOT_META[type];
          return (
            <button
              key={type}
              onClick={() => setActive(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${
                active === type ?
                  'bg-blue-600 text-white border-blue-600' :
                  'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{meta.icon}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      <CopilotChat copilotType={active} />
    </div>
  );
}

export default CopilotHubPage;
