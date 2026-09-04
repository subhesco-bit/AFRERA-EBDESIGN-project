import { useState } from 'react';
import { ClipboardList, CalendarClock, HardHat, Cog, CalendarRange, Fuel, TrendingUp, Gauge } from 'lucide-react';
import {
  farmActivityAPI,
  farmTaskAPI,
  contractorManagementAPI,
  machineryOperationsAPI,
  equipmentSchedulingAPI,
  inputConsumptionAPI,
  farmProductivityAPI,
  farmOperationsDashboardAPI,
} from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * Consolidated Operations domain sub-modules, batch 4: M091 (Farm Activity
 * Management), M092 (Farm Task Scheduling), M094 (Contractor Management),
 * M095 (Machinery Operations), M096 (Equipment Scheduling), M097 (Input
 * Consumption), M099 (Farm Productivity), M100 (Farm Operations Dashboard).
 *
 * M093 (Labour Management) and M098 (Farm Costing) already have real pages
 * (LabourManagementPage.jsx, FarmCostingPage.jsx) — not touched here. M091
 * and M099 are marked CLUBBED in 19_HIDDEN_MODULES.md (folded into larger
 * modules per that report's weak-match evidence) but were explicitly listed
 * as in-scope for this batch, so they are built as full tabs like the rest
 * rather than skipped. None of the eight have a dedicated backend route
 * under any name — all built against conventional REST shapes.
 */
const TABS = [
  { id: 'activities', label: 'Farm Activities', icon: ClipboardList },
  { id: 'tasks', label: 'Task Scheduling', icon: CalendarClock },
  { id: 'contractors', label: 'Contractors', icon: HardHat },
  { id: 'machinery', label: 'Machinery Ops', icon: Cog },
  { id: 'equipment', label: 'Equipment Scheduling', icon: CalendarRange },
  { id: 'inputs', label: 'Input Consumption', icon: Fuel },
  { id: 'productivity', label: 'Productivity', icon: TrendingUp },
  { id: 'dashboard', label: 'Ops Dashboard', icon: Gauge },
];

const ACTIVITY_TYPES = ['Ploughing', 'Sowing', 'Weeding', 'Spraying', 'Irrigation', 'Harvesting', 'Other'];
const ACTIVITY_STATUS = ['Pending', 'In Progress', 'Completed'];
const PRIORITY = ['Low', 'Medium', 'High', 'Urgent'];
const TASK_STATUS = ['To Do', 'In Progress', 'Done'];
const CONTRACTOR_STATUS = ['Active', 'Inactive'];
const SCHEDULE_STATUS = ['Scheduled', 'In Use', 'Completed', 'Cancelled'];
const INPUT_TYPES = ['Seed', 'Fertilizer', 'Pesticide', 'Water', 'Fuel', 'Other'];
const TRENDS = ['Up', 'Down', 'Stable'];

function OperationsManagementPage() {
  const [activeTab, setActiveTab] = useState('activities');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Operations Management</h1>
        <p className="text-gray-600">Farm activities, task scheduling, contractors, machinery operations, equipment scheduling, input consumption, productivity and an operations dashboard</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'activities' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="farm-activities"
          idField="id"
          list={(params) => farmActivityAPI.getActivities(params)}
          create={(data) => farmActivityAPI.createActivity(data)}
          update={(id, data) => farmActivityAPI.updateActivity(id, data)}
          remove={(id) => farmActivityAPI.deleteActivity(id)}
          searchPlaceholder="Search by activity or plot..."
          emptyMessage="No farm activities recorded yet."
          newLabel="Log Activity"
          backendNote="Backend endpoint /farm-activities has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ activity_name: '', plot: '', activity_type: 'Ploughing', scheduled_date: '', completed_date: '', assigned_to: '', status: 'Pending', notes: '' }}
          requiredFields={['activity_name', 'activity_type']}
          columns={[
            { key: 'activity_name', label: 'Activity' },
            { key: 'plot', label: 'Plot' },
            { key: 'activity_type', label: 'Type' },
            { key: 'assigned_to', label: 'Assigned To' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'activity_name', label: 'Activity name', required: true },
            { name: 'plot', label: 'Farm / plot' },
            { name: 'activity_type', label: 'Activity type', type: 'select', options: ACTIVITY_TYPES },
            { name: 'scheduled_date', label: 'Scheduled date', type: 'date' },
            { name: 'completed_date', label: 'Completed date', type: 'date' },
            { name: 'assigned_to', label: 'Assigned to' },
            { name: 'status', label: 'Status', type: 'select', options: ACTIVITY_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Activities', value: items.length },
            { label: 'Completed', value: items.filter((i) => i.status === 'Completed').length },
          ]}
        />
      )}

      {activeTab === 'tasks' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="farm-tasks"
          idField="id"
          list={(params) => farmTaskAPI.getTasks(params)}
          create={(data) => farmTaskAPI.createTask(data)}
          update={(id, data) => farmTaskAPI.updateTask(id, data)}
          remove={(id) => farmTaskAPI.deleteTask(id)}
          searchPlaceholder="Search by task..."
          emptyMessage="No tasks scheduled yet."
          newLabel="Schedule Task"
          backendNote="Backend endpoint /farm-tasks has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ task_name: '', category: '', due_date: '', priority: 'Medium', assigned_to: '', status: 'To Do', notes: '' }}
          requiredFields={['task_name']}
          columns={[
            { key: 'task_name', label: 'Task' },
            { key: 'category', label: 'Category' },
            { key: 'due_date', label: 'Due' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'task_name', label: 'Task name', required: true },
            { name: 'category', label: 'Category' },
            { name: 'due_date', label: 'Due date', type: 'date' },
            { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY },
            { name: 'assigned_to', label: 'Assigned to' },
            { name: 'status', label: 'Status', type: 'select', options: TASK_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Tasks', value: items.length },
            { label: 'Urgent', value: items.filter((i) => i.priority === 'Urgent').length },
            { label: 'Done', value: items.filter((i) => i.status === 'Done').length },
          ]}
        />
      )}

      {activeTab === 'contractors' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="contractors"
          idField="id"
          list={(params) => contractorManagementAPI.getContractors(params)}
          create={(data) => contractorManagementAPI.createContractor(data)}
          update={(id, data) => contractorManagementAPI.updateContractor(id, data)}
          remove={(id) => contractorManagementAPI.deleteContractor(id)}
          searchPlaceholder="Search by contractor or service..."
          emptyMessage="No contractors recorded yet."
          newLabel="Add Contractor"
          backendNote="Backend endpoint /contractors has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ contractor_name: '', service_type: '', contact_number: '', contract_start: '', contract_end: '', rate: '', status: 'Active', notes: '' }}
          requiredFields={['contractor_name', 'service_type']}
          columns={[
            { key: 'contractor_name', label: 'Contractor' },
            { key: 'service_type', label: 'Service' },
            { key: 'contact_number', label: 'Contact' },
            { key: 'rate', label: 'Rate (₹)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'contractor_name', label: 'Contractor name', required: true },
            { name: 'service_type', label: 'Service type', required: true },
            { name: 'contact_number', label: 'Contact number' },
            { name: 'contract_start', label: 'Contract start', type: 'date' },
            { name: 'contract_end', label: 'Contract end', type: 'date' },
            { name: 'rate', label: 'Rate (₹)', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: CONTRACTOR_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Contractors', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}

      {activeTab === 'machinery' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="machinery-operations"
          idField="id"
          list={(params) => machineryOperationsAPI.getOperations(params)}
          create={(data) => machineryOperationsAPI.createOperation(data)}
          update={(id, data) => machineryOperationsAPI.updateOperation(id, data)}
          remove={(id) => machineryOperationsAPI.deleteOperation(id)}
          searchPlaceholder="Search by machine or plot..."
          emptyMessage="No machinery operations recorded yet."
          newLabel="Log Operation"
          backendNote="Backend endpoint /machinery-operations has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ machine_name: '', operation_type: '', operator_name: '', field_plot: '', operation_date: '', hours_used: '', fuel_consumed_l: '', notes: '' }}
          requiredFields={['machine_name', 'operation_type']}
          columns={[
            { key: 'machine_name', label: 'Machine' },
            { key: 'operation_type', label: 'Operation' },
            { key: 'operator_name', label: 'Operator' },
            { key: 'operation_date', label: 'Date' },
            { key: 'hours_used', label: 'Hours' },
          ]}
          fields={[
            { name: 'machine_name', label: 'Machine name', required: true },
            { name: 'operation_type', label: 'Operation type', required: true },
            { name: 'operator_name', label: 'Operator name' },
            { name: 'field_plot', label: 'Field / plot' },
            { name: 'operation_date', label: 'Operation date', type: 'date' },
            { name: 'hours_used', label: 'Hours used', type: 'number' },
            { name: 'fuel_consumed_l', label: 'Fuel consumed (L)', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Operations logged', value: items.length },
            { label: 'Total hours', value: items.reduce((s, i) => s + (Number(i.hours_used) || 0), 0).toFixed(1) },
          ]}
        />
      )}

      {activeTab === 'equipment' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="equipment-scheduling"
          idField="id"
          list={(params) => equipmentSchedulingAPI.getSchedules(params)}
          create={(data) => equipmentSchedulingAPI.createSchedule(data)}
          update={(id, data) => equipmentSchedulingAPI.updateSchedule(id, data)}
          remove={(id) => equipmentSchedulingAPI.deleteSchedule(id)}
          searchPlaceholder="Search by equipment..."
          emptyMessage="No equipment scheduled yet."
          newLabel="Schedule Equipment"
          backendNote="Backend endpoint /equipment-scheduling has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ equipment_name: '', scheduled_by: '', start_time: '', end_time: '', purpose: '', status: 'Scheduled' }}
          requiredFields={['equipment_name']}
          columns={[
            { key: 'equipment_name', label: 'Equipment' },
            { key: 'scheduled_by', label: 'Scheduled By' },
            { key: 'start_time', label: 'Start' },
            { key: 'end_time', label: 'End' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'equipment_name', label: 'Equipment name', required: true },
            { name: 'scheduled_by', label: 'Scheduled by' },
            { name: 'start_time', label: 'Start time', type: 'datetime-local' },
            { name: 'end_time', label: 'End time', type: 'datetime-local' },
            { name: 'purpose', label: 'Purpose', span: 2 },
            { name: 'status', label: 'Status', type: 'select', options: SCHEDULE_STATUS },
          ]}
          stats={(items) => [
            { label: 'Bookings', value: items.length },
            { label: 'In use', value: items.filter((i) => i.status === 'In Use').length },
          ]}
        />
      )}

      {activeTab === 'inputs' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="input-consumption"
          idField="id"
          list={(params) => inputConsumptionAPI.getRecords(params)}
          create={(data) => inputConsumptionAPI.createRecord(data)}
          update={(id, data) => inputConsumptionAPI.updateRecord(id, data)}
          remove={(id) => inputConsumptionAPI.deleteRecord(id)}
          searchPlaceholder="Search by input or plot..."
          emptyMessage="No consumption records yet."
          newLabel="Log Consumption"
          backendNote="Backend endpoint /input-consumption has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ input_name: '', input_type: 'Seed', quantity_used: '', unit: '', field_plot: '', consumption_date: '', notes: '' }}
          requiredFields={['input_name', 'input_type']}
          columns={[
            { key: 'input_name', label: 'Input' },
            { key: 'input_type', label: 'Type' },
            { key: 'quantity_used', label: 'Quantity' },
            { key: 'unit', label: 'Unit' },
            { key: 'field_plot', label: 'Plot' },
          ]}
          fields={[
            { name: 'input_name', label: 'Input name', required: true },
            { name: 'input_type', label: 'Input type', type: 'select', options: INPUT_TYPES },
            { name: 'quantity_used', label: 'Quantity used', type: 'number' },
            { name: 'unit', label: 'Unit', placeholder: 'kg, L, bags...' },
            { name: 'field_plot', label: 'Field / plot' },
            { name: 'consumption_date', label: 'Date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Records', value: items.length },
            { label: 'Types tracked', value: new Set(items.map((i) => i.input_type).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'productivity' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="farm-productivity"
          idField="id"
          list={(params) => farmProductivityAPI.getMetrics(params)}
          create={(data) => farmProductivityAPI.createMetric(data)}
          update={(id, data) => farmProductivityAPI.updateMetric(id, data)}
          remove={(id) => farmProductivityAPI.deleteMetric(id)}
          searchPlaceholder="Search by metric or plot..."
          emptyMessage="No productivity metrics recorded yet."
          newLabel="Add Metric"
          backendNote="Backend endpoint /farm-productivity has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ metric_name: '', plot: '', value: '', unit: '', period: '', benchmark: '', notes: '' }}
          requiredFields={['metric_name']}
          columns={[
            { key: 'metric_name', label: 'Metric' },
            { key: 'plot', label: 'Plot' },
            { key: 'value', label: 'Value' },
            { key: 'unit', label: 'Unit' },
            { key: 'period', label: 'Period' },
          ]}
          fields={[
            { name: 'metric_name', label: 'Metric name', required: true },
            { name: 'plot', label: 'Farm / plot' },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'unit', label: 'Unit' },
            { name: 'period', label: 'Period', placeholder: 'e.g. Kharif 2026' },
            { name: 'benchmark', label: 'Benchmark', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Metrics tracked', value: items.length },
          ]}
        />
      )}

      {activeTab === 'dashboard' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="farm-operations-dashboard"
          idField="id"
          list={(params) => farmOperationsDashboardAPI.getKpis(params)}
          create={(data) => farmOperationsDashboardAPI.createKpi(data)}
          update={(id, data) => farmOperationsDashboardAPI.updateKpi(id, data)}
          remove={(id) => farmOperationsDashboardAPI.deleteKpi(id)}
          searchPlaceholder="Search by KPI..."
          emptyMessage="No KPIs recorded yet."
          newLabel="Add KPI"
          backendNote="Backend endpoint /farm-operations-dashboard has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ kpi_name: '', value: '', target: '', period: '', trend: 'Stable', notes: '' }}
          requiredFields={['kpi_name']}
          columns={[
            { key: 'kpi_name', label: 'KPI' },
            { key: 'value', label: 'Value' },
            { key: 'target', label: 'Target' },
            { key: 'period', label: 'Period' },
            { key: 'trend', label: 'Trend' },
          ]}
          fields={[
            { name: 'kpi_name', label: 'KPI name', required: true },
            { name: 'value', label: 'Current value', type: 'number' },
            { name: 'target', label: 'Target value', type: 'number' },
            { name: 'period', label: 'Period' },
            { name: 'trend', label: 'Trend', type: 'select', options: TRENDS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'KPIs tracked', value: items.length },
            { label: 'Trending up', value: items.filter((i) => i.trend === 'Up').length },
          ]}
        />
      )}
    </div>
  );
}

export default OperationsManagementPage;
