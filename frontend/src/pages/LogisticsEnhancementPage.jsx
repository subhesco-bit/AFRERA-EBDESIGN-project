import { useState } from 'react';
import { Truck } from 'lucide-react';
import { logisticsEnhancementAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/logisticsEnhancementRoutes.js +
 * services/legacy/logisticsEnhancementService.js. Four distinct sub-domains
 * (fleet, tracking, temperature, warehouse) plus driver location - tabbed,
 * following the ComprehensiveERPPage pattern. Route-optimization,
 * warehouse-performance, inventory-movement and delivery-scheduling
 * endpoints are excluded - the route file itself returns 501 NOT_IMPLEMENTED
 * for those (no backing service methods exist).
 */
const TABS = [
  ['fleet', 'Fleet'], ['tracking', 'Tracking'], ['temperature', 'Temperature'],
  ['warehouse', 'Warehouse'], ['drivers', 'Driver Location'],
];

function LogisticsEnhancementPage() {
  const [tab, setTab] = useState('fleet');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Truck className="w-6 h-6 mr-2 text-amber-700" />
          Logistics Enhancement
        </h1>
        <p className="text-gray-600">Fleet management, real-time shipment tracking, cold-chain temperature monitoring and warehouse integration.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-amber-700 text-amber-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'fleet' && (
        <>
          <ActionCard title="Add Vehicle" description="Add a vehicle to the fleet." hasJsonPayload jsonPlaceholder='{"type": "truck", "registrationNumber": "AS01AB1234", "capacity": 5000, "make": "Tata", "model": "407", "year": 2022, "driverId": null, "features": []}' onRun={(_, p) => logisticsEnhancementAPI.addVehicle(p)} />
          <ActionCard title="Fleet Vehicles" description="List fleet vehicles, optionally filtered by type/status." fields={[{ name: 'type', label: 'Type' }, { name: 'status', label: 'Status' }]} onRun={(v) => logisticsEnhancementAPI.getFleet(v)} />
          <ActionCard title="Get Vehicle" description="Get a single vehicle by ID." fields={[{ name: 'vehicleId', label: 'Vehicle ID' }]} onRun={(v) => logisticsEnhancementAPI.getVehicle(v.vehicleId)} />
          <ActionCard title="Update Vehicle" description="Update a vehicle's status, driver, location, mileage or fuel level." fields={[{ name: 'vehicleId', label: 'Vehicle ID' }]} hasJsonPayload jsonPlaceholder='{"status": "active", "mileage": 12000}' onRun={(v, p) => logisticsEnhancementAPI.updateVehicle(v.vehicleId, p)} />
          <ActionCard title="Schedule Maintenance" description="Schedule maintenance for a vehicle." fields={[{ name: 'vehicleId', label: 'Vehicle ID' }]} hasJsonPayload jsonPlaceholder='{"type": "service", "scheduledDate": "2026-09-01", "description": "Oil change", "estimatedCost": 2000, "priority": "normal"}' onRun={(v, p) => logisticsEnhancementAPI.scheduleMaintenance(v.vehicleId, p)} />
        </>
      )}

      {tab === 'tracking' && (
        <>
          <ActionCard title="Update Tracking" description="Post a tracking update for a shipment." fields={[{ name: 'shipmentId', label: 'Shipment ID' }]} hasJsonPayload jsonPlaceholder='{"latitude": 26.14, "longitude": 91.73, "speed": 40, "heading": 90, "timestamp": "2026-08-29T10:00:00Z", "status": "in_transit"}' onRun={(v, p) => logisticsEnhancementAPI.updateTracking(v.shipmentId, p)} />
          <ActionCard title="Tracking History" description="Get the tracking history for a shipment." fields={[{ name: 'shipmentId', label: 'Shipment ID' }]} onRun={(v) => logisticsEnhancementAPI.getTracking(v.shipmentId)} />
          <ActionCard title="Live Tracking" description="Get the latest live tracking point for a shipment." fields={[{ name: 'shipmentId', label: 'Shipment ID' }]} onRun={(v) => logisticsEnhancementAPI.getLiveTracking(v.shipmentId)} />
          <ActionCard title="Set Geofence" description="Set a geofence for a shipment." fields={[{ name: 'shipmentId', label: 'Shipment ID' }]} hasJsonPayload jsonPlaceholder='{"type": "circle", "radius": 500, "coordinates": {"lat": 26.14, "lng": 91.73}, "alertEnabled": true}' onRun={(v, p) => logisticsEnhancementAPI.setGeofence(v.shipmentId, p)} />
        </>
      )}

      {tab === 'temperature' && (
        <>
          <ActionCard title="Record Temperature" description="Record a temperature/humidity reading for a shipment." fields={[{ name: 'shipmentId', label: 'Shipment ID' }]} hasJsonPayload jsonPlaceholder='{"sensorId": "S-1", "temperature": 4.5, "humidity": 60, "timestamp": "2026-08-29T10:00:00Z", "zone": "cold"}' onRun={(v, p) => logisticsEnhancementAPI.recordTemperature(v.shipmentId, p)} />
          <ActionCard title="Temperature Data" description="Get temperature readings for a shipment, optionally date-filtered." fields={[{ name: 'shipmentId', label: 'Shipment ID' }, { name: 'startDate', label: 'Start Date' }, { name: 'endDate', label: 'End Date' }]} onRun={(v) => logisticsEnhancementAPI.getTemperatureData(v.shipmentId, { startDate: v.startDate, endDate: v.endDate })} />
          <ActionCard title="Temperature Alerts" description="Get configured temperature alerts for a shipment." fields={[{ name: 'shipmentId', label: 'Shipment ID' }]} onRun={(v) => logisticsEnhancementAPI.getTemperatureAlerts(v.shipmentId)} />
        </>
      )}

      {tab === 'warehouse' && (
        <>
          <ActionCard title="Add Warehouse" description="Register a new warehouse location." hasJsonPayload jsonPlaceholder='{"name": "Guwahati Cold Store", "location": {"lat": 26.14, "lng": 91.73}, "type": "cold_storage", "capacity": 10000, "zones": ["A", "B"], "features": []}' onRun={(_, p) => logisticsEnhancementAPI.createWarehouse(p)} />
          <ActionCard title="Warehouse Locations" description="List warehouses, optionally filtered." fields={[{ name: 'warehouseId', label: 'Warehouse ID' }, { name: 'zone', label: 'Zone' }, { name: 'status', label: 'Status' }]} onRun={(v) => logisticsEnhancementAPI.getWarehouses(v)} />
          <ActionCard title="Add Inventory" description="Add inventory to a warehouse." fields={[{ name: 'warehouseId', label: 'Warehouse ID' }]} hasJsonPayload jsonPlaceholder='{"productId": "P-1", "quantity": 100, "zone": "A", "location": "A-01", "expiryDate": "2026-12-01"}' onRun={(v, p) => logisticsEnhancementAPI.addInventory(v.warehouseId, p)} />
          <ActionCard title="Warehouse Inventory" description="Get inventory for a warehouse (warehouseId required)." fields={[{ name: 'warehouseId', label: 'Warehouse ID' }]} onRun={(v) => logisticsEnhancementAPI.getWarehouseInventory(v.warehouseId)} />
        </>
      )}

      {tab === 'drivers' && (
        <>
          <ActionCard title="Record Driver Location" description="Record a driver GPS ping. (0,0) is rejected as an unfixed GPS reading." hasJsonPayload jsonPlaceholder='{"driverId": "D-1", "shipmentId": "SH-1", "latitude": 26.14, "longitude": 91.73, "speedKmph": 42, "headingDeg": 90, "accuracyM": 8, "batteryPct": 65}' onRun={(_, p) => logisticsEnhancementAPI.recordDriverLocation(p)} />
          <ActionCard title="Active Drivers" description="Get the latest known position per driver (last 24h), flagging stale pings." fields={[{ name: 'staleAfterMinutes', label: 'Stale After (min)', type: 'number', placeholder: '30' }]} onRun={(v) => logisticsEnhancementAPI.getActiveDrivers(v)} />
          <ActionCard title="Shipment Trail" description="Get the combined driver + consignment breadcrumb trail for a shipment." fields={[{ name: 'id', label: 'Shipment ID' }]} onRun={(v) => logisticsEnhancementAPI.getShipmentTrail(v.id)} />
        </>
      )}
    </div>
  );
}

export default LogisticsEnhancementPage;
