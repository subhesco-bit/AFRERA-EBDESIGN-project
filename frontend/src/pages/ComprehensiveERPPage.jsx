import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { comprehensiveERPAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/comprehensiveERPRoutes.js +
 * comprehensiveERPController.js + services/legacy/comprehensiveERPService.js
 * (Oracle/SAP-standard ERP: 12 modules, ~40 endpoints, all cross-checked
 * against real service methods 2026-08-29 - zero broken calls). One tab per
 * SAP module, ActionCards per operation - too many distinct operations for
 * a single scroll, and each module is its own coherent workflow.
 */
const TABS = [
  ['gl', 'General Ledger'], ['co', 'Controlling'], ['mm', 'Materials Mgmt'],
  ['sd', 'Sales & Distribution'], ['pp', 'Production Planning'], ['qm', 'Quality Mgmt'],
  ['pm', 'Plant Maintenance'], ['hr', 'Human Resources'], ['ps', 'Project System'],
  ['tr', 'Treasury'], ['am', 'Asset Mgmt'], ['bi', 'Business Intelligence'],
];

function ComprehensiveERPPage() {
  const [tab, setTab] = useState('gl');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-slate-700" />
          Comprehensive ERP
        </h1>
        <p className="text-gray-600">Oracle/SAP-standard enterprise resource planning across 12 modules.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'gl' && (
        <>
          <ActionCard title="Create Chart of Accounts" description="Create a new chart of accounts." hasJsonPayload jsonPlaceholder='{"name": "Standard COA"}' onRun={(_, p) => comprehensiveERPAPI.createChartOfAccounts(p)} />
          <ActionCard title="Create GL Account" description="Create a general ledger account." hasJsonPayload jsonPlaceholder='{"accountCode": "1000", "name": "Cash"}' onRun={(_, p) => comprehensiveERPAPI.createGLAccount(p)} />
          <ActionCard title="Post Journal Entry" description="Post a journal entry to the ledger." hasJsonPayload jsonPlaceholder='{"lines": [{"account": "1000", "debit": 100}]}' onRun={(_, p) => comprehensiveERPAPI.postJournalEntry(p)} />
          <ActionCard title="Trial Balance" description="Generate a trial balance report." fields={[{ name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }, { name: 'chart_id', label: 'Chart ID' }]} onRun={(v) => comprehensiveERPAPI.getTrialBalance(v)} />
          <ActionCard title="Balance Sheet" description="Generate a balance sheet." fields={[{ name: 'as_of_date', label: 'As Of Date' }, { name: 'chart_id', label: 'Chart ID' }]} onRun={(v) => comprehensiveERPAPI.getBalanceSheet(v)} />
          <ActionCard title="Profit & Loss" description="Generate a profit and loss statement." fields={[{ name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }, { name: 'chart_id', label: 'Chart ID' }]} onRun={(v) => comprehensiveERPAPI.getProfitLoss(v)} />
          <ActionCard title="AI Financial Analysis" description="AI-driven analysis of financial performance." fields={[{ name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }, { name: 'chart_id', label: 'Chart ID' }]} onRun={(v) => comprehensiveERPAPI.analyzeFinancialsAI(v)} />
        </>
      )}

      {tab === 'co' && (
        <>
          <ActionCard title="Create Cost Center" description="Create a cost center." hasJsonPayload jsonPlaceholder='{"code": "CC-100", "name": "Production"}' onRun={(_, p) => comprehensiveERPAPI.createCostCenter(p)} />
          <ActionCard title="Create Profit Center" description="Create a profit center." hasJsonPayload jsonPlaceholder='{"code": "PC-100", "name": "Dairy Unit"}' onRun={(_, p) => comprehensiveERPAPI.createProfitCenter(p)} />
          <ActionCard title="Post Cost Allocation" description="Post a cost allocation." hasJsonPayload jsonPlaceholder='{"fromCostCenter": "CC-100", "amount": 500}' onRun={(_, p) => comprehensiveERPAPI.postCostAllocation(p)} />
          <ActionCard title="Cost Center Report" description="Generate a cost center report." fields={[{ name: 'cost_center_code', label: 'Cost Center Code' }, { name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }]} onRun={(v) => comprehensiveERPAPI.getCostCenterReport(v)} />
          <ActionCard title="Profit Center Report" description="Generate a profit center report." fields={[{ name: 'profit_center_code', label: 'Profit Center Code' }, { name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }]} onRun={(v) => comprehensiveERPAPI.getProfitCenterReport(v)} />
        </>
      )}

      {tab === 'mm' && (
        <>
          <ActionCard title="Create Material Master" description="Create a material master record." hasJsonPayload jsonPlaceholder='{"code": "MAT-1", "name": "Fertilizer"}' onRun={(_, p) => comprehensiveERPAPI.createMaterialMaster(p)} />
          <ActionCard title="Create Purchase Order" description="Create a purchase order." hasJsonPayload jsonPlaceholder='{"vendor": "V-1", "items": []}' onRun={(_, p) => comprehensiveERPAPI.createPurchaseOrder(p)} />
          <ActionCard title="Create Goods Receipt" description="Record a goods receipt." hasJsonPayload jsonPlaceholder='{"poNumber": "PO-1", "items": []}' onRun={(_, p) => comprehensiveERPAPI.createGoodsReceipt(p)} />
          <ActionCard title="Inventory Overview" description="Get an inventory overview." fields={[{ name: 'material_code', label: 'Material Code' }, { name: 'storage_location', label: 'Storage Location' }]} onRun={(v) => comprehensiveERPAPI.getInventoryOverview(v)} />
          <ActionCard title="AI Supply Chain Optimization" description="AI-driven supply chain optimization." fields={[{ name: 'material_code', label: 'Material Code' }, { name: 'storage_location', label: 'Storage Location' }]} onRun={(v) => comprehensiveERPAPI.optimizeSupplyChainAI(v)} />
        </>
      )}

      {tab === 'sd' && (
        <>
          <ActionCard title="Create Customer Master" description="Create a customer master record." hasJsonPayload jsonPlaceholder='{"code": "CUST-1", "name": "ABC Traders"}' onRun={(_, p) => comprehensiveERPAPI.createCustomerMaster(p)} />
          <ActionCard title="Create Sales Order" description="Create a sales order." hasJsonPayload jsonPlaceholder='{"customer": "CUST-1", "items": []}' onRun={(_, p) => comprehensiveERPAPI.createSalesOrder(p)} />
          <ActionCard title="Create Delivery" description="Create a delivery for a sales order." hasJsonPayload jsonPlaceholder='{"salesOrder": "SO-1"}' onRun={(_, p) => comprehensiveERPAPI.createDelivery(p)} />
          <ActionCard title="Create Invoice" description="Create an invoice." hasJsonPayload jsonPlaceholder='{"delivery": "DL-1"}' onRun={(_, p) => comprehensiveERPAPI.createInvoice(p)} />
        </>
      )}

      {tab === 'pp' && (
        <>
          <ActionCard title="Create Production Order" description="Create a production order." hasJsonPayload jsonPlaceholder='{"material": "MAT-1", "quantity": 100}' onRun={(_, p) => comprehensiveERPAPI.createProductionOrder(p)} />
          <ActionCard title="Release Production Order" description="Release a production order." fields={[{ name: 'production_order', label: 'Production Order' }]} onRun={(v) => comprehensiveERPAPI.releaseProductionOrder(v.production_order)} />
          <ActionCard title="Confirm Production Order" description="Confirm a production order's output." fields={[{ name: 'production_order', label: 'Production Order' }]} hasJsonPayload jsonPlaceholder='{"quantityProduced": 95}' onRun={(v, p) => comprehensiveERPAPI.confirmProductionOrder(v.production_order, p)} />
          <ActionCard title="AI Production Optimization" description="AI-driven production optimization." fields={[{ name: 'production_plant', label: 'Plant' }, { name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }]} onRun={(v) => comprehensiveERPAPI.optimizeProductionAI(v)} />
        </>
      )}

      {tab === 'qm' && (
        <>
          <ActionCard title="Create Inspection Lot" description="Create a quality inspection lot." hasJsonPayload jsonPlaceholder='{"material": "MAT-1", "quantity": 50}' onRun={(_, p) => comprehensiveERPAPI.createInspectionLot(p)} />
          <ActionCard title="Record Inspection Result" description="Record a quality inspection result." hasJsonPayload jsonPlaceholder='{"inspectionLot": "IL-1", "pass": true}' onRun={(_, p) => comprehensiveERPAPI.recordInspectionResult(p)} />
          <ActionCard title="Usage Decision" description="Make a usage decision on an inspection lot." fields={[{ name: 'inspection_lot', label: 'Inspection Lot' }]} hasJsonPayload jsonPlaceholder='{"decision": "accept"}' onRun={(v, p) => comprehensiveERPAPI.makeUsageDecision(v.inspection_lot, p)} />
        </>
      )}

      {tab === 'pm' && (
        <>
          <ActionCard title="Create Equipment Master" description="Create an equipment master record." hasJsonPayload jsonPlaceholder='{"code": "EQ-1", "name": "Tractor"}' onRun={(_, p) => comprehensiveERPAPI.createEquipmentMaster(p)} />
          <ActionCard title="Create Maintenance Order" description="Create a maintenance order." hasJsonPayload jsonPlaceholder='{"equipment": "EQ-1"}' onRun={(_, p) => comprehensiveERPAPI.createMaintenanceOrder(p)} />
          <ActionCard title="Confirm Maintenance Order" description="Confirm completion of a maintenance order." fields={[{ name: 'maintenance_order', label: 'Maintenance Order' }]} hasJsonPayload jsonPlaceholder='{"completedOn": "2026-08-29"}' onRun={(v, p) => comprehensiveERPAPI.confirmMaintenanceOrder(v.maintenance_order, p)} />
        </>
      )}

      {tab === 'hr' && (
        <>
          <ActionCard title="Create Employee Master" description="Create an employee master record." hasJsonPayload jsonPlaceholder='{"name": "Jane Doe", "role": "Field Officer"}' onRun={(_, p) => comprehensiveERPAPI.createEmployeeMaster(p)} />
          <ActionCard title="Create Organizational Unit" description="Create an organizational unit." hasJsonPayload jsonPlaceholder='{"name": "Operations"}' onRun={(_, p) => comprehensiveERPAPI.createOrganizationalUnit(p)} />
          <ActionCard title="Process Payroll" description="Process payroll for a period." hasJsonPayload jsonPlaceholder='{"period": "2026-08"}' onRun={(_, p) => comprehensiveERPAPI.processPayroll(p)} />
          <ActionCard title="AI HR Analysis" description="AI-driven HR analysis." fields={[{ name: 'period', label: 'Period' }, { name: 'year', label: 'Year' }]} onRun={(v) => comprehensiveERPAPI.analyzeHRAI(v)} />
        </>
      )}

      {tab === 'ps' && (
        <>
          <ActionCard title="Create Project Definition" description="Create a project definition." hasJsonPayload jsonPlaceholder='{"code": "PRJ-1", "name": "Irrigation Upgrade"}' onRun={(_, p) => comprehensiveERPAPI.createProjectDefinition(p)} />
          <ActionCard title="Create WBS Element" description="Create a work-breakdown-structure element." hasJsonPayload jsonPlaceholder='{"project": "PRJ-1", "name": "Phase 1"}' onRun={(_, p) => comprehensiveERPAPI.createWBS(p)} />
          <ActionCard title="Update Project Status" description="Update a project's status." fields={[{ name: 'project_code', label: 'Project Code' }]} hasJsonPayload jsonPlaceholder='{"status": "in_progress"}' onRun={(v, p) => comprehensiveERPAPI.updateProjectStatus(v.project_code, p)} />
          <ActionCard title="AI Project Analysis" description="AI-driven project analysis." fields={[{ name: 'project_code', label: 'Project Code' }]} onRun={(v) => comprehensiveERPAPI.analyzeProjectAI(v.project_code)} />
        </>
      )}

      {tab === 'tr' && (
        <>
          <ActionCard title="Create Bank Account" description="Register a bank account." hasJsonPayload jsonPlaceholder='{"bankName": "SBI", "accountNumber": "1234"}' onRun={(_, p) => comprehensiveERPAPI.createBankAccount(p)} />
          <ActionCard title="Record Cash Flow" description="Record a cash flow entry." hasJsonPayload jsonPlaceholder='{"type": "inflow", "amount": 1000}' onRun={(_, p) => comprehensiveERPAPI.recordCashFlow(p)} />
          <ActionCard title="Cash Position" description="Get the current cash position." fields={[{ name: 'as_of_date', label: 'As Of Date' }, { name: 'currency', label: 'Currency' }]} onRun={(v) => comprehensiveERPAPI.getCashPosition(v)} />
        </>
      )}

      {tab === 'am' && (
        <>
          <ActionCard title="Create Fixed Asset" description="Register a fixed asset." hasJsonPayload jsonPlaceholder='{"code": "ASSET-1", "name": "Tractor", "cost": 500000}' onRun={(_, p) => comprehensiveERPAPI.createFixedAsset(p)} />
          <ActionCard title="Calculate Depreciation" description="Calculate depreciation for an asset over a period." fields={[{ name: 'asset_code', label: 'Asset Code' }, { name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }]} onRun={(v) => comprehensiveERPAPI.calculateDepreciation(v.asset_code, { from_date: v.from_date, to_date: v.to_date })} />
        </>
      )}

      {tab === 'bi' && (
        <>
          <ActionCard title="Executive Dashboard" description="Generate the executive dashboard summary." fields={[{ name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }]} onRun={(v) => comprehensiveERPAPI.getExecutiveDashboard(v)} />
          <ActionCard title="Profitability Analysis" description="Generate a profitability analysis." fields={[{ name: 'from_date', label: 'From Date' }, { name: 'to_date', label: 'To Date' }, { name: 'profit_center_code', label: 'Profit Center Code' }]} onRun={(v) => comprehensiveERPAPI.getProfitabilityAnalysis(v)} />
        </>
      )}
    </div>
  );
}

export default ComprehensiveERPPage;
