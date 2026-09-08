import { useState } from 'react';
import { Truck, PackageSearch, Wrench } from 'lucide-react';
import ActionCard from '../components/common/ActionCard';
import { freightPoolingAPI, returnLoadBoardAPI, equipmentExchangeAPI } from '../services/api';

/**
 * Logistics matching hub: three real, mounted backend route files that had
 * zero frontend caller anywhere in the app -
 * backend/src/routes/freightPoolingRoutes.js (/api/v1/freight-pooling),
 * backend/src/routes/returnLoadBoardRoutes.js (/api/v1/return-load-board),
 * backend/src/routes/equipmentExchangeRoutes.js (/api/v1/equipment-exchange).
 * Grouped here since all three are logistics-side matching/marketplace
 * operations (action/lookup-oriented, not CRUD list pages), following the
 * ActionCard pattern from WaterManagementPage.jsx.
 */
const TABS = [
  { id: 'freight', label: 'Freight Pooling', icon: Truck },
  { id: 'returns', label: 'Return-Load Board', icon: PackageSearch },
  { id: 'equipment', label: 'Equipment Exchange', icon: Wrench },
];

function LogisticsMatchingPage() {
  const [tab, setTab] = useState('freight');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Logistics Matching</h1>
        <p className="text-gray-600">Full-truck freight pooling, return-load backhaul board, and second-use equipment exchange</p>
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

      {tab === 'freight' && (
        <div>
          <ActionCard
            title="Find Poolable Shipments"
            description="Find shipments that can share a truck between an origin and destination."
            fields={[{ name: 'originAddress', label: 'Origin address' }, { name: 'destinationAddress', label: 'Destination address' }]}
            onRun={(v) => freightPoolingAPI.findPoolableShipments(v.originAddress, v.destinationAddress)}
          />
          <ActionCard
            title="Create Pool Window"
            description="Open a new full-truck pooling window."
            hasJsonPayload
            jsonLabel="Window data (JSON)"
            jsonPlaceholder='{"originAddress": "Guwahati", "destinationAddress": "Shillong", "vehicleCapacityKg": 5000, "closesAt": "2026-09-01T18:00:00Z"}'
            onRun={(_, payload) => freightPoolingAPI.createPoolWindow(payload)}
          />
          <ActionCard
            title="List Open Pool Windows"
            description="List all currently open pooling windows."
            onRun={() => freightPoolingAPI.listOpenWindows()}
          />
          <ActionCard
            title="Get Pool Window"
            description="Get details for a specific pooling window."
            fields={[{ name: 'windowId', label: 'Window ID' }]}
            onRun={(v) => freightPoolingAPI.getPoolWindow(v.windowId)}
          />
          <ActionCard
            title="Join Pool Window"
            description="Add a shipment to an open pooling window."
            fields={[{ name: 'windowId', label: 'Window ID' }, { name: 'shipmentId', label: 'Shipment ID' }]}
            onRun={(v) => freightPoolingAPI.joinPoolWindow(v.windowId, v.shipmentId)}
          />
          <ActionCard
            title="Close and Dispatch Window"
            description="Close a pooling window and dispatch the pooled truck."
            fields={[{ name: 'windowId', label: 'Window ID' }]}
            onRun={(v) => freightPoolingAPI.closeAndDispatch(v.windowId)}
          />
        </div>
      )}

      {tab === 'returns' && (
        <div>
          <ActionCard
            title="Post Return Capacity"
            description="Post available backhaul/return capacity to the board."
            hasJsonPayload
            jsonLabel="Posting data (JSON)"
            jsonPlaceholder='{"originAddress": "Shillong", "destinationAddress": "Guwahati", "capacityKg": 2000, "availableFrom": "2026-09-01"}'
            onRun={(_, payload) => returnLoadBoardAPI.postCapacity(payload)}
          />
          <ActionCard
            title="Search Available Capacity"
            description="Search postings by route and minimum capacity."
            fields={[
              { name: 'originAddress', label: 'Origin address' },
              { name: 'destinationAddress', label: 'Destination address' },
              { name: 'minCapacityKg', label: 'Min capacity (kg)', type: 'number' },
            ]}
            onRun={(v) => returnLoadBoardAPI.searchAvailable(v)}
          />
          <ActionCard
            title="Book Posting"
            description="Book a return-load posting for a shipment."
            fields={[{ name: 'postingId', label: 'Posting ID' }, { name: 'shipmentId', label: 'Shipment ID' }]}
            onRun={(v) => returnLoadBoardAPI.bookPosting(v.postingId, v.shipmentId)}
          />
          <ActionCard
            title="Cancel Posting"
            description="Cancel your own return-load posting."
            fields={[{ name: 'postingId', label: 'Posting ID' }]}
            onRun={(v) => returnLoadBoardAPI.cancelPosting(v.postingId)}
          />
        </div>
      )}

      {tab === 'equipment' && (
        <div>
          <ActionCard
            title="Create Equipment Listing"
            description="List second-use equipment for exchange/rent/sale."
            hasJsonPayload
            jsonLabel="Listing data (JSON)"
            jsonPlaceholder='{"equipmentType": "Tractor", "stateId": 1, "pricingType": "rent", "pricePerDay": 1500, "description": "Well-maintained 45HP tractor"}'
            onRun={(_, payload) => equipmentExchangeAPI.createListing(payload)}
          />
          <ActionCard
            title="List Available Equipment"
            description="Browse available equipment listings by type/state/pricing."
            fields={[
              { name: 'equipmentType', label: 'Equipment type' },
              { name: 'stateId', label: 'State ID' },
              { name: 'pricingType', label: 'Pricing type' },
            ]}
            onRun={(v) => equipmentExchangeAPI.listAvailable(v)}
          />
          <ActionCard
            title="Get Listing"
            description="Get details for a specific equipment listing."
            fields={[{ name: 'listingId', label: 'Listing ID' }]}
            onRun={(v) => equipmentExchangeAPI.getListing(v.listingId)}
          />
          <ActionCard
            title="Reserve Listing"
            description="Reserve an equipment listing."
            fields={[{ name: 'listingId', label: 'Listing ID' }]}
            onRun={(v) => equipmentExchangeAPI.reserveListing(v.listingId)}
          />
          <ActionCard
            title="Complete Exchange"
            description="Mark an equipment exchange as complete."
            fields={[{ name: 'listingId', label: 'Listing ID' }]}
            onRun={(v) => equipmentExchangeAPI.completeExchange(v.listingId)}
          />
          <ActionCard
            title="Withdraw Listing"
            description="Withdraw your own equipment listing."
            fields={[{ name: 'listingId', label: 'Listing ID' }]}
            onRun={(v) => equipmentExchangeAPI.withdrawListing(v.listingId)}
          />
        </div>
      )}
    </div>
  );
}

export default LogisticsMatchingPage;
