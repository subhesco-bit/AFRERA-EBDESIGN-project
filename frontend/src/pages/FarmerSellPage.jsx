import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import { Package, DollarSign, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function FarmerSellPage() {
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    quantity: '',
    unit: 'kg',
    expected_price: '',
    harvest_date: '',
    location: '',
    description: '',
    certifications: [],
  });

  const queryClient = useQueryClient();

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => farmersAPI.getCategories().then(r => r.data),
  });

  const { data: farmerProfile } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => farmersAPI.getFarmer('current-farmer-id').then(r => r.data),
  });

  const sellMutation = useMutation({
    mutationFn: (data) => farmersAPI.createListing(data),
    onSuccess: () => {
      toast.success('Listing created successfully!');
      queryClient.invalidateQueries({ queryKey: ['farmer-listings'] });
      setFormData({
        product_name: '',
        category: '',
        quantity: '',
        unit: 'kg',
        expected_price: '',
        harvest_date: '',
        location: farmerProfile?.location || '',
        description: '',
        certifications: [],
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create listing');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sellMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sell Your Produce</h1>
          <p className="text-gray-600">List your agricultural products for sale on the marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Product Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-600" />
              Product Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input id="product_name"
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Assam Tea, Sikkim Cardamom"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your product, quality, variety, etc."
              />
            </div>
          </div>

          {/* Quantity & Pricing */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Quantity & Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <div className="flex">
                  <input id="quantity"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Amount"
                  />
                  <select aria-label="Unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="kg">Kg</option>
                    <option value="quintal">Quintal</option>
                    <option value="tonne">Tonne</option>
                    <option value="litre">Litre</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="expected_price" className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Price (₹) *
                </label>
                <input id="expected_price"
                  type="number"
                  name="expected_price"
                  value={formData.expected_price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Per unit"
                />
              </div>

              <div>
                <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Harvest Date *
                </label>
                <input id="harvest_date"
                  type="date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Location
            </h2>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Farm Location *
              </label>
              <input id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Village, District, State"
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Certifications (Optional)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Organic',
                'GI Tagged',
                'FSSAI',
                'ISO',
                'HACCP',
                'Fair Trade',
              ].map((cert) => (
                <label htmlFor="type-checkbox" key={cert} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input id="type-checkbox"
                    type="checkbox"
                    checked={formData.certifications.includes(cert)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          certifications: [...prev.certifications, cert],
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          certifications: prev.certifications.filter(c => c !== cert),
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{cert}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sellMutation.isPending}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {sellMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Listing...
                </>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>

        {/* Price Guide */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Price Guide</h3>
          <p className="text-sm text-blue-700">
            Check current market prices before setting your expected price.
            Competitive pricing helps sell your products faster.
          </p>
          <button
            type="button"
            onClick={() => window.location.href = '/pricecheck'}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Market Prices →
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmerSellPage;
