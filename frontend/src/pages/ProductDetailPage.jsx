import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsAPI, productReviewsAPI, ordersAPI, productMediaAIAPI } from '../services/api'
import { ShoppingCart, Star, Leaf, Award, Truck, ChevronLeft, Minus, Plus, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import NutritionLabel from '../components/NutritionIntelligence/NutritionLabel'
import { buildProductImagePrompt } from '../utils/aiStudio'

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [quantity, setQuantity] = useState(1)
  const [aiImage, setAiImage] = useState(null)

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await productsAPI.getProduct(id)).data,
  })

  // Real review stats (product_reviews table, migration
  // 009_marketplace_enhancements.sql) — no rating is shown until this
  // resolves, and nothing is shown at all if the product has zero reviews.
  // Same honesty convention as MarketplacePage.jsx's average_rating handling.
  const { data: reviewStats } = useQuery({
    queryKey: ['productReviewStats', id],
    queryFn: async () => (await productReviewsAPI.getStats(id)).data?.data,
    enabled: !!id,
  })

  const addToCart = useMutation({
    mutationFn: (qty) => ordersAPI.addToCart({ product_id: id, quantity: qty }),
    onSuccess: () => toast.success('Added to cart'),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add to cart'),
  })

  const buyNow = async () => {
    try {
      await ordersAPI.addToCart({ product_id: id, quantity })
      navigate('/cart')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start checkout')
    }
  }

  const generateAiImage = useMutation({
    mutationFn: () => {
      const prompt = searchParams.get('prompt') || buildProductImagePrompt(product?.name, product?.description, product?.state_name)
      return productMediaAIAPI.generateImage(id, prompt)
    },
    onSuccess: (res) => {
      const payload = res.data?.data || res.data || {}
      if (payload?.status === 'not_configured') {
        toast('AI image generation is not configured in this environment yet. The listing remains live.', { icon: 'ℹ️' })
        return
      }
      if (payload?.imageUrl) {
        setAiImage(payload.imageUrl)
        toast.success('AI image generated')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'AI image generation failed'),
  })

  useEffect(() => {
    if (product && searchParams.get('autoAI') === '1') {
      generateAiImage.mutate()
    }
  }, [product, searchParams])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-v42-paddy2 rounded-lg mb-8"></div>
          <div className="h-8 bg-v42-paddy2 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-v42-paddy2 rounded w-3/4 mb-4"></div>
          <div className="h-12 bg-v42-paddy2 rounded w-1/4"></div>
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
        <div className="text-v42-mut">Product not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-v42-mut hover:text-v42-forest mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="bg-v42-paddy2 rounded-lg overflow-hidden mb-4">
            {(aiImage || product.images?.[0]) ? (
              <img
                src={aiImage || product.images[0]}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center">
                <span className="text-v42-mut">No image available</span>
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => generateAiImage.mutate()}
              disabled={generateAiImage.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-v42-forest px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {generateAiImage.isPending ? 'Generating…' : 'Generate AI image'}
            </button>
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
              <span className="bg-v42-forest/10 text-v42-ink text-xs px-2 py-1 rounded flex items-center">
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

          <h1 className="text-3xl font-bold text-v42-ink mb-2">{product.name}</h1>
          <p className="text-v42-mut mb-4">
            {product.category_name} • {product.state_name}
          </p>

          {/* Real rating, not a fixed placeholder — only shown once reviews
              actually exist, matching MarketplacePage.jsx's convention. */}
          {reviewStats?.totalReviews > 0 ? (
            <div className="flex items-center mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="ml-1 text-v42-ink2">
                {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} review{reviewStats.totalReviews === 1 ? '' : 's'})
              </span>
            </div>
          ) : (
            <div className="mb-4 text-sm text-v42-mut">No reviews yet</div>
          )}

          <div className="mb-6">
            <span className="text-3xl font-bold text-v42-ink">
              ₹{product.base_price}
            </span>
            <span className="text-v42-mut">/{product.unit_symbol}</span>
            {product.map_price && (
              <span className="ml-2 text-sm text-v42-mut">
                MAP: ₹{product.map_price}
              </span>
            )}
          </div>

          <p className="text-v42-ink2 mb-6">{product.description}</p>

          {product.usp && (
            <div className="bg-v42-paddy2 border border-v42-line rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-v42-ink mb-2">Why This Product?</h3>
              <p className="text-v42-forest text-sm">{product.usp}</p>
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
              <h3 className="font-semibold text-v42-ink mb-2">Certifications</h3>
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
            <label className="block text-sm font-medium text-v42-ink2 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-10 border border-v42-line rounded-lg hover:bg-v42-paddy2 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 text-center border border-v42-line rounded-lg"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-10 h-10 border border-v42-line rounded-lg hover:bg-v42-paddy2 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-v42-mut">{product.unit_symbol}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => addToCart.mutate(quantity)}
              disabled={addToCart.isPending}
              className="flex-1 px-6 py-3 bg-v42-forest text-white rounded-lg font-semibold hover:bg-v42-forestd transition flex items-center justify-center disabled:opacity-60"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {addToCart.isPending ? 'Adding…' : 'Add to Cart'}
            </button>
            <button
              onClick={buyNow}
              className="px-6 py-3 border-2 border-v42-forest text-v42-forest rounded-lg font-semibold hover:bg-v42-forest/10 transition"
            >
              Buy Now
            </button>
          </div>

          {/* Delivery Info — ₹1,500 free-shipping threshold is the real value
              used by orderService.js's shipping calculation, not invented. */}
          <div className="border-t pt-6">
            <div className="flex items-start gap-3 mb-3">
              <Truck className="w-5 h-5 text-v42-mut flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-v42-ink">Free Delivery</h4>
                <p className="text-sm text-v42-mut">
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
