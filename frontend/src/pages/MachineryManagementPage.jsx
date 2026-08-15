import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, Package, CalendarDays, Truck, ShieldCheck, AlertTriangle, Fuel, Cog, Boxes, Clock } from 'lucide-react'
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
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

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
]

const IMPLEMENT_TYPES = ['Plough', 'Harrow', 'Seeder', 'Sprayer', 'Cultivator', 'Other']
const CONDITION = ['Good', 'Fair', 'Needs Repair']
const EQUIPMENT_STATUS = ['In Use', 'In Storage', 'Under Repair', 'Retired']
const RENTAL_STATUS = ['Reserved', 'Active', 'Returned', 'Overdue']
const VEHICLE_STATUS = ['Active', 'In Maintenance', 'Idle', 'Retired']
const MAINT_STATUS = ['Scheduled', 'Completed', 'Overdue']
const BREAKDOWN_STATUS = ['Reported', 'In Progress', 'Resolved']
const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric']
const DEPRECIATION = ['Straight Line', 'Declining Balance']
const ASSET_STATUS = ['Active', 'Disposed', 'Written Off']

function FleetMaintenanceDuePanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet-maintenance-due'],
    queryFn: async () => (await fleetManagementAPI.getMaintenanceDue()).data?.data ?? null,
  })

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
                      {v.nextMaintenanceDate
                        ? `Next maintenance ${v.nextMaintenanceDate} (${v.daysUntilNextMaintenance} day${Math.abs(v.daysUntilNextMaintenance) === 1 ? '' : 's'} ${v.daysUntilNextMaintenance < 0 ? 'overdue' : 'from now'})`
                        : 'No next-maintenance date on record.'}
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
  )
}

function MachineryManagementPage() {
  const [activeTab, setActiveTab] = useState('implements')

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
          queryKey="machinery-implements"
          idField="id"
          list={(params) => implementManagementAPI.getImplements(params)}
          create={(data) => implementManagementAPI.createImplement(data)}
          update={(id, data) => implementManagementAPI.updateImplement(id, data)}
          remove={(id) => implementManagementAPI.deleteImplement(id)}
          searchPlaceholder="Search by implement name..."
          emptyMessage="No implements recorded yet."
          newLabel="Add Implement"
          backendNote="Backend endpoint /machinery-implements has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ implement_name: '', implement_type: 'Plough', compatible_tractor: '', purchase_date: '', condition: 'Good', notes: '' }}
          requiredFields={['implement_name', 'implement_type']}
          columns={[
            { key: 'implement_name', label: 'Implement' },
            { key: 'implement_type', label: 'Type' },
            { key: 'compatible_tractor', label: 'Compatible Tractor' },
            { key: 'condition', label: 'Condition' },
          ]}
          fields={[
            { name: 'implement_name', label: 'Implement name', required: true },
            { name: 'implement_type', label: 'Implement type', type: 'select', options: IMPLEMENT_TYPES },
            { name: 'compatible_tractor', label: 'Compatible tractor' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'condition', label: 'Condition', type: 'select', options: CONDITION },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Implements', value: items.length },
            { label: 'Needs repair', value: items.filter((i) => i.condition === 'Needs Repair').length },
          ]}
        />
      )}

      {activeTab === 'inventory' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="equipment-inventory"
          idField="id"
          list={(params) => equipmentInventoryAPI.getEquipment(params)}
          create={(data) => equipmentInventoryAPI.createEquipment(data)}
          update={(id, data) => equipmentInventoryAPI.updateEquipment(id, data)}
          remove={(id) => equipmentInventoryAPI.deleteEquipment(id)}
          searchPlaceholder="Search by equipment or serial number..."
          emptyMessage="No equipment recorded yet."
          newLabel="Add Equipment"
          backendNote="Backend endpoint /equipment-inventory has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ equipment_name: '', category: '', serial_number: '', purchase_date: '', value: '', location: '', status: 'In Use' }}
          requiredFields={['equipment_name']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'category', label: 'Category' },
            { key: 'serial_number', label: 'Serial No.' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'category', label: 'Category' },
            { name: 'serial_number', label: 'Serial number' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'value', label: 'Value (₹)', type: 'number' },
            { name: 'location', label: 'Location' },
            { name: 'status', label: 'Status', type: 'select', options: EQUIPMENT_STATUS },
          ]}
          stats={(items) => [
            { label: 'Equipment items', value: items.length },
            { label: 'In use', value: items.filter((i) => i.status === 'In Use').length },
          ]}
        />
      )}

      {activeTab === 'rental' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="equipment-rental"
          idField="id"
          list={(params) => equipmentRentalAPI.getRentals(params)}
          create={(data) => equipmentRentalAPI.createRental(data)}
          update={(id, data) => equipmentRentalAPI.updateRental(id, data)}
          remove={(id) => equipmentRentalAPI.deleteRental(id)}
          searchPlaceholder="Search by equipment or renter..."
          emptyMessage="No rentals recorded yet."
          newLabel="Add Rental"
          backendNote="Backend endpoint /equipment-rental has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ equipment_name: '', renter_name: '', rental_start: '', rental_end: '', daily_rate: '', total_amount: '', status: 'Reserved' }}
          requiredFields={['equipment_name', 'renter_name']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'renter_name', label: 'Renter' },
            { key: 'rental_start', label: 'Start' },
            { key: 'rental_end', label: 'End' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'renter_name', label: 'Renter name', required: true },
            { name: 'rental_start', label: 'Rental start', type: 'date' },
            { name: 'rental_end', label: 'Rental end', type: 'date' },
            { name: 'daily_rate', label: 'Daily rate (₹)', type: 'number' },
            { name: 'total_amount', label: 'Total amount (₹)', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: RENTAL_STATUS },
          ]}
          stats={(items) => [
            { label: 'Rentals', value: items.length },
            { label: 'Overdue', value: items.filter((i) => i.status === 'Overdue').length },
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
          queryKey="breakdown-maintenance"
          idField="id"
          list={(params) => breakdownMaintenanceAPI.getRecords(params)}
          create={(data) => breakdownMaintenanceAPI.createRecord(data)}
          update={(id, data) => breakdownMaintenanceAPI.updateRecord(id, data)}
          remove={(id) => breakdownMaintenanceAPI.deleteRecord(id)}
          searchPlaceholder="Search by equipment..."
          emptyMessage="No breakdowns recorded yet."
          newLabel="Report Breakdown"
          backendNote="Backend endpoint /breakdown-maintenance has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ equipment_name: '', issue_reported: '', reported_date: '', resolved_date: '', technician: '', cost: '', status: 'Reported' }}
          requiredFields={['equipment_name', 'issue_reported']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'issue_reported', label: 'Issue' },
            { key: 'reported_date', label: 'Reported' },
            { key: 'technician', label: 'Technician' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'issue_reported', label: 'Issue reported', required: true, span: 2 },
            { name: 'reported_date', label: 'Reported date', type: 'date' },
            { name: 'resolved_date', label: 'Resolved date', type: 'date' },
            { name: 'technician', label: 'Technician' },
            { name: 'cost', label: 'Repair cost (₹)', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: BREAKDOWN_STATUS },
          ]}
          stats={(items) => [
            { label: 'Breakdowns', value: items.length },
            { label: 'Unresolved', value: items.filter((i) => i.status !== 'Resolved').length },
          ]}
        />
      )}

      {activeTab === 'fuel' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="fuel-management"
          idField="id"
          list={(params) => fuelManagementAPI.getLogs(params)}
          create={(data) => fuelManagementAPI.createLog(data)}
          update={(id, data) => fuelManagementAPI.updateLog(id, data)}
          remove={(id) => fuelManagementAPI.deleteLog(id)}
          searchPlaceholder="Search by equipment..."
          emptyMessage="No fuel logs recorded yet."
          newLabel="Log Fuel"
          backendNote="Backend endpoint /fuel-management has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ equipment_name: '', fuel_type: 'Diesel', quantity_liters: '', cost: '', fill_date: '', odometer_hours: '' }}
          requiredFields={['equipment_name']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'fuel_type', label: 'Fuel Type' },
            { key: 'quantity_liters', label: 'Quantity (L)' },
            { key: 'cost', label: 'Cost (₹)' },
            { key: 'fill_date', label: 'Date' },
          ]}
          fields={[
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'fuel_type', label: 'Fuel type', type: 'select', options: FUEL_TYPES },
            { name: 'quantity_liters', label: 'Quantity (litres)', type: 'number' },
            { name: 'cost', label: 'Cost (₹)', type: 'number' },
            { name: 'fill_date', label: 'Fill date', type: 'date' },
            { name: 'odometer_hours', label: 'Odometer / hour meter' },
          ]}
          stats={(items) => [
            { label: 'Fuel logs', value: items.length },
            { label: 'Total litres', value: items.reduce((s, i) => s + (Number(i.quantity_liters) || 0), 0).toFixed(1) },
            { label: 'Total cost (₹)', value: items.reduce((s, i) => s + (Number(i.cost) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'parts' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="spare-parts"
          idField="id"
          list={(params) => sparePartsAPI.getParts(params)}
          create={(data) => sparePartsAPI.createPart(data)}
          update={(id, data) => sparePartsAPI.updatePart(id, data)}
          remove={(id) => sparePartsAPI.deletePart(id)}
          searchPlaceholder="Search by part name or number..."
          emptyMessage="No spare parts recorded yet."
          newLabel="Add Part"
          backendNote="Backend endpoint /spare-parts has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ part_name: '', part_number: '', compatible_equipment: '', quantity_in_stock: '', unit_cost: '', supplier: '', reorder_level: '' }}
          requiredFields={['part_name']}
          columns={[
            { key: 'part_name', label: 'Part' },
            { key: 'part_number', label: 'Part No.' },
            { key: 'quantity_in_stock', label: 'In Stock' },
            { key: 'supplier', label: 'Supplier' },
          ]}
          fields={[
            { name: 'part_name', label: 'Part name', required: true },
            { name: 'part_number', label: 'Part number' },
            { name: 'compatible_equipment', label: 'Compatible equipment' },
            { name: 'quantity_in_stock', label: 'Quantity in stock', type: 'number' },
            { name: 'unit_cost', label: 'Unit cost (₹)', type: 'number' },
            { name: 'supplier', label: 'Supplier' },
            { name: 'reorder_level', label: 'Reorder level', type: 'number' },
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
          queryKey="asset-lifecycle"
          idField="id"
          list={(params) => assetLifecycleAPI.getAssets(params)}
          create={(data) => assetLifecycleAPI.createAsset(data)}
          update={(id, data) => assetLifecycleAPI.updateAsset(id, data)}
          remove={(id) => assetLifecycleAPI.deleteAsset(id)}
          searchPlaceholder="Search by asset name..."
          emptyMessage="No assets recorded yet."
          newLabel="Add Asset"
          backendNote="Backend endpoint /asset-lifecycle has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ asset_name: '', category: '', acquisition_date: '', expected_life_years: '', current_value: '', depreciation_method: 'Straight Line', status: 'Active' }}
          requiredFields={['asset_name']}
          columns={[
            { key: 'asset_name', label: 'Asset' },
            { key: 'category', label: 'Category' },
            { key: 'acquisition_date', label: 'Acquired' },
            { key: 'current_value', label: 'Current Value (₹)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'asset_name', label: 'Asset name', required: true },
            { name: 'category', label: 'Category' },
            { name: 'acquisition_date', label: 'Acquisition date', type: 'date' },
            { name: 'expected_life_years', label: 'Expected life (years)', type: 'number' },
            { name: 'current_value', label: 'Current value (₹)', type: 'number' },
            { name: 'depreciation_method', label: 'Depreciation method', type: 'select', options: DEPRECIATION },
            { name: 'status', label: 'Status', type: 'select', options: ASSET_STATUS },
          ]}
          stats={(items) => [
            { label: 'Assets', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}
    </div>
  )
}

export default MachineryManagementPage
