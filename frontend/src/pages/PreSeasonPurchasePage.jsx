import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { strategicAPI } from '../services/api'
import { TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react'

function PreSeasonPurchasePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('agreements')

  const { data: agreements, isLoading: agreementsLoading } = useQuery({
    queryKey: ['pre-season-agreements', user?.id],
    queryFn: () => strategicAPI.preSeason.getFarmerAgreements({ userId: user?.id }).then(r => r.data),
    enabled: !!user?.id && user?.role === 'farmer',
  })

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['pre-season-opportunities'],
    queryFn: () => strategicAPI.preSeason.getOpportunities().then(r => r.data),
  })

  const createAgreementMutation = useMutation({
    mutationFn: (data) => strategicAPI.preSeason.createAgreement(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pre-season-agreements'])
      alert('Agreement created successfully!')
    },
    onError: (error) => {
      alert(`Failed to create agreement: ${error.message}`)
    },
  })

  const handleCreateAgreement = (opportunityId) => {
    const agreementData = {
      farmer_id: user?.id,
      buyer_id: 'sample-buyer-id',
      crop_id: 'sample-crop-id',
      agreed_quantity: 10,
      agreed_price: 2500,
      delivery_date: '2024-12-01',
      risk_sharing_model: 'price_floor',
      price_floor: 2400,
    }
    createAgreementMutation.mutate(agreementData)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="w-8 h-8" />
          Pre-Season Purchase Agreements
        </h1>
        <p className="text-gray-600 mt-2">
          Secure guaranteed income through advance purchase agreements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setSelectedTab('agreements')}
          className={`px-4 py-2 font-medium ${selectedTab === 'agreements' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          My Agreements
        </button>
        <button
          onClick={() => setSelectedTab('opportunities')}
          className={`px-4 py-2 font-medium ${selectedTab === 'opportunities' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Available Opportunities
        </button>
      </div>

      {selectedTab === 'agreements' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Pre-Season Agreements</h2>
          {agreementsLoading ? (
            <div className="text-center py-8">Loading agreements...</div>
          ) : agreements?.items?.length > 0 ? (
            <div className="grid gap-4">
              {agreements.items.map((agreement) => (
                <div key={agreement.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{agreement.crop_name || 'Crop Agreement'}</h3>
                      <p className="text-gray-600">Buyer: {agreement.buyer_name || 'TBD'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      agreement.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {agreement.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-semibold">{agreement.agreed_quantity || 0} tons</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold">₹{agreement.agreed_price || 0}/quintal</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Delivery</p>
                      <p className="font-semibold">{agreement.delivery_date || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Progress</p>
                      <p className="font-semibold">{agreement.progress || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active agreements. Browse opportunities to get started.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'opportunities' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Purchase Opportunities</h2>
          {opportunitiesLoading ? (
            <div className="text-center py-8">Loading opportunities...</div>
          ) : opportunities?.items?.length > 0 ? (
            <div className="grid gap-4">
              {opportunities.items.map((opportunity) => (
                <div key={opportunity.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{opportunity.crop_name || 'Crop Opportunity'}</h3>
                      <p className="text-gray-600">Buyer: {opportunity.buyer_name || 'Corporate Buyer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{opportunity.price_per_quintal || 0}</p>
                      <p className="text-sm text-gray-500">per quintal</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Quantity Required</p>
                      <p className="font-semibold">{opportunity.quantity_required || 0} tons</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quality Standards</p>
                      <p className="font-semibold">{opportunity.quality_standards || 'Standard'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Risk Model</p>
                      <p className="font-semibold">{opportunity.risk_sharing_model || 'Price Floor'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateAgreement(opportunity.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Apply for Agreement
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No opportunities available at this time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PreSeasonPurchasePage