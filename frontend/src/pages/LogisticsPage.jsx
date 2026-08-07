import { Truck, Package, MapPin, Clock } from 'lucide-react'

function LogisticsPage() {
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Shipments</h2>
        <div className="text-center py-8 text-gray-500">
          No recent shipments to display
        </div>
      </div>
    </div>
  )
}

export default LogisticsPage
