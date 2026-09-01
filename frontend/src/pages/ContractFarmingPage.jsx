import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { strategicAPI } from '../services/api'
import { FileText, Sprout, CheckCircle, AlertCircle, TrendingUp, Leaf } from 'lucide-react'

function ContractFarmingPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('contracts')

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['contract-farming-contracts', user?.id],
    queryFn: () => strategicAPI.contractFarming.getFarmerContracts({ userId: user?.id }).then(r => r.data),
    enabled: !!user?.id && user?.role === 'farmer',
  })

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['contract-farming-opportunities'],
    queryFn: () => strategicAPI.contractFarming.getOpportunities().then(r => r.data),
  })

  const createContractMutation = useMutation({
    mutationFn: (data) => strategicAPI.contractFarming.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contract-farming-contracts'])
      alert('Contract created successfully!')
    },
    onError: (error) => {
      alert(`Failed to create contract: ${error.message}`)
    },
  })

  const handleCreateContract = (opportunityId) => {
    const contractData = {
      farmer_id: user?.id,
      buyer_id: 'sample-buyer-id',
      crop_variety: 'Sample Variety',
      area_hectares: 2.5,
      expected_yield_tons: 5,
      contract_period_start: '2024-06-01',
      contract_period_end: '2024-12-31',
      base_price: 2800,
      quality_bonus_structure: { grade_a: 10, grade_b: 5 },
    }
    createContractMutation.mutate(contractData)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Contract Farming
        </h1>
        <p className="text-gray-600 mt-2">
          Long-term agricultural contracts with technical assistance and guaranteed markets
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setSelectedTab('contracts')}
          className={`px-4 py-2 font-medium ${selectedTab === 'contracts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          My Contracts
        </button>
        <button
          onClick={() => setSelectedTab('opportunities')}
          className={`px-4 py-2 font-medium ${selectedTab === 'opportunities' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Available Contracts
        </button>
      </div>

      {selectedTab === 'contracts' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Farming Contracts</h2>
          {contractsLoading ? (
            <div className="text-center py-8">Loading contracts...</div>
          ) : contracts?.items?.length > 0 ? (
            <div className="grid gap-4">
              {contracts.items.map((contract) => (
                <div key={contract.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{contract.crop_variety || 'Contract'}</h3>
                      <p className="text-gray-600">Buyer: {contract.buyer_name || 'TBD'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Area</p>
                      <p className="font-semibold">{contract.area_hectares || 0} hectares</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expected Yield</p>
                      <p className="font-semibold">{contract.expected_yield_tons || 0} tons</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Base Price</p>
                      <p className="font-semibold">₹{contract.base_price || 0}/quintal</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Compliance</p>
                      <p className="font-semibold">{contract.compliance_score || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active contracts. Browse opportunities to get started.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'opportunities' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Contract Opportunities</h2>
          {opportunitiesLoading ? (
            <div className="text-center py-8">Loading opportunities...</div>
          ) : opportunities?.items?.length > 0 ? (
            <div className="grid gap-4">
              {opportunities.items.map((opportunity) => (
                <div key={opportunity.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{opportunity.crop_variety || 'Crop Contract'}</h3>
                      <p className="text-gray-600">Buyer: {opportunity.buyer_name || 'Corporate Buyer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{opportunity.base_price || 0}</p>
                      <p className="text-sm text-gray-500">base price/quintal</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Area Required</p>
                      <p className="font-semibold">{opportunity.area_hectares || 0} hectares</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Technical Package</p>
                      <p className="font-semibold">{opportunity.technical_package || 'Included'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quality Bonus</p>
                      <p className="font-semibold">{opportunity.quality_bonus || 'Available'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateContract(opportunity.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Apply for Contract
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Sprout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No contract opportunities available at this time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ContractFarmingPage