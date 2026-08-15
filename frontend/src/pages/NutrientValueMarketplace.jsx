import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nutrientValueSalesAPI } from '../services/api';
import { 
  Leaf, 
  Gem, 
  Scale, 
  Award, 
  TrendingUp,
  Filter,
  BarChart3,
  CheckCircle,
  Star,
  Zap,
  Beaker,
  Calculator
} from 'lucide-react';

/**
 * AFRERA Nutrient-Value Marketplace
 * 
 * Revolutionary agricultural commerce:
 * - Sell by nutrient value rather than kilogram
 * - Quality tiers (Diamond, Platinum, Gold, Silver, Bronze, Standard)
 * - Lab verification system
 * - Nutrient certification
 * - Price per nutrient unit calculation
 */

const NutrientValueMarketplace = () => {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Search by nutrient criteria
  const { data: nutrientProducts, isLoading: searchLoading } = useQuery({
    queryKey: ['nutrientProducts'],
    queryFn: () => nutrientValueSalesAPI.searchByNutrientCriteria({ min_nutrient_score: 0.6 })
  });

  const renderMarketplace = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Leaf className="h-6 w-6" />
          Nutrient-Value Marketplace
        </h2>
        <p className="text-green-100">
          Revolutionary agricultural commerce: Sell by nutrient value, not just weight
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Diamond Tier</p>
              <p className="text-2xl font-bold text-gray-900">
                {nutrientProducts?.products?.filter(p => p.nutrient_tier === 'diamond').length || 0}
              </p>
            </div>
            <Gem className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Platinum Tier</p>
              <p className="text-2xl font-bold text-gray-900">
                {nutrientProducts?.products?.filter(p => p.nutrient_tier === 'platinum').length || 0}
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gold Tier</p>
              <p className="text-2xl font-bold text-gray-900">
                {nutrientProducts?.products?.filter(p => p.nutrient_tier === 'gold').length || 0}
              </p>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {nutrientProducts?.products?.filter(p => p.verification_status === 'approved').length || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Nutrient-Rich Products
          </h3>
          <div className="flex gap-2">
            <select className="p-2 border rounded text-sm">
              <option>All Tiers</option>
              <option>Diamond</option>
              <option>Platinum</option>
              <option>Gold</option>
              <option>Silver</option>
              <option>Bronze</option>
            </select>
            <select className="p-2 border rounded text-sm">
              <option>All Categories</option>
              <option>Grains</option>
              <option>Pulses</option>
              <option>Vegetables</option>
              <option>Fruits</option>
            </select>
          </div>
        </div>
        
        {searchLoading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : nutrientProducts?.products ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nutrientProducts.products.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{product.product_name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.nutrient_tier === 'diamond' ? 'bg-blue-100 text-blue-800' :
                    product.nutrient_tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                    product.nutrient_tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                    product.nutrient_tier === 'silver' ? 'bg-gray-200 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {product.nutrient_badge}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nutrient Score:</span>
                    <span className="font-semibold">{(product.nutrient_density_score * 100).toFixed(0)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-semibold">₹{product.base_price}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nutrient Price:</span>
                    <span className="font-semibold text-green-600">₹{product.nutrient_value_price}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Premium:</span>
                    <span className="font-semibold text-orange-600">+{product.premium_percentage}%</span>
                  </div>
                </div>
                
                <div className="p-2 bg-gray-50 rounded mb-3">
                  <p className="text-xs text-gray-600 mb-1">Nutrient Content (per 100g)</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>Protein: {product.verified_nutrient_content?.protein}g</div>
                    <div>Iron: {product.verified_nutrient_content?.iron}mg</div>
                    <div>Calcium: {product.verified_nutrient_content?.calcium}mg</div>
                    <div>Fiber: {product.verified_nutrient_content?.fiber}g</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedProducts([...selectedProducts, product.id])}
                    className="flex-1 bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600 transition"
                  >
                    Add to Compare
                  </button>
                  <button className="flex-1 bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products found</p>
        )}
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Nutrient Comparison
        </h3>
        
        {selectedProducts.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Select products from marketplace to compare</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-center">Tier</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">Protein</th>
                    <th className="p-3 text-center">Iron</th>
                    <th className="p-3 text-center">Calcium</th>
                    <th className="p-3 text-center">Fiber</th>
                    <th className="p-3 text-center">Price/kg</th>
                    <th className="p-3 text-center">Price/Protein</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((productId, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">Product {productId}</td>
                      <td className="p-3 text-center">Gold</td>
                      <td className="p-3 text-center">85</td>
                      <td className="p-3 text-center">12g</td>
                      <td className="p-3 text-center">3mg</td>
                      <td className="p-3 text-center">25mg</td>
                      <td className="p-3 text-center">8g</td>
                      <td className="p-3 text-center">₹45</td>
                      <td className="p-3 text-center">₹3.75</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Beaker className="h-5 w-5" />
          Nutrient Verification
        </h3>
        
        <div className="p-4 bg-blue-50 rounded mb-4">
          <h4 className="font-medium mb-3">Submit for Lab Verification</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                id="verifyProductId"
                placeholder="Enter Product ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Testing Laboratory</label>
              <input
                type="text"
                id="testingLab"
                placeholder="Enter lab name"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g/100g)</label>
              <input
                type="number"
                id="proteinContent"
                placeholder="Enter protein content"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Iron (mg/100g)</label>
              <input
                type="number"
                id="ironContent"
                placeholder="Enter iron content"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calcium (mg/100g)</label>
              <input
                type="number"
                id="calciumContent"
                placeholder="Enter calcium content"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiber (g/100g)</label>
              <input
                type="number"
                id="fiberContent"
                placeholder="Enter fiber content"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
            Submit for Verification
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Pending Verifications</h4>
          {[1, 2].map((verify) => (
            <div key={verify} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">Verification #{verify}</h5>
                  <p className="text-sm text-gray-500">Product: Rice (Basmati)</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Pending
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Lab: National Food Lab</span>
                <span>Submitted: {verify} days ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCertification = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Nutrient Certification
        </h3>
        
        <div className="p-4 bg-green-50 rounded mb-4">
          <h4 className="font-medium mb-3">Issue Quality Certificate</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                id="certProductId"
                placeholder="Enter Product ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
              <select className="w-full p-2 border rounded">
                <option>Nutrient Quality</option>
                <option>Organic</option>
                <option>GMO-Free</option>
                <option>Non-GMO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifying Body</label>
              <input
                type="text"
                id="certifyingBody"
                placeholder="Enter certifying body"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                id="validUntil"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition">
            Issue Certificate
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Active Certificates</h4>
          {[1, 2, 3].map((cert) => (
            <div key={cert} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">Certificate #{cert}</h5>
                  <p className="text-sm text-gray-500">Type: Nutrient Quality</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Body: FSSAI</span>
                <span>Valid: {cert * 6} months</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Nutrient-Value Pricing
        </h3>
        
        <div className="p-4 bg-purple-50 rounded mb-4">
          <h4 className="font-medium mb-3">Calculate Nutrient Value Price</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                id="priceProductId"
                placeholder="Enter Product ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹/kg)</label>
              <input
                type="number"
                id="basePrice"
                placeholder="Enter base price"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition">
            Calculate Nutrient Price
          </button>
        </div>

        <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded">
          <h4 className="font-medium mb-3">Pricing Model Explained</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span><strong>Diamond Tier:</strong> Up to 100% premium (top 5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span><strong>Platinum Tier:</strong> Up to 80% premium (top 10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span><strong>Gold Tier:</strong> Up to 50% premium (top 25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span><strong>Silver Tier:</strong> Up to 30% premium (above average)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span><strong>Bronze Tier:</strong> Meets nutritional standards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span><strong>Standard Tier:</strong> Basic nutritional value</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-600" />
            Nutrient-Value Marketplace
          </h1>
          <p className="text-gray-600 mt-2">
            Revolutionary agricultural commerce: Sell by nutrient value, not just weight
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-3 font-medium ${activeTab === 'marketplace' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-3 font-medium ${activeTab === 'comparison' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
            >
              Comparison
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-3 font-medium ${activeTab === 'verification' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
            >
              Verification
            </button>
            <button
              onClick={() => setActiveTab('certification')}
              className={`px-4 py-3 font-medium ${activeTab === 'certification' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
            >
              Certification
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-3 font-medium ${activeTab === 'pricing' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
            >
              Pricing
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'marketplace' && renderMarketplace()}
          {activeTab === 'comparison' && renderComparison()}
          {activeTab === 'verification' && renderVerification()}
          {activeTab === 'certification' && renderCertification()}
          {activeTab === 'pricing' && renderPricing()}
        </div>
      </div>
    </div>
  );
};

export default NutrientValueMarketplace;
