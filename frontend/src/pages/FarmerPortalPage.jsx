import { useQuery } from '@tanstack/react-query'
import { farmersAPI, financialAPI } from '../services/api'
import { Leaf, Award, TrendingUp, DollarSign, Package, MapPin } from 'lucide-react'
import LandRecords from '../components/FarmerPortal/LandRecords'

function FarmerPortalPage() {
  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: farmerData } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => farmersAPI.getFarmer('current-farmer-id').then(r => r.data),
  })

  const { data: fdiData } = useQuery({
    queryKey: ['fdi'],
    queryFn: () => farmersAPI.calculateFDI('current-farmer-id').then(r => r.data),
  })

  const { data: creditScore } = useQuery({
    queryKey: ['credit-score'],
    queryFn: () => financialAPI.getCreditScore('current-farmer-id').then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Farmer Portal</h1>

      {/* FDI Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Leaf className="w-5 h-5 mr-2 text-green-600" />
          Farmer Development Index
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {fdiData?.fdi_score || 0}
            </div>
            <div className="text-sm text-gray-600">FDI Score</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {fdiData?.fdi_grade || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Grade</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {fdiData?.advance_percentage || 0}%
            </div>
            <div className="text-sm text-gray-600">Advance Eligibility</div>
          </div>
        </div>
      </div>

      {/* Credit Score */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-blue-600" />
          Credit Score
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {creditScore?.score || 0}
            </div>
            <div className="text-sm text-gray-600">Rating: {creditScore?.grade || 'N/A'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Loan Limit</div>
            <div className="text-xl font-semibold text-gray-800">
              ₹{creditScore?.factors?.loan_limit || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">Apply for Loan</h3>
          <p className="text-sm text-gray-600">Get financial assistance for your farm</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <DollarSign className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">Request Advance</h3>
          <p className="text-sm text-gray-600">Get pre-season advance based on FDI</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <Package className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">My Products</h3>
          <p className="text-sm text-gray-600">Manage your product listings</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <Leaf className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">Certifications</h3>
          <p className="text-sm text-gray-600">View and add certifications</p>
        </div>
      </div>

      {/* Land Records */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-green-600" />
          Land Records
        </h2>
        <LandRecords farmerId="current-farmer-id" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          No recent activity to display
        </div>
      </div>
    </div>
  )
}

export default FarmerPortalPage
