import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Package, CalendarDays, Truck, ShieldCheck, AlertTriangle, Fuel, Cog, Boxes, Clock } from 'lucide-react';
import {
  implementManagementAPI,
  equipmentInventoryAPI,
  equipmentRentalAPI,
  fleetManagementAPI,
  preventiveMaintenanceAPI,
  breakdownMaintenanceAPI,
  fuelManagementAPI,
  sparePartsAPI,
  assetLifecycleAPI,
} from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * Consolidated Machinery domain sub-modules, batch 4: M102 (Implement
 * Management), M103 (Equipment Inventory), M104 (Equipment Rental), M105
 * (Fleet Management), M106 (Preventive Maintenance), M107 (Breakdown
 * Maintenance), M108 (Fuel Management), M109 (Spare Parts Management), M110
 * (Asset Lifecycle Management). M101 (Tractor Management) already has a real
 * page (TractorManagementPage.jsx) — not touched here.
 *
 * Fleet Management (M105) is the one tab with genuine backend support:
 * backend/src/routes/logisticsEnhancements.js exposes a working
 * addVehicle/getFleet/getVehicle/updateVehicle/scheduleMaintenance CRUD at
 * /api/v1/logistics/fleet (no DELETE route, so remove is left unwired). The
 * other eight tabs have no backend route under any name.
 *
 * 2026-08-10 (wave 1): added a real "due for service" panel above the Fleet
 * tab's table, reading fleet_vehicles.next_maintenance_date and overdue
 * vehicle_maintenance work orders — see
 * logisticsEnhancementService.getMaintenanceDueList().
 */
const TABS = [
  { id: 'implements', label: 'Implements', icon: Wrench },
  { id: 'inventory', label: 'Equipment Inventory', icon: Package },
  { id: 'rental', label: 'Equipment Rental', icon: CalendarDays },
  { id: 'fleet', label: 'Fleet', icon: Truck },
  { id: 'preventive', label: 'Preventive Maintenance', icon: ShieldCheck },
  { id: 'breakdown', label: 'Breakdown Maintenance', icon: AlertTriangle },
  { id: 'fuel', label: 'Fuel', icon: Fuel },
  { id: 'parts', label: 'Spare Parts', icon: Cog },
  { id: 'lifecycle', label: 'Asset Lifecycle', icon: Boxes },
];

const IMPLEMENT_TYPES = ['Plough', 'Harrow', 'Seeder', 'Sprayer', 'Cultivator', 'Other'];
// equipment_inventory.status has no CHECK constraint (added 2026-08-24
// alongside the table) - matches the real column's default ('available').
const EQUIPMENT_STATUS = ['available', 'in_use', 'under_repair', 'retired'];
const VEHICLE_STATUS = ['Active', 'In Maintenance', 'Idle', 'Retired'];
const MAINT_STATUS = ['Scheduled', 'Completed', 'Overdue'];
const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric'];
// asset_lifecycle.status has no CHECK constraint - matches the real
// column's default ('active').
const ASSET_STATUS = ['active', 'disposed', 'written_off'];

function FleetMaintenanceDuePanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet-maintenance-due'],
    queryFn: async () => (await fleetManagementAPI.getMaintenanceDue()).data?.data ?? null,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-teal-600" />
        Due for Service
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        From recorded next-maintenance dates and open (overdue) maintenance work orders — not a prediction.
      </p>
      {isLoading && <div className="animate-pulse h-16 bg-gray-200 rounded-lg" />}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error loading maintenance status: {error.message}</div>}
      {data && (
        <>
          {data.vehicles.filter((v) => v.dueForService).length === 0 ? (
            <p className="text-gray-500 text-sm">No vehicles are due for service right now.</p>
          ) : (
            <div className="space-y-2">
              {data.vehicles.filter((v) => v.dueForService).map((v) => (
                <div key={v.vehicleId} className={`flex items-start gap-3 p-3 rounded-lg border ${v.calendarStatus === 'overdue' || v.overdueWorkOrders > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${v.calendarStatus === 'overdue' || v.overdueWorkOrders > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <div className="font-medium text-gray-800">
                      {v.registrationNumber} ({v.type})
                      {v.calendarStatus === 'overdue' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Overdue</span>}
                      {v.calendarStatus === 'due_soon' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Due soon</span>}
                      {v.overdueWorkOrders > 0 && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">{v.overdueWorkOrders} overdue work order{v.overdueWorkOrders === 1 ? '' : 's'}</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {v.nextMaintenanceDate ?
                        `Next maintenance ${v.nextMaintenanceDate} (${v.daysUntilNextMaintenance} day${Math.abs(v.daysUntilNextMaintenance) === 1 ? '' : 's'} ${v.daysUntilNextMaintenance < 0 ? 'overdue' : 'from now'})` :
                        'No next-maintenance date on record.'}
                      {v.mileage !== null && ` — ${v.mileage} km recorded`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {data.noScheduleCount} vehicle{data.noScheduleCount === 1 ? '' : 's'} with no maintenance schedule on record.
            "Due soon" window: {data.dueSoonWithinDays} days ({data.dueSoonWindowQuality}).
          </p>
        </>
      )}
    </div>
  );
}

function MachineryManagementPage() {
  const [activeTab, setActiveTab] = useState('implements');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Machinery Management</h1>
        <p className="text-gray-600">Implements, equipment inventory and rental, vehicle fleet, maintenance, fuel, spare parts and asset lifecycle</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'implements' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="implement-registry"
          idField="implement_registry_id"
          list={(params) => implementManagementAPI.getImplements(params)}
          create={(data) => implementManagementAPI.createImplement(data)}
          searchPlaceholder="Search by implement type..."
          emptyMessage="No implements registered yet."
          newLabel="Register Implement"
          backendNote="Backed by the real /modules/m102 endpoint (M102) - fixed 2026-08-24. This tab previously called a nonexistent /machinery-implements path; the real backend had no browse route at all until this fix added one. Register-only for now: the real update route edits a maintenance record, not general implement fields, and there is no delete route."
          initialForm={{ farmer_id: '', implement_type: 'Plough', brand: '', model: '', year: '', serial_number: '', working_width: '', compatible_tractor_hp: '', purchase_date: '', location: '', condition: 'good', status: 'active' }}
          requiredFields={['farmer_id', 'implement_type']}
          columns={[
            { key: 'implement_type', label: 'Type' },
            { key: 'brand', label: 'Brand' },
            { key: 'model', label: 'Model' },
            { key: 'condition', label: 'Condition' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'farmer_id', label: 'Farmer ID', required: true },
            { name: 'implement_type', label: 'Implement type', type: 'select', options: IMPLEMENT_TYPES, required: true },
            { name: 'brand', label: 'Brand' },
            { name: 'model', label: 'Model' },
            { name: 'year', label: 'Year', type: 'number' },
            { name: 'serial_number', label: 'Serial number' },
            { name: 'working_width', label: 'Working width (m)', type: 'number', step: '0.1' },
            { name: 'compatible_tractor_hp', label: 'Compatible tractor HP', type: 'number' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'location', label: 'Location' },
            { name: 'condition', label: 'Condition', type: 'select', options: ['good', 'fair', 'needs_repair'] },
            { name: 'status', label: 'Status', type: 'select', options: ['active', 'retired', 'sold'] },
          ]}
          stats={(items) => [
            { label: 'Implements', value: items.length },
            { label: 'Needs repair', value: items.filter((i) => i.condition === 'needs_repair').length },
          ]}
        />
      )}

      {activeTab === 'inventory' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="equipment-inventory"
          idField="equipment_registry_id"
          list={(params) => equipmentInventoryAPI.getEquipment(params)}
          create={(data) => equipmentInventoryAPI.createEquipment(data)}
          searchPlaceholder="Search by equipment category..."
          emptyMessage="No equipment registered yet."
          newLabel="Register Equipment"
          backendNote="Backed by the real /modules/m103 endpoint (M103) - fixed 2026-08-24. This tab previously called a nonexistent /equipment-inventory path; the real backend had no browse route at all until this fix added one. Register-only: the real update route only changes status, and there is no delete route."
          initialForm={{ farmer_id: '', equipment_category: '', equipment_name: '', brand: '', model: '', year: '', serial_number: '', purchase_date: '', purchase_cost: '', location: '', condition: 'good', status: 'available' }}
          requiredFields={['farmer_id', 'equipment_name']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'equipment_category', label: 'Category' },
            { key: 'serial_number', label: 'Serial No.' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'farmer_id', label: 'Farmer ID', required: true },
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'equipment_category', label: 'Category' },
            { name: 'brand', label: 'Brand' },
            { name: 'model', label: 'Model' },
            { name: 'year', label: 'Year', type: 'number' },
            { name: 'serial_number', label: 'Serial number' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'purchase_cost', label: 'Purchase cost (₹)', type: 'number' },
            { name: 'location', label: 'Location' },
            { name: 'condition', label: 'Condition', type: 'select', options: ['good', 'fair', 'needs_repair'] },
            { name: 'status', label: 'Status', type: 'select', options: EQUIPMENT_STATUS },
          ]}
          stats={(items) => [
            { label: 'Equipment items', value: items.length },
            { label: 'Available', value: items.filter((i) => i.status === 'available').length },
          ]}
        />
      )}

      {activeTab === 'rental' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="equipment-rental-listings"
          idField="rental_listing_id"
          list={(params) => equipmentRentalAPI.getRentals(params)}
          create={(data) => equipmentRentalAPI.createRental(data)}
          searchPlaceholder="Search by equipment name..."
          emptyMessage="No rental listings yet."
          newLabel="List Equipment for Rental"
          backendNote="Backed by the real /modules/m104 endpoint (M104, already had a real equipment_rental_listings table) - fixed 2026-08-24. This tab previously called a nonexistent /equipment-rental path; the real backend had no browse route at all until this fix added one. List-only for now: booking/performance/report are separate real actions not yet surfaced here, and there is no delete route."
          initialForm={{ owner_id: '', equipment_name: '', category: '', daily_rate: '', availability_start: '', availability_end: '', location: '', security_deposit: '' }}
          requiredFields={['owner_id', 'equipment_name', 'daily_rate']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'category', label: 'Category' },
            { key: 'daily_rate', label: 'Daily Rate (₹)' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'owner_id', label: 'Owner (farmer) ID', required: true },
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'category', label: 'Category' },
            { name: 'daily_rate', label: 'Daily rate (₹)', type: 'number', required: true },
            { name: 'availability_start', label: 'Available from', type: 'date' },
            { name: 'availability_end', label: 'Available until', type: 'date' },
            { name: 'location', label: 'Location' },
            { name: 'security_deposit', label: 'Security deposit (₹)', type: 'number' },
          ]}
          stats={(items) => [
            { label: 'Listings', value: items.length },
            { label: 'Available', value: items.filter((i) => i.status === 'available').length },
          ]}
        />
      )}

      {activeTab === 'fleet' && (
        <>
          <FleetMaintenanceDuePanel />
          <ResourceManager
            compact
            accent="teal"
            queryKey="fleet-management"
            idField="id"
            list={(params) => fleetManagementAPI.getFleet(params)}
            create={(data) => fleetManagementAPI.addVehicle(data)}
            update={(id, data) => fleetManagementAPI.updateVehicle(id, data)}
            searchPlaceholder="Search by vehicle..."
            emptyMessage="No fleet vehicles recorded yet."
            newLabel="Add Vehicle"
            backendNote="Real backend at /api/v1/logistics/fleet (logisticsEnhancementService) — this tab reads and writes it directly. There is no DELETE route, so removal is not available from here."
            initialForm={{ registration_number: '', vehicle_type: '', capacity: '', driver_name: '', status: 'Active', notes: '' }}
            requiredFields={['registration_number']}
            columns={[
              { key: 'registration_number', label: 'Registration' },
              { key: 'vehicle_type', label: 'Type' },
              { key: 'driver_name', label: 'Driver' },
              { key: 'capacity', label: 'Capacity' },
              { key: 'status', label: 'Status' },
            ]}
            fields={[
              { name: 'registration_number', label: 'Registration number', required: true },
              { name: 'vehicle_type', label: 'Vehicle type' },
              { name: 'capacity', label: 'Capacity' },
              { name: 'driver_name', label: 'Driver name' },
              { name: 'status', label: 'Status', type: 'select', options: VEHICLE_STATUS },
              { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
            ]}
            stats={(items) => [
              { label: 'Vehicles', value: items.length },
              { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
            ]}
          />
        </>
      )}

      {activeTab === 'preventive' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="preventive-maintenance"
          idField="id"
          list={(params) => preventiveMaintenanceAPI.getRecords(params)}
          create={(data) => preventiveMaintenanceAPI.createRecord(data)}
          update={(id, data) => preventiveMaintenanceAPI.updateRecord(id, data)}
          remove={(id) => preventiveMaintenanceAPI.deleteRecord(id)}
          searchPlaceholder="Search by equipment..."
          emptyMessage="No preventive maintenance recorded yet."
          newLabel="Schedule Maintenance"
          backendNote="Backend endpoint /preventive-maintenance has not been built yet — this tab is wired and ready to work once it is. Fleet vehicles specifically can also have maintenance scheduled via POST /logistics/fleet/:id/maintenance (see Fleet tab)."
          initialForm={{ equipment_name: '', maintenance_type: '', scheduled_date: '', completed_date: '', technician: '', cost: '', status: 'Scheduled' }}
          requiredFields={['equipment_name']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'maintenance_type', label: 'Type' },
            { key: 'scheduled_date', label: 'Scheduled' },
            { key: 'technician', label: 'Technician' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'maintenance_type', label: 'Maintenance type' },
            { name: 'scheduled_date', label: 'Scheduled date', type: 'date' },
            { name: 'completed_date', label: 'Completed date', type: 'date' },
            { name: 'technician', label: 'Technician' },
            { name: 'cost', label: 'Cost (₹)', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: MAINT_STATUS },
          ]}
          stats={(items) => [
            { label: 'Scheduled', value: items.length },
            { label: 'Overdue', value: items.filter((i) => i.status === 'Overdue').length },
          ]}
        />
      )}

      {activeTab === 'breakdown' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="equipment-breakdowns"
          idField="breakdown_id"
          list={(params) => breakdownMaintenanceAPI.getRecords(params)}
          create={(data) => breakdownMaintenanceAPI.createRecord(data)}
          searchPlaceholder="Search by equipment type..."
          emptyMessage="No breakdowns reported yet."
          newLabel="Report Breakdown"
          backendNote="Backed by the real /modules/m107 endpoint (M107, already had a real equipment_breakdowns table) - fixed 2026-08-24. This tab previously called a nonexistent /breakdown-maintenance path; the real backend had no browse route at all until this fix added one. Report-only for now: emergency-repair scheduling and downtime tracking are separate real actions not yet surfaced here, and there is no delete route."
          initialForm={{ farmer_id: '', equipment_id: '', equipment_type: '', breakdown_date: '', location: '', symptoms: '', severity: 'medium', reported_by: '', operator_notes: '' }}
          requiredFields={['farmer_id', 'equipment_type', 'breakdown_date']}
          columns={[
            { key: 'equipment_type', label: 'Equipment' },
            { key: 'severity', label: 'Severity' },
            { key: 'breakdown_date', label: 'Reported' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'farmer_id', label: 'Farmer ID', required: true },
            { name: 'equipment_id', label: 'Equipment ID' },
            { name: 'equipment_type', label: 'Equipment type', required: true },
            { name: 'breakdown_date', label: 'Breakdown date', type: 'date', required: true },
            { name: 'location', label: 'Location' },
            { name: 'symptoms', label: 'Symptoms', span: 2 },
            { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
            { name: 'reported_by', label: 'Reported by' },
            { name: 'operator_notes', label: 'Operator notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Breakdowns', value: items.length },
            { label: 'Critical', value: items.filter((i) => i.severity === 'critical').length },
          ]}
        />
      )}

      {activeTab === 'fuel' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="fuel-purchases"
          idField="purchase_id"
          list={(params) => fuelManagementAPI.getLogs(params)}
          create={(data) => fuelManagementAPI.createLog(data)}
          searchPlaceholder="Search by supplier..."
          emptyMessage="No fuel purchases logged yet."
          newLabel="Log Fuel Purchase"
          backendNote="Backed by the real /modules/m108 endpoint (M108) - fixed 2026-08-24. This tab previously called a nonexistent /fuel-management path; the real backend had no browse route at all until this fix added one. Logs purchases specifically (consumption is a separate real endpoint not yet surfaced here), and there is no update/delete route."
          initialForm={{ farmer_id: '', fuel_type: 'Diesel', quantity_liters: '', cost_per_liter: '', total_cost: '', supplier: '', purchase_date: '', location: '', vehicle_id: '' }}
          requiredFields={['farmer_id', 'fuel_type', 'quantity_liters']}
          columns={[
            { key: 'fuel_type', label: 'Fuel Type' },
            { key: 'quantity_liters', label: 'Quantity (L)' },
            { key: 'total_cost', label: 'Cost (₹)' },
            { key: 'purchase_date', label: 'Date' },
          ]}
          fields={[
            { name: 'farmer_id', label: 'Farmer ID', required: true },
            { name: 'fuel_type', label: 'Fuel type', type: 'select', options: FUEL_TYPES, required: true },
            { name: 'quantity_liters', label: 'Quantity (litres)', type: 'number', required: true },
            { name: 'cost_per_liter', label: 'Cost per litre (₹)', type: 'number' },
            { name: 'total_cost', label: 'Total cost (₹)', type: 'number' },
            { name: 'supplier', label: 'Supplier' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'location', label: 'Location' },
            { name: 'vehicle_id', label: 'Vehicle / equipment ID' },
          ]}
          stats={(items) => [
            { label: 'Purchases logged', value: items.length },
            { label: 'Total litres', value: items.reduce((s, i) => s + (Number(i.quantity_liters) || 0), 0).toFixed(1) },
            { label: 'Total cost (₹)', value: items.reduce((s, i) => s + (Number(i.total_cost) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'parts' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="spare-parts-inventory"
          idField="part_id"
          list={(params) => sparePartsAPI.getParts(params)}
          create={(data) => sparePartsAPI.createPart(data)}
          searchPlaceholder="Search by part name or number..."
          emptyMessage="No spare parts registered yet."
          newLabel="Register Part"
          backendNote="Backed by the real /modules/m109 endpoint (M109) - fixed 2026-08-24. This tab previously called a nonexistent /spare-parts path; the real backend had no browse route at all until this fix added one. Register-only: consumption is a separate real endpoint not yet surfaced here, and there is no delete route."
          initialForm={{ farmer_id: '', part_name: '', part_number: '', category: '', brand: '', quantity_in_stock: '', reorder_level: '', unit_cost: '', supplier: '', location: '' }}
          requiredFields={['farmer_id', 'part_name']}
          columns={[
            { key: 'part_name', label: 'Part' },
            { key: 'part_number', label: 'Part No.' },
            { key: 'quantity_in_stock', label: 'In Stock' },
            { key: 'supplier', label: 'Supplier' },
          ]}
          fields={[
            { name: 'farmer_id', label: 'Farmer ID', required: true },
            { name: 'part_name', label: 'Part name', required: true },
            { name: 'part_number', label: 'Part number' },
            { name: 'category', label: 'Category' },
            { name: 'brand', label: 'Brand' },
            { name: 'quantity_in_stock', label: 'Quantity in stock', type: 'number' },
            { name: 'reorder_level', label: 'Reorder level', type: 'number' },
            { name: 'unit_cost', label: 'Unit cost (₹)', type: 'number' },
            { name: 'supplier', label: 'Supplier' },
            { name: 'location', label: 'Location' },
          ]}
          stats={(items) => [
            { label: 'Parts tracked', value: items.length },
            { label: 'Below reorder level', value: items.filter((i) => Number(i.quantity_in_stock) < Number(i.reorder_level || 0)).length },
          ]}
        />
      )}

      {activeTab === 'lifecycle' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="asset-lifecycle-registry"
          idField="asset_registry_id"
          list={(params) => assetLifecycleAPI.getAssets(params)}
          create={(data) => assetLifecycleAPI.createAsset(data)}
          searchPlaceholder="Search by asset type..."
          emptyMessage="No assets registered yet."
          newLabel="Register Asset"
          backendNote="Backed by the real /modules/m110 endpoint (M110, was 458 lines of real code sitting completely disconnected before this session) - fixed 2026-08-24. This tab previously called a nonexistent /asset-lifecycle path with unrelated fields (category/current_value/depreciation_method). Register-only: the real update route changes lifecycle stage, not general asset fields, and there is no delete route."
          initialForm={{ farmer_id: '', asset_type: '', asset_name: '', brand: '', model: '', year: '', serial_number: '', purchase_date: '', purchase_cost: '', estimated_useful_life: '', residual_value: '', location: '', status: 'active' }}
          requiredFields={['farmer_id', 'asset_type', 'asset_name']}
          columns={[
            { key: 'asset_name', label: 'Asset' },
            { key: 'asset_type', label: 'Type' },
            { key: 'purchase_cost', label: 'Purchase Cost (₹)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'farmer_id', label: 'Farmer ID', required: true },
            { name: 'asset_type', label: 'Asset type', required: true },
            { name: 'asset_name', label: 'Asset name', required: true },
            { name: 'brand', label: 'Brand' },
            { name: 'model', label: 'Model' },
            { name: 'year', label: 'Year', type: 'number' },
            { name: 'serial_number', label: 'Serial number' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'purchase_cost', label: 'Purchase cost (₹)', type: 'number' },
            { name: 'estimated_useful_life', label: 'Estimated useful life (years)', type: 'number' },
            { name: 'residual_value', label: 'Residual value (₹)', type: 'number' },
            { name: 'location', label: 'Location' },
            { name: 'status', label: 'Status', type: 'select', options: ASSET_STATUS },
          ]}
          stats={(items) => [
            { label: 'Assets', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'active').length },
          ]}
        />
      )}
    </div>
  );
}

export default MachineryManagementPage;
