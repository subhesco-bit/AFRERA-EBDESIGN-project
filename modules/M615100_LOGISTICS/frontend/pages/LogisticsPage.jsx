import { useState } from 'react'
import { Truck, Package, MapPin, Clock, Search } from 'lucide-react'
import DeviceMonitor from '../components/IoTIntegration/DeviceMonitor'
import RealTimeTracking from '../components/Logistics/RealTimeTracking'
import CustodyChainViewer from '../components/Logistics/CustodyChainViewer'

function LogisticsPage() {
  const [shipmentIdInput, setShipmentIdInput] = useState('')
  const [trackedShipmentId, setTrackedShipmentId] = useState(null)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Logistics Portal</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <Truck className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">24</div>
          <div className="text-sm text-gray-600">Active Shipments</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Package className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">156</div>
          <div className="text-sm text-gray-600">Total Shipments</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <MapPin className="w-8 h-8 text-orange-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">8</div>
          <div className="text-sm text-gray-600">States Covered</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Clock className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">98%</div>
          <div className="text-sm text-gray-600">On-Time Delivery</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold text-gray-800 mb-2">Create Shipment</h3>
          <p className="text-sm text-gray-600">Book a new shipment for your order</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold text-gray-800 mb-2">Track Shipment</h3>
          <p className="text-sm text-gray-600">Track your shipment in real-time</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold text-gray-800 mb-2">Register Vehicle</h3>
          <p className="text-sm text-gray-600">Add your vehicle to the fleet</p>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Shipments</h2>
        <div className="text-center py-8 text-gray-500">
          No recent shipments to display
        </div>
      </div>

      {/* Track a Shipment (Live) */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Track a Shipment</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (shipmentIdInput.trim()) setTrackedShipmentId(shipmentIdInput.trim())
          }}
          className="flex gap-3 mb-4"
        >
          <input
            type="text"
            value={shipmentIdInput}
            onChange={(e) => setShipmentIdInput(e.target.value)}
            placeholder="Enter shipment ID..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Track
          </button>
        </form>
        {trackedShipmentId && (
          <div className="space-y-4">
            <RealTimeTracking shipmentId={trackedShipmentId} />
            <CustodyChainViewer shipmentId={trackedShipmentId} />
          </div>
        )}
      </div>

      {/* IoT Cold-Chain Monitoring */}
      <div className="mb-8">
        <DeviceMonitor />
      </div>
    </div>
  )
}

export default LogisticsPage
