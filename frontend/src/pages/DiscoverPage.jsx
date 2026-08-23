import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { Search, Star, MapPin, TrendingUp, Heart, Eye } from 'lucide-react'

function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => farmersAPI.getFeaturedProducts().then(r => r.data),
  })

  const { data: trendingProducts } = useQuery({
    queryKey: ['trending-products'],
    queryFn: () => farmersAPI.getTrendingProducts().then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['discover-categories'],
    queryFn: () => farmersAPI.getDiscoverCategories().then(r => r.data),
  })

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => farmersAPI.getRegions().then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Discover</h1>
        <p className="text-gray-600">Explore unique agricultural products from across Northeast India</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input aria-label="Text"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, regions, or categories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select aria-label="Select an option"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select aria-label="Select an option"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Regions</option>
              {regions?.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts?.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <span className="text-6xl">{product.icon}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Featured
                  </span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm text-gray-600">{product.rating}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{product.origin}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">₹{product.price}</span>
                  <button className="text-red-500 hover:text-red-600">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Products */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
          Trending Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingProducts?.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="text-4xl mr-3">{product.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{product.trend}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {product.origin}
                </div>
                <div className="flex items-center text-gray-600">
                  <Eye className="w-4 h-4 mr-1" />
                  {product.views}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories?.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition cursor-pointer"
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <h3 className="font-medium text-gray-800 text-sm">{category.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{category.count} products</p>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Specialties */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Regional Specialties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regions?.map((region) => (
            <div key={region.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-white" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">{region.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{region.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{region.product_count} specialties</span>
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                    Explore →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DiscoverPage