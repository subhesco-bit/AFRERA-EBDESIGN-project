import { Shield, FileText, CheckCircle, AlertCircle } from 'lucide-react'

function InsurancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Insurance Portal</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <Shield className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">5</div>
          <div className="text-sm text-gray-600">Active Policies</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">2</div>
          <div className="text-sm text-gray-600">Pending Claims</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">12</div>
          <div className="text-sm text-gray-600">Settled Claims</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
          <div className="text-2xl font-bold text-gray-800">₹2.5L</div>
          <div className="text-sm text-gray-600">Total Coverage</div>
        </div>
      </div>

      {/* Insurance Products */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Insurance Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-500 transition cursor-pointer">
            <div className="flex items-center mb-3">
              <Shield className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Crop Insurance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Protect your crops against natural calamities and yield loss
            </p>
            <div className="text-sm text-green-600 font-medium">Premium: 2% of sum insured</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-500 transition cursor-pointer">
            <div className="flex items-center mb-3">
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Transit Insurance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Coverage for damage during transportation
            </p>
            <div className="text-sm text-blue-600 font-medium">Premium: 0.5% of value</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-green-500 transition cursor-pointer">
            <div className="flex items-center mb-3">
              <Shield className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Warehouse Insurance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Fire, flood, and burglary coverage for stored produce
            </p>
            <div className="text-sm text-orange-600 font-medium">Premium: 0.8% of stored value</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Submit Claim</h3>
          <p className="text-sm text-gray-600">File an insurance claim for your policy</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <Shield className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Buy Policy</h3>
          <p className="text-sm text-gray-600">Purchase a new insurance policy</p>
        </div>
      </div>

      {/* Recent Claims */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Claims</h2>
        <div className="text-center py-8 text-gray-500">
          No recent claims to display
        </div>
      </div>
    </div>
  )
}

export default InsurancePage
