import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsAPI } from '../services/api'
import { Truck, Package, CheckCircle, Navigation, Thermometer, Clock, TrendingUp, DollarSign, Route } from 'lucide-react'
import toast from 'react-hot-toast'

function LogisticsProviderPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const queryClient = useQueryClient()

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: providerProfile } = useQuery({
    queryKey: ['logistics-profile'],
    queryFn: () => vendorsAPI.getLogisticsProfile('current-provider-id').then(r => r.data),
  })

  const { data: activeShipments } = useQuery({
    queryKey: ['active-shipments'],
    queryFn: () => vendorsAPI.getActiveShipments('current-provider-id').then(r => r.data),
  })

  const { data: coldChainNodes } = useQuery({
    queryKey: ['coldchain-nodes'],
    queryFn: () => vendorsAPI.getColdChainNodes().then(r => r.data),
  })

  const { data: returnTrucks } = useQuery({
    queryKey: ['return-trucks'],
    queryFn: () => vendorsAPI.getReturnTruckOpportunities().then(r => r.data),
  })

  const createBookingMutation = useMutation({
    mutationFn: (data) => vendorsAPI.createLogisticsBooking(data),
    onSuccess: () => {
      toast.success('Booking created successfully')
      queryClient.invalidateQueries({ queryKey: ['active-shipments'] })
      setShowBookingModal(false)
    },
    onError: () => {
      toast.error('Failed to create booking')
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Logistics Provider Portal</h1>
        <p className="text-gray-600">Cold-chain corridor management and return-truck optimization</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Truck },
          { id: 'shipments', label: 'Active Shipments', icon: Package },
          { id: 'coldchain', label: 'Cold-Chain Nodes', icon: Thermometer },
          { id: 'return', label: 'Return Trucks', icon: Route },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Truck className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {activeShipments?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Shipments</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Thermometer className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Network</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {coldChainNodes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Cold-Chain Nodes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">This Month</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(providerProfile?.revenue || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Revenue</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-gray-500">On-Time</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(providerProfile?.on_time_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
          </div>

          {/* Cold-Chain Corridor Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">12-Node Cold-Chain Corridor</h2>
            <div className="bg-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <Navigation className="w-12 h-12 text-green-600" />
              </div>
              <div className="text-center text-gray-600 mb-4">
                Production Nodes → Transit Hubs → Distribution Centers
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">6</div>
                  <div className="text-sm text-gray-600">Production Nodes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">4</div>
                  <div className="text-sm text-gray-600">Transit Hubs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">2</div>
                  <div className="text-sm text-gray-600">Distribution Centers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Equipment Status</h2>
            <div className="space-y-3">
              {[
                { type: 'Reefer Trucks', total: 45, active: 38, status: 'operational' },
                { type: 'Cold Storage Units', total: 12, active: 11, status: 'operational' },
                { type: 'Pre-cooling Centers', total: 22, active: 20, status: 'operational' },
                { type: 'Mobile Cold Rooms', total: 8, active: 6, status: 'maintenance' }
              ].map((equip) => (
                <div key={equip.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-800">{equip.type}</div>
                    <div className="text-sm text-gray-600">
                      {equip.active} / {equip.total} active
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    equip.status === 'operational' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {equip.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Active Shipments</h2>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              New Booking
            </button>
          </div>

          <div className="space-y-4">
            {activeShipments?.map((shipment) => (
              <div key={shipment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Shipment #{shipment.id}</h3>
                    <p className="text-sm text-gray-500">{shipment.product}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    shipment.status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                    shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {shipment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-gray-600">Origin</div>
                    <div className="font-medium">{shipment.origin}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Destination</div>
                    <div className="font-medium">{shipment.destination}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Quantity</div>
                    <div className="font-medium">{shipment.quantity} kg</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Temperature</div>
                    <div className="font-medium">{shipment.temp}°C</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    ETA: {shipment.eta}
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Track Shipment
                  </button>
                </div>
              </div>
            )) || (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Shipments</h3>
                <p className="text-gray-600 mb-4">Create your first booking to get started</p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Create Booking
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cold-Chain Nodes Tab */}
      {activeTab === 'coldchain' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Cold-Chain Network</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coldChainNodes?.map((node) => (
              <div key={node.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Thermometer className="w-8 h-8 text-blue-600" />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    node.type === 'production' ? 'bg-green-100 text-green-800' :
                    node.type === 'transit' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {node.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{node.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">{node.capacity} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-medium">{node.utilization}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature</span>
                    <span className="font-medium">{node.temp}°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Trucks Tab */}
      {activeTab === 'return' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Route className="w-6 h-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Return-Truck Optimization</h3>
                <p className="text-sm text-gray-600">
                  Maximize vehicle utilization by booking return trips from NCR to Northeast
                  production nodes. Reduce empty miles and improve margins.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-800">Available Return Lanes</h2>
          
          <div className="space-y-4">
            {returnTrucks?.map((lane) => (
              <div key={lane.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{lane.origin} → {lane.destination}</h3>
                    <p className="text-sm text-gray-500">{lane.distance} km</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lane.status === 'available' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lane.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-gray-600">Vehicle Type</div>
                    <div className="font-medium">{lane.vehicle_type}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Capacity</div>
                    <div className="font-medium">{lane.capacity} MT</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Available</div>
                    <div className="font-medium">{lane.available_date}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rate</div>
                    <div className="font-medium">₹{lane.rate}/km</div>
                  </div>
                </div>

                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  Book Return Trip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create Logistics Booking</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origin *
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">Select origin</option>
                      <option value="manipur">Manipur</option>
                      <option value="nagaland">Nagaland</option>
                      <option value="assam">Assam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination *
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">Select destination</option>
                      <option value="ncr">NCR (Delhi)</option>
                      <option value="guwahati">Guwahati</option>
                      <option value="kolkata">Kolkata</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (MT) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Temperature (°C) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Create Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogisticsProviderPage