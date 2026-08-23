import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsAPI } from '../services/api'
import { ShoppingCart, Star, Leaf, Award, Truck } from 'lucide-react'
import NutritionLabel from '../components/NutritionIntelligence/NutritionLabel'

function ProductDetailPage() {
  const { id } = useParams()

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await productsAPI.getProduct(id)).data,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">Error loading product: {error.message}</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-gray-600">Product not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 2}`}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.gi_status && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                <Award className="w-3 h-3 mr-1" />
                GI Certified
              </span>
            )}
            {product.organic && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded flex items-center">
                <Leaf className="w-3 h-3 mr-1" />
                Organic
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">
            {product.category_name} • {product.state_name}
          </p>

          <div className="flex items-center mb-4">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="ml-1 text-gray-700">4.5 (128 reviews)</span>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-800">
              ₹{product.base_price}
            </span>
            <span className="text-gray-600">/{product.unit_symbol}</span>
            {product.map_price && (
              <span className="ml-2 text-sm text-gray-500">
                MAP: ₹{product.map_price}
              </span>
            )}
          </div>

          <p className="text-gray-700 mb-6">{product.description}</p>

          {product.usp && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Why This Product?</h3>
              <p className="text-green-700 text-sm">{product.usp}</p>
            </div>
          )}

          {/* Nutrition Data — real nutritionIntelligenceService data (grade, daily-value %,
              verification method/confidence), not the flat product.nutrition_data blob.
              NutritionLabel self-fetches by productId and renders its own honest
              "not available" state when the product has no recorded nutrition data. */}
          <div className="mb-6">
            <NutritionLabel productId={product.id} showComparison />
          </div>

          {/* Certifications */}
          {product.certifications && product.certifications.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {product.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {cert.certification_type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50">
                -
              </button>
              <input
                type="number"
                defaultValue="1"
                min="1"
                className="w-20 text-center border border-gray-300 rounded-lg"
              />
              <button className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50">
                +
              </button>
              <span className="text-gray-600">{product.unit_symbol}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </button>
            <button className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition">
              Buy Now
            </button>
          </div>

          {/* Delivery Info */}
          <div className="border-t pt-6">
            <div className="flex items-start gap-3 mb-3">
              <Truck className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-800">Free Delivery</h4>
                <p className="text-sm text-gray-600">
                  On orders above ₹1,500. Standard delivery in 3-5 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
