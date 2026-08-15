import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprout, Bug, Leaf, FlaskConical, Recycle, ShoppingCart, Truck, ScanLine, Package } from 'lucide-react'
import {
  biofertilizerAPI,
  pesticideInventoryAPI,
  bioPesticideAPI,
  micronutrientAPI,
  organicInputAPI,
  inputProcurementAPI,
  inputDistributionAPI,
  inputTraceabilityAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Input Supply domain sub-modules: M113 (Biofertilizer),
 * M114 (Pesticide Inventory), M115 (Bio-Pesticide), M116 (Micronutrient),
 * M117 (Organic Input), M118 (Input Procurement), M119 (Input Distribution),
 * M120 (Input Traceability).
 *
 * M111 (Seed Inventory) is not a tab here — the catalogue's hidden-module
 * scan found the phrase already implemented at pages/SeedVaultPage.jsx
 * ("Seed Inventory Grid"), so M111's module stub points there instead.
 *
 * Built as one tabbed page (third batch, 2026-08-08), matching the
 * LandManagementPage.jsx / M042-050 CommunityManagementPage.jsx pattern
 * rather than 8 near-identical standalone pages. None of these eight have
 * a matching backend route (checked routes/services for each noun) — every
 * tab is wired against a conventional REST shape and flagged with a
 * backendNote.
 */
const TABS = [
  { id: 'biofertilizer', label: 'Biofertilizers', icon: Sprout },
  { id: 'pesticide', label: 'Pesticide Inventory', icon: Bug },
  { id: 'biopesticide', label: 'Bio-Pesticides', icon: Leaf },
  { id: 'micronutrient', label: 'Micronutrients', icon: FlaskConical },
  { id: 'organic', label: 'Organic Inputs', icon: Recycle },
  { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
  { id: 'distribution', label: 'Distribution', icon: Truck },
  { id: 'traceability', label: 'Traceability', icon: ScanLine },
]

const BIOFERT_TYPES = ['Rhizobium', 'Azotobacter', 'PSB (Phosphate Solubilizing)', 'Azospirillum', 'Mycorrhiza', 'Other']
const PESTICIDE_CATEGORIES = ['Insecticide', 'Fungicide', 'Herbicide', 'Rodenticide', 'Nematicide']
const BIOPESTICIDE_TYPES = ['Neem-based', 'Trichoderma', 'Bacillus thuringiensis (Bt)', 'Pheromone Trap', 'Beauveria bassiana', 'Other']
const MICRONUTRIENTS = ['Zinc', 'Boron', 'Iron', 'Manganese', 'Copper', 'Molybdenum', 'Multi-micronutrient Mix']
const ORGANIC_TYPES = ['Vermicompost', 'FYM (Farmyard Manure)', 'Compost', 'Green Manure', 'Bone Meal', 'Neem Cake', 'Other']
const PROCUREMENT_STATUS = ['Requested', 'Ordered', 'Received', 'Cancelled']
const DISTRIBUTION_CHANNELS = ['Dealer', 'FPO', 'Direct to Farmer', 'Govt. Scheme']
const TRACE_STAGES = ['Manufactured', 'In Transit', 'Warehoused', 'Distributed', 'Applied on Field']

function InputSupplyManagementPage() {
  const [activeTab, setActiveTab] = useState('biofertilizer')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Input Supply Management</h1>
        <p className="text-gray-600">Biofertilizers, pesticides, micronutrients, organic inputs, procurement, distribution and traceability</p>
      </div>

      <Link
        to="/fertilizer-inventory"
        className="flex items-center gap-2 mb-6 p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm hover:bg-green-100 transition w-fit"
      >
        <Package className="w-4 h-4" />
        Fertilizer stock (M112) lives on its own page with real stock, issuance and computed reorder alerts &rarr;
      </Link>

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

      {activeTab === 'biofertilizer' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="biofertilizers"
          idField="id"
          list={(params) => biofertilizerAPI.getItems(params)}
          create={(data) => biofertilizerAPI.createItem(data)}
          update={(id, data) => biofertilizerAPI.updateItem(id, data)}
          remove={(id) => biofertilizerAPI.deleteItem(id)}
          searchPlaceholder="Search by product name or supplier..."
          emptyMessage="No biofertilizer stock recorded yet."
          newLabel="Add Biofertilizer"
          backendNote="Backend endpoint /biofertilizers has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ product_name: '', biofert_type: 'Rhizobium', supplier: '', quantity_kg: '', expiry_date: '', batch_number: '', notes: '' }}
          requiredFields={['product_name', 'biofert_type']}
          columns={[
            { key: 'product_name', label: 'Product' },
            { key: 'biofert_type', label: 'Type' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity_kg', label: 'Qty (kg)' },
            { key: 'expiry_date', label: 'Expiry' },
          ]}
          fields={[
            { name: 'product_name', label: 'Product name', required: true },
            { name: 'biofert_type', label: 'Biofertilizer type', type: 'select', options: BIOFERT_TYPES },
            { name: 'supplier', label: 'Supplier' },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'batch_number', label: 'Batch number' },
            { name: 'expiry_date', label: 'Expiry date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Products tracked', value: items.length },
            { label: 'Total stock (kg)', value: items.reduce((s, i) => s + (Number(i.quantity_kg) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'pesticide' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="pesticide-inventory"
          idField="id"
          list={(params) => pesticideInventoryAPI.getItems(params)}
          create={(data) => pesticideInventoryAPI.createItem(data)}
          update={(id, data) => pesticideInventoryAPI.updateItem(id, data)}
          remove={(id) => pesticideInventoryAPI.deleteItem(id)}
          searchPlaceholder="Search by product name or supplier..."
          emptyMessage="No pesticide stock recorded yet."
          newLabel="Add Pesticide"
          backendNote="Backend endpoint /pesticide-inventory has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ product_name: '', category: 'Insecticide', supplier: '', quantity_liters: '', expiry_date: '', registration_number: '', notes: '' }}
          requiredFields={['product_name', 'category']}
          columns={[
            { key: 'product_name', label: 'Product' },
            { key: 'category', label: 'Category' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity_liters', label: 'Qty (L/kg)' },
            { key: 'expiry_date', label: 'Expiry' },
          ]}
          fields={[
            { name: 'product_name', label: 'Product name', required: true },
            { name: 'category', label: 'Category', type: 'select', options: PESTICIDE_CATEGORIES },
            { name: 'supplier', label: 'Supplier' },
            { name: 'quantity_liters', label: 'Quantity (litres/kg)', type: 'number' },
            { name: 'registration_number', label: 'CIB&RC registration no.' },
            { name: 'expiry_date', label: 'Expiry date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Products tracked', value: items.length },
            { label: 'Expiring soon', value: items.filter((i) => i.expiry_date && new Date(i.expiry_date) < new Date(Date.now() + 30 * 86400000)).length },
          ]}
        />
      )}

      {activeTab === 'biopesticide' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="bio-pesticides"
          idField="id"
          list={(params) => bioPesticideAPI.getItems(params)}
          create={(data) => bioPesticideAPI.createItem(data)}
          update={(id, data) => bioPesticideAPI.updateItem(id, data)}
          remove={(id) => bioPesticideAPI.deleteItem(id)}
          searchPlaceholder="Search by product name..."
          emptyMessage="No bio-pesticide stock recorded yet."
          newLabel="Add Bio-Pesticide"
          backendNote="Backend endpoint /bio-pesticides has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ product_name: '', biopesticide_type: 'Neem-based', supplier: '', quantity_liters: '', expiry_date: '', notes: '' }}
          requiredFields={['product_name', 'biopesticide_type']}
          columns={[
            { key: 'product_name', label: 'Product' },
            { key: 'biopesticide_type', label: 'Type' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity_liters', label: 'Qty (L/kg)' },
          ]}
          fields={[
            { name: 'product_name', label: 'Product name', required: true },
            { name: 'biopesticide_type', label: 'Bio-pesticide type', type: 'select', options: BIOPESTICIDE_TYPES },
            { name: 'supplier', label: 'Supplier' },
            { name: 'quantity_liters', label: 'Quantity (litres/kg)', type: 'number' },
            { name: 'expiry_date', label: 'Expiry date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Products tracked', value: items.length },
            { label: 'Types in use', value: new Set(items.map((i) => i.biopesticide_type).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'micronutrient' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="micronutrients"
          idField="id"
          list={(params) => micronutrientAPI.getItems(params)}
          create={(data) => micronutrientAPI.createItem(data)}
          update={(id, data) => micronutrientAPI.updateItem(id, data)}
          remove={(id) => micronutrientAPI.deleteItem(id)}
          searchPlaceholder="Search by product name or supplier..."
          emptyMessage="No micronutrient stock recorded yet."
          newLabel="Add Micronutrient"
          backendNote="Backend endpoint /micronutrients has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ product_name: '', nutrient: 'Zinc', supplier: '', quantity_kg: '', expiry_date: '', notes: '' }}
          requiredFields={['product_name', 'nutrient']}
          columns={[
            { key: 'product_name', label: 'Product' },
            { key: 'nutrient', label: 'Nutrient' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity_kg', label: 'Qty (kg)' },
          ]}
          fields={[
            { name: 'product_name', label: 'Product name', required: true },
            { name: 'nutrient', label: 'Nutrient', type: 'select', options: MICRONUTRIENTS },
            { name: 'supplier', label: 'Supplier' },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'expiry_date', label: 'Expiry date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Products tracked', value: items.length },
            { label: 'Nutrients covered', value: new Set(items.map((i) => i.nutrient).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'organic' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="organic-inputs"
          idField="id"
          list={(params) => organicInputAPI.getItems(params)}
          create={(data) => organicInputAPI.createItem(data)}
          update={(id, data) => organicInputAPI.updateItem(id, data)}
          remove={(id) => organicInputAPI.deleteItem(id)}
          searchPlaceholder="Search by product name or supplier..."
          emptyMessage="No organic input stock recorded yet."
          newLabel="Add Organic Input"
          backendNote="Backend endpoint /organic-inputs has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ product_name: '', input_type: 'Vermicompost', supplier: '', quantity_kg: '', certified_organic: 'No', notes: '' }}
          requiredFields={['product_name', 'input_type']}
          columns={[
            { key: 'product_name', label: 'Product' },
            { key: 'input_type', label: 'Type' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity_kg', label: 'Qty (kg)' },
            { key: 'certified_organic', label: 'Certified' },
          ]}
          fields={[
            { name: 'product_name', label: 'Product name', required: true },
            { name: 'input_type', label: 'Input type', type: 'select', options: ORGANIC_TYPES },
            { name: 'supplier', label: 'Supplier' },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'certified_organic', label: 'Certified organic', type: 'select', options: ['Yes', 'No'] },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Products tracked', value: items.length },
            { label: 'Certified organic', value: items.filter((i) => i.certified_organic === 'Yes').length },
          ]}
        />
      )}

      {activeTab === 'procurement' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="input-procurement"
          idField="id"
          list={(params) => inputProcurementAPI.getOrders(params)}
          create={(data) => inputProcurementAPI.createOrder(data)}
          update={(id, data) => inputProcurementAPI.updateOrder(id, data)}
          remove={(id) => inputProcurementAPI.deleteOrder(id)}
          searchPlaceholder="Search by item or vendor..."
          emptyMessage="No procurement orders recorded yet."
          newLabel="New Procurement Order"
          backendNote="Backend endpoint /input-procurement/orders has not been built yet — this tab is wired and ready to work once it is. vendorRoutes.js covers corporate/logistics/processor/retailer profiles, not farm-input purchase orders."
          initialForm={{ item_name: '', vendor_name: '', quantity: '', unit_cost: '', order_date: '', status: 'Requested', notes: '' }}
          requiredFields={['item_name', 'vendor_name']}
          columns={[
            { key: 'item_name', label: 'Item' },
            { key: 'vendor_name', label: 'Vendor' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unit_cost', label: 'Unit Cost (₹)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'item_name', label: 'Item name', required: true },
            { name: 'vendor_name', label: 'Vendor name', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number' },
            { name: 'unit_cost', label: 'Unit cost (₹)', type: 'number' },
            { name: 'order_date', label: 'Order date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: PROCUREMENT_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Orders', value: items.length },
            { label: 'Received', value: items.filter((i) => i.status === 'Received').length },
            { label: 'Total spend (₹)', value: items.reduce((s, i) => s + (Number(i.unit_cost) || 0) * (Number(i.quantity) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'distribution' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="input-distribution"
          idField="id"
          list={(params) => inputDistributionAPI.getRecords(params)}
          create={(data) => inputDistributionAPI.createRecord(data)}
          update={(id, data) => inputDistributionAPI.updateRecord(id, data)}
          remove={(id) => inputDistributionAPI.deleteRecord(id)}
          searchPlaceholder="Search by item or recipient..."
          emptyMessage="No distribution records yet."
          newLabel="Record Distribution"
          backendNote="Backend endpoint /input-distribution/records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ item_name: '', channel: 'Dealer', recipient_name: '', quantity: '', distributed_date: '', notes: '' }}
          requiredFields={['item_name', 'recipient_name']}
          columns={[
            { key: 'item_name', label: 'Item' },
            { key: 'channel', label: 'Channel' },
            { key: 'recipient_name', label: 'Recipient' },
            { key: 'quantity', label: 'Qty' },
            { key: 'distributed_date', label: 'Date' },
          ]}
          fields={[
            { name: 'item_name', label: 'Item name', required: true },
            { name: 'channel', label: 'Distribution channel', type: 'select', options: DISTRIBUTION_CHANNELS },
            { name: 'recipient_name', label: 'Recipient name', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number' },
            { name: 'distributed_date', label: 'Distributed date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Distribution records', value: items.length },
            { label: 'Recipients reached', value: new Set(items.map((i) => i.recipient_name).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'traceability' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="input-traceability"
          idField="id"
          list={(params) => inputTraceabilityAPI.getRecords(params)}
          create={(data) => inputTraceabilityAPI.createRecord(data)}
          update={(id, data) => inputTraceabilityAPI.updateRecord(id, data)}
          remove={(id) => inputTraceabilityAPI.deleteRecord(id)}
          searchPlaceholder="Search by batch number or item..."
          emptyMessage="No traceability records yet."
          newLabel="Add Trace Record"
          backendNote="Backend endpoint /input-traceability/records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ item_name: '', batch_number: '', stage: 'Manufactured', location: '', recorded_date: '', notes: '' }}
          requiredFields={['item_name', 'batch_number']}
          columns={[
            { key: 'item_name', label: 'Item' },
            { key: 'batch_number', label: 'Batch' },
            { key: 'stage', label: 'Stage' },
            { key: 'location', label: 'Location' },
            { key: 'recorded_date', label: 'Recorded' },
          ]}
          fields={[
            { name: 'item_name', label: 'Item name', required: true },
            { name: 'batch_number', label: 'Batch number', required: true },
            { name: 'stage', label: 'Trace stage', type: 'select', options: TRACE_STAGES },
            { name: 'location', label: 'Location' },
            { name: 'recorded_date', label: 'Recorded date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Trace records', value: items.length },
            { label: 'Batches tracked', value: new Set(items.map((i) => i.batch_number).filter(Boolean)).size },
          ]}
        />
      )}
    </div>
  )
}

export default InputSupplyManagementPage
