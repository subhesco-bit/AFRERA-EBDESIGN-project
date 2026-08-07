import React, { useState } from 'react';

/**
 * Organic Farm Registration Component
 * Allows farmers to register their organic farms for certification
 */
const OrganicFarmRegistration = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    farm_name: '',
    certification_standard_id: '',
    total_area_hectares: '',
    organic_area_hectares: '',
    in_conversion_area_hectares: '',
    location_id: '',
    gps_coordinates: { lat: '', lng: '' }
  });
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    fetchOrganicStandards();
  }, []);

  const fetchOrganicStandards = async () => {
    try {
      const response = await fetch('/api/v1/organic-traceability/standards');
      const data = await response.json();
      setStandards(data);
    } catch (err) {
      console.error('Failed to fetch standards:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/organic-traceability/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...formData,
          total_area_hectares: parseFloat(formData.total_area_hectares),
          organic_area_hectares: parseFloat(formData.organic_area_hectares),
          in_conversion_area_hectares: parseFloat(formData.in_conversion_area_hectares) || 0
        })
      });

      if (!response.ok) throw new Error('Registration failed');

      const result = await response.json();
      onSuccess?.(result);
      setFormData({
        farm_name: '',
        certification_standard_id: '',
        total_area_hectares: '',
        organic_area_hectares: '',
        in_conversion_area_hectares: '',
        location_id: '',
        gps_coordinates: { lat: '', lng: '' }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGPSChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      gps_coordinates: {
        ...prev.gps_coordinates,
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Organic Farm</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Name *
          </label>
          <input
            type="text"
            name="farm_name"
            value={formData.farm_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter farm name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organic Certification Standard *
          </label>
          <select
            name="certification_standard_id"
            value={formData.certification_standard_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select standard</option>
            {standards.map(standard => (
              <option key={standard.id} value={standard.id}>
                {standard.name} ({standard.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Area (Hectares) *
            </label>
            <input
              type="number"
              step="0.01"
              name="total_area_hectares"
              value={formData.total_area_hectares}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organic Area (Hectares) *
            </label>
            <input
              type="number"
              step="0.01"
              name="organic_area_hectares"
              value={formData.organic_area_hectares}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              In Conversion (Hectares)
            </label>
            <input
              type="number"
              step="0.01"
              name="in_conversion_area_hectares"
              value={formData.in_conversion_area_hectares}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPS Latitude
            </label>
            <input
              type="text"
              value={formData.gps_coordinates.lat}
              onChange={(e) => handleGPSChange('lat', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 26.1445"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPS Longitude
            </label>
            <input
              type="text"
              value={formData.gps_coordinates.lng}
              onChange={(e) => handleGPSChange('lng', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 91.7362"
            />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Certification Process</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Registration submitted for review</li>
            <li>• 36-month conversion period for new organic farms</li>
            <li>• Annual inspections required</li>
            <li>• Soil and water testing mandatory</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registering...' : 'Register Farm'}
        </button>
      </form>
    </div>
  );
};

export default OrganicFarmRegistration;
