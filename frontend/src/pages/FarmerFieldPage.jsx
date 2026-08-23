import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { 
  MapPin, 
  Sprout, 
  Calendar, 
  Droplets, 
  Sun, 
  Thermometer,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

function FarmerFieldPage() {
  const [selectedField, setSelectedField] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const queryClient = useQueryClient()

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: fields } = useQuery({
    queryKey: ['farmer-fields'],
    queryFn: () => farmersAPI.getFields('current-farmer-id').then(r => r.data),
  })

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId) => farmersAPI.deleteField(fieldId),
    onSuccess: () => {
      toast.success('Field deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['farmer-fields'] })
    },
    onError: () => {
      toast.error('Failed to delete field')
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">My Fields</h1>
          <p className="text-gray-600">Manage your agricultural land and crops</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Field
        </button>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields?.map((field) => (
          <div
            key={field.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                // Enter and Space are what a native <button> responds to.
                // Without this the card is unreachable by keyboard entirely.
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click() }
              }}
            className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
            onClick={() => setSelectedField(field)}
          >
            {/* Field Image/Map Placeholder */}
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
              <MapPin className="w-16 h-16 text-green-400" />
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{field.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {field.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Sprout className="w-4 h-4 mr-2" />
                  {field.crop || 'Fallow'}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {field.area} hectares
                </div>
              </div>

              {/* Crop Status */}
              {field.crop && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Crop Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      field.status === 'Healthy' ? 'bg-green-100 text-green-800' :
                      field.status === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {field.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                      <div className="text-gray-600">{field.moisture}%</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <Sun className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <div className="text-gray-600">{field.sunlight}h</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <Thermometer className="w-4 h-4 mx-auto mb-1 text-red-600" />
                      <div className="text-gray-600">{field.temp}°C</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Edit logic
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Are you sure you want to delete this field?')) {
                      deleteFieldMutation.mutate(field.id)
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )) || (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Fields Added</h3>
            <p className="text-gray-600 mb-4">Start by adding your agricultural land</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Add Your First Field
            </button>
          </div>
        )}
      </div>

      {/* Field Detail Modal */}
      {selectedField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{selectedField.name}</h2>
                <button
                  onClick={() => setSelectedField(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Field Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Location</div>
                    <div className="font-semibold text-gray-800">{selectedField.location}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Area</div>
                    <div className="font-semibold text-gray-800">{selectedField.area} hectares</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Soil Type</div>
                    <div className="font-semibold text-gray-800">{selectedField.soil_type || 'Not specified'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Irrigation</div>
                    <div className="font-semibold text-gray-800">{selectedField.irrigation || 'Not specified'}</div>
                  </div>
                </div>

                {selectedField.crop && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Current Crop</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-sm text-gray-600">Crop</div>
                        <div className="font-medium">{selectedField.crop}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Planted</div>
                        <div className="font-medium">{selectedField.planted_date}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Expected Harvest</div>
                        <div className="font-medium">{selectedField.expected_harvest}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="font-medium">{selectedField.status}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                    Plant Crop
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    View Soil Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Field</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., North Field, Main Plot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Village, District, State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (hectares) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soil Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">Select type</option>
                      <option value="alluvial">Alluvial</option>
                      <option value="black">Black Soil</option>
                      <option value="red">Red Soil</option>
                      <option value="laterite">Laterite</option>
                      <option value="mountain">Mountain Soil</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Irrigation Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select type</option>
                    <option value="rainfed">Rainfed</option>
                    <option value="canal">Canal Irrigation</option>
                    <option value="tubewell">Tube Well</option>
                    <option value="drip">Drip Irrigation</option>
                    <option value="sprinkler">Sprinkler</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Add Field
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

export default FarmerFieldPage