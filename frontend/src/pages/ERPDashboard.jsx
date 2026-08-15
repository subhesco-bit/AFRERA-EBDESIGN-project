import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ecommerceERPAPI } from '../services/api';
import { 
  FileText, 
  Calculator, 
  Truck, 
  Factory, 
  Users, 
  PackageCheck,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

/**
 * AFRERA ERP Dashboard
 * 
 * Complete ERP integration dashboard:
 * - Financial ERP (GL posting, GST invoicing)
 * - Supply Chain ERP (inventory sync, purchase orders)
 * - Production ERP (production orders)
 * - Customer ERP (CRM synchronization)
 */

const ERPDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Post to General Ledger
  const handlePostGL = async (transactionData) => {
    try {
      await ecommerceERPAPI.postToGeneralLedger(transactionData);
      alert('GL entry posted successfully');
    } catch (error) {
      alert('Failed to post GL entry');
    }
  };

  // Generate GST Invoice
  const { data: gstInvoice, isLoading: gstLoading } = useQuery({
    queryKey: ['gstInvoice', selectedOrderId],
    queryFn: () => selectedOrderId ? ecommerceERPAPI.generateGSTInvoice(selectedOrderId) : null,
    enabled: !!selectedOrderId
  });

  // Sync Inventory
  const { data: inventorySync, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventorySync', selectedProductId],
    queryFn: () => selectedProductId ? ecommerceERPAPI.syncInventoryWithERP(selectedProductId) : null,
    enabled: !!selectedProductId
  });

  // Sync Customer to CRM
  const handleSyncCustomer = async (userId) => {
    try {
      await ecommerceERPAPI.syncCustomerWithCRM(userId);
      alert('Customer synced to CRM successfully');
    } catch (error) {
      alert('Failed to sync customer');
    }
  };

  // Create Production Order
  const handleCreateProductionOrder = async (data) => {
    try {
      await ecommerceERPAPI.createProductionOrder(data);
      alert('Production order created successfully');
    } catch (error) {
      alert('Failed to create production order');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">GL Entries</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">GST Invoices</p>
              <p className="text-2xl font-bold text-gray-900">856</p>
            </div>
            <IndianRupee className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Syncs</p>
              <p className="text-2xl font-bold text-gray-900">423</p>
            </div>
            <Truck className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Production Orders</p>
              <p className="text-2xl font-bold text-gray-900">167</p>
            </div>
            <Factory className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Post GL Entry
            </button>
            <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center justify-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Generate GST Invoice
            </button>
            <button className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition flex items-center justify-center gap-2">
              <Truck className="h-4 w-4" />
              Sync Inventory
            </button>
            <button className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition flex items-center justify-center gap-2">
              <Factory className="h-4 w-4" />
              Create Production Order
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">ERP Module Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="font-medium">Financial ERP</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span className="font-medium">Supply Chain ERP</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <span className="font-medium">Production ERP</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
              <span className="font-medium">Customer ERP (CRM)</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Financial ERP
        </h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generate GST Invoice
          </label>
          <input
            type="text"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            placeholder="Enter Order ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {selectedOrderId && (
          <div>
            {gstLoading ? (
              <p className="text-gray-500">Generating invoice...</p>
            ) : gstInvoice ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded border-2 border-green-500">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Invoice Generated Successfully</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-semibold">{gstInvoice.invoice.invoice_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-semibold">₹{gstInvoice.invoice.totals.total_value.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">GST Amount:</span>
                      <span className="font-semibold">₹{gstInvoice.invoice.totals.gst_amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Taxable Value:</span>
                      <span className="font-semibold">₹{gstInvoice.invoice.totals.taxable_value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded">
                  <h4 className="font-medium mb-2">Line Items</h4>
                  <div className="space-y-2">
                    {gstInvoice.invoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm p-2 bg-white rounded">
                        <span>{item.product_name}</span>
                        <span className="font-semibold">₹{item.total_value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => gstInvoice.refetch()}
                className="w-full bg-green-500 text-white py-2 px-4 rounded"
              >
                Generate Invoice
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSupplyChain = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Supply Chain ERP
        </h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sync Inventory with ERP
          </label>
          <input
            type="text"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            placeholder="Enter Product ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {selectedProductId && (
          <div>
            {inventoryLoading ? (
              <p className="text-gray-500">Syncing inventory...</p>
            ) : inventorySync ? (
              <div className="space-y-4">
                <div className={`p-4 rounded ${inventorySync.sync_result.sync_status === 'matched' ? 'bg-green-50' : 'bg-yellow-50 border-2 border-yellow-500'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {inventorySync.sync_result.sync_status === 'matched' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <h4 className="font-medium">
                      Sync Status: {inventorySync.sync_result.sync_status.toUpperCase()}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Marketplace Quantity:</span>
                      <span className="font-semibold">{inventorySync.sync_result.marketplace_quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ERP Quantity:</span>
                      <span className="font-semibold">{inventorySync.sync_result.erp_quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Discrepancy:</span>
                      <span className={`font-semibold ${inventorySync.sync_result.discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {inventorySync.sync_result.discrepancy}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Adjustment Required:</span>
                      <span className="font-semibold">{inventorySync.sync_result.adjustment_required ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => inventorySync.refetch()}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded"
              >
                Sync Inventory
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderProduction = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Production ERP
        </h3>
        
        <div className="p-4 bg-orange-50 rounded mb-4">
          <h4 className="font-medium mb-2">Create Production Order</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                id="prodId"
                placeholder="Enter Product ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demand Quantity</label>
              <input
                type="number"
                id="demandQty"
                placeholder="Enter demand quantity"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const prodId = document.getElementById('prodId').value;
              const demandQty = document.getElementById('demandQty').value;
              if (prodId && demandQty) {
                handleCreateProductionOrder({ productId: prodId, demandQuantity: parseFloat(demandQty) });
              }
            }}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition"
          >
            Create Production Order
          </button>
        </div>
      </div>
    </div>
  );

  const renderCRM = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer ERP (CRM)
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sync Customer to CRM
          </label>
          <input
            type="text"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            placeholder="Enter User ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          onClick={() => selectedUserId && handleSyncCustomer(selectedUserId)}
          disabled={!selectedUserId}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
        >
          Sync Customer to CRM
        </button>
        
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h4 className="font-medium mb-2">CRM Integration Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Customer activity tracking
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Tier assignment (Platinum, Gold, Silver, Bronze)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Purchase behavior analysis
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Customer lifetime calculation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-blue-600" />
            ERP Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Complete ERP integration: Financial, Supply Chain, Production, Customer
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-4 py-3 font-medium ${activeTab === 'financial' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Financial
            </button>
            <button
              onClick={() => setActiveTab('supplychain')}
              className={`px-4 py-3 font-medium ${activeTab === 'supplychain' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Supply Chain
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`px-4 py-3 font-medium ${activeTab === 'production' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-3 font-medium ${activeTab === 'crm' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              CRM
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'financial' && renderFinancial()}
          {activeTab === 'supplychain' && renderSupplyChain()}
          {activeTab === 'production' && renderProduction()}
          {activeTab === 'crm' && renderCRM()}
        </div>
      </div>
    </div>
  );
};

export default ERPDashboard;
