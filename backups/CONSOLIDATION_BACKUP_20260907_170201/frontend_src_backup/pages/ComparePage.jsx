import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { Scale, Plus, X, CheckCircle, Star } from 'lucide-react'

function ComparePage() {
  const [selectedProducts, setSelectedProducts] = useState([])

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: availableProducts } = useQuery({
    queryKey: ['products-for-compare'],
    queryFn: () => farmersAPI.getProductsForCompare().then(r => r.data),
  })

  const { data: marketData } = useQuery({
    queryKey: ['market-data'],
    queryFn: () => farmersAPI.getMarketComparisonData().then(r => r.data),
  })

  const addToCompare = (product) => {
    if (selectedProducts.length < 4 && !selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const removeFromCompare = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Compare Products</h1>
        <p className="text-gray-600">Compare agricultural products across different markets and parameters</p>
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Comparing {selectedProducts.length} Products
            </h2>
            <button
              onClick={() => setSelectedProducts([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedProducts.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 relative">
                <button
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{product.icon}</div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.variety}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium">₹{product.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < product.quality ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {selectedProducts.length >= 2 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
        {/* A caption is the first thing a screen-reader user hears. Without
            it the table is announced only as "table with N columns". */}
        <caption className="sr-only">Product comparison across selected items</caption>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Parameter</th>
                    {selectedProducts.map((product) => (
                      <th key={product.id} className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        {product.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-600">Price (₹/q)</td>
                    {selectedProducts.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center text-sm font-medium">
                        ₹{product.price}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-600">Market Trend</td>
                    {selectedProducts.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${
                          product.trend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.trend >= 0 ? '+' : ''}{product.trend}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-600">Demand Level</td>
                    {selectedProducts.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center text-sm">
                        {product.demand}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-600">Supply Status</td>
                    {selectedProducts.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center text-sm">
                        {product.supply}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-600">Best Market</td>
                    {selectedProducts.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-center text-sm">
                        {product.best_market}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Available Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Select Products to Compare
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProducts?.map((product) => (
            <div
              key={product.id}
              className={`border rounded-lg p-4 hover:shadow-md transition ${
                selectedProducts.find(p => p.id === product.id) ? 'border-green-500 bg-green-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="text-3xl mr-3">{product.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.variety}</p>
                  </div>
                </div>
                <button
                  onClick={() => addToCompare(product)}
                  disabled={selectedProducts.length >= 4 || selectedProducts.find(p => p.id === product.id)}
                  className={`p-2 rounded-lg transition ${
                    selectedProducts.find(p => p.id === product.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50'
                  }`}
                >
                  {selectedProducts.find(p => p.id === product.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Price</span>
                  <span className="font-medium">₹{product.price}/q</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trend</span>
                  <span className={`font-medium ${
                    product.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.trend >= 0 ? '+' : ''}{product.trend}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Scale className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Select 2-4 products to compare their features and prices</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComparePage