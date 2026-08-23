import { useState, useEffect, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { productsAPI } from '../services/api'
import { Filter, ShoppingCart, Star } from 'lucide-react'
import { ordersAPI } from '../services/api'
import toast from 'react-hot-toast'

function MarketplacePage() {
  const [filters, setFilters] = useState({
    category_id: '',
    state_id: '',
    gi_status: '',
    search: '',
    sort: '',
  })
  const [searchInput, setSearchInput] = useState('')
  const searchDebounce = useRef(null)
  const [addingMap, setAddingMap] = useState({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
  })

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters, pagination],
    queryFn: async () => {
      const res = await productsAPI.getProducts(filters, pagination)
      return res.data || res
    },
    placeholderData: keepPreviousData,
  })

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  // Debounced search: update local input immediately, propagate after delay
  const handleSearchInput = (e) => {
    const v = e.target.value
    setSearchInput(v)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: v }))
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 450)
  }

  useEffect(() => {
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">Error loading products: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={handleSearchInput}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Categories</option>
                <option value="1">Grains & Millets</option>
                <option value="2">Spices</option>
                <option value="3">Fruits</option>
                <option value="4">Vegetables</option>
                <option value="5">Tea & Beverages</option>
                <option value="6">Honey</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                value={filters.state_id}
                onChange={(e) => handleFilterChange('state_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All States</option>
                <option value="1">Assam</option>
                <option value="2">Nagaland</option>
                <option value="3">Manipur</option>
                <option value="4">Meghalaya</option>
                <option value="5">Arunachal Pradesh</option>
                <option value="6">Mizoram</option>
                <option value="7">Tripura</option>
                <option value="8">Sikkim</option>
              </select>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
              <select
                value={filters.sort}
                onChange={(e) => { handleFilterChange('sort', e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Relevance</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating_desc">Rating</option>
              </select>
            </div>

            {/* GI Status Filter */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.gi_status === 'true'}
                  onChange={(e) =>
                    handleFilterChange('gi_status', e.target.checked ? 'true' : '')
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">GI Certified Only</span>
              </label>
            </div>

            <button
              onClick={() => setFilters({ category_id: '', state_id: '', gi_status: '', search: '' })}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
            <p className="text-gray-600">
              Showing {data?.products?.length || 0} of {data?.pagination?.total || 0} products
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.products?.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  {product.gi_status && (
                    <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      GI
                    </span>
                  )}
                  {product.organic && (
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      Organic
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {product.category_name} • {product.state_name}
                  </p>
                  <div className="flex items-center mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-800">₹{product.base_price}</span>
                      <span className="text-sm text-gray-500">/{product.unit_symbol}</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (addingMap[product.id]) return
                        setAddingMap((m) => ({ ...m, [product.id]: true }))
                        // optimistic UX: mark as added
                        try {
                          await ordersAPI.addToCart({ product_id: product.id, quantity: 1 })
                          toast.success('Added to cart')
                        } catch (err) {
                          toast.error('Failed to add to cart')
                        } finally {
                          setAddingMap((m) => ({ ...m, [product.id]: false }))
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                      disabled={!!addingMap[product.id]}
                    >
                      {addingMap[product.id] ? 'Adding...' : <ShoppingCart className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(data.pagination.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === data.pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketplacePage
