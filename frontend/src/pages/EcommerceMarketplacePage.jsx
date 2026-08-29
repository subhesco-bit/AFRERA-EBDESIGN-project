import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Plus, X, Star, TrendingUp, Award, Search, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ecommerceAPI } from '../services/api'
import Modal from '../components/common/Modal'

const emptyListing = {
  product_name: '', category_id: '', quantity: '', unit: '', base_price: '', harvest_date: '', description: '',
}

// Seller actions (create/edit/delete listing, analytics, my-listings) need
// req.user.id on the backend (authMiddleware). No global auth/session
// store exists yet in this codebase's frontend for pages built outside
// the login flow (checked - same gap noted on BulkOrderPage.jsx), so the
// seller id is entered manually here until real auth wiring exists.
function EcommerceMarketplacePage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('browse')
  const [search, setSearch] = useState('')
  const [giTagged, setGiTagged] = useState(false)
  const [organic, setOrganic] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyListing)
  const [priceTrendCategory, setPriceTrendCategory] = useState('')

  const { data: listingsData, isLoading, error } = useQuery({
    queryKey: ['ecommerce-listings', search, giTagged, organic],
    queryFn: async () => (await ecommerceAPI.getListings({ search: search || undefined, gi_tagged: giTagged || undefined, organic: organic || undefined }, {})).data?.products ?? [],
    enabled: tab === 'browse',
  })

  const { data: giListings, isLoading: giLoading, error: giError } = useQuery({
    queryKey: ['ecommerce-gi-listings'],
    queryFn: async () => (await ecommerceAPI.getGIListings({})).data?.listings ?? [],
    enabled: tab === 'gi',
  })

  const { data: sellerListings, isLoading: sellerLoading, error: sellerError } = useQuery({
    queryKey: ['ecommerce-seller-listings'],
    queryFn: async () => (await ecommerceAPI.getSellerListings()).data?.listings ?? [],
    enabled: tab === 'my-listings',
  })

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['ecommerce-seller-analytics'],
    queryFn: async () => (await ecommerceAPI.getSellerAnalytics('30d')).data ?? null,
    enabled: tab === 'analytics',
  })

  const { data: priceTrends, refetch: fetchTrends, isFetching: trendsLoading } = useQuery({
    queryKey: ['ecommerce-price-trends', priceTrendCategory],
    queryFn: async () => (await ecommerceAPI.getPriceTrends(priceTrendCategory, '30d')).data?.trends ?? [],
    enabled: false,
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? ecommerceAPI.updateListing(editingId, payload) : ecommerceAPI.createListing(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Listing updated' : 'Listing created')
      queryClient.invalidateQueries({ queryKey: ['ecommerce-seller-listings'] })
      queryClient.invalidateQueries({ queryKey: ['ecommerce-listings'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save listing'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => ecommerceAPI.deleteListing(id),
    onSuccess: () => {
      toast.success('Listing removed')
      queryClient.invalidateQueries({ queryKey: ['ecommerce-seller-listings'] })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to remove listing'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyListing) }

  const openEdit = (l) => {
    setForm({
      product_name: l.product_name || '', category_id: l.category_id || '', quantity: l.quantity || '',
      unit: l.unit || '', base_price: l.base_price || '', harvest_date: l.harvest_date?.slice(0, 10) || '', description: l.description || '',
    })
    setEditingId(l.id)
    setShowForm(true)
  }

  const listings = listingsData || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-emerald-600" />
            Marketplace
          </h1>
          <p className="text-gray-600">Browse listings, manage your products, and track market intelligence.</p>
        </div>
        {tab === 'my-listings' && (
          <button onClick={() => { setForm(emptyListing); setEditingId(null); setShowForm(true) }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center">
            <Plus className="w-4 h-4 mr-2" />New Listing
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {[['browse', 'Browse'], ['gi', 'GI Marketplace'], ['my-listings', 'My Listings'], ['analytics', 'Seller Analytics'], ['market', 'Market Intelligence']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <label className="flex items-center text-sm text-gray-700">
              <input type="checkbox" checked={giTagged} onChange={(e) => setGiTagged(e.target.checked)} className="mr-2" />GI Tagged
            </label>
            <label className="flex items-center text-sm text-gray-700">
              <input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} className="mr-2" />Organic
            </label>
          </div>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error loading listings: {error.message}</div>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listings.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">No listings found.</div>}
              {listings.map((l) => (
                <div key={l.id} className="bg-white rounded-lg shadow p-4">
                  <div className="font-semibold text-gray-800">{l.product_name}</div>
                  <div className="text-sm text-gray-500">{l.quantity} {l.unit} available</div>
                  <div className="text-lg font-bold text-emerald-700 mt-2">₹{l.base_price}</div>
                  {l.gi_tagged && <span className="inline-flex items-center text-xs text-amber-700 mt-1"><Award className="w-3 h-3 mr-1" />GI Tagged</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'gi' && (
        <>
          {giLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {giError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error: {giError.message}</div>}
          {!giLoading && !giError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(giListings || []).length === 0 && <div className="col-span-full text-center py-10 text-gray-500">No GI listings yet.</div>}
              {(giListings || []).map((l) => (
                <div key={l.id} className="bg-white rounded-lg shadow p-4 border border-amber-200">
                  <div className="flex items-center text-amber-700 text-xs font-medium mb-1"><Award className="w-4 h-4 mr-1" />GI Certified</div>
                  <div className="font-semibold text-gray-800">{l.product_name}</div>
                  <div className="text-lg font-bold text-emerald-700 mt-2">₹{l.base_price}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'my-listings' && (
        <>
          {sellerLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {sellerError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error: {sellerError.message}. This tab requires being signed in as a seller.</div>}
          {!sellerLoading && !sellerError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(sellerListings || []).length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No listings yet.</td></tr>}
                  {(sellerListings || []).map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{l.product_name}</td>
                      <td className="px-4 py-3 text-gray-700">₹{l.base_price}</td>
                      <td className="px-4 py-3 text-gray-700">{l.total_quantity_sold || 0}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(l)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Remove this listing?')) deleteMutation.mutate(l.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'analytics' && (
        <>
          {analyticsLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {analyticsError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error: {analyticsError.message}. Requires being signed in as a seller.</div>}
          {!analyticsLoading && !analyticsError && analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500 flex items-center"><TrendingUp className="w-4 h-4 mr-1" />Total Listings</div>
                  <div className="text-2xl font-bold text-gray-800">{analytics.listings?.total_listings ?? '—'}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500">Revenue ({analytics.period})</div>
                  <div className="text-2xl font-bold text-gray-800">₹{Number(analytics.sales?.total_revenue || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500 flex items-center"><Star className="w-4 h-4 mr-1" />Top Products</div>
                  <div className="text-2xl font-bold text-gray-800">{analytics.top_products?.length ?? 0}</div>
                </div>
              </div>
              {analytics.top_products?.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Top Selling Products</h3>
                  <div className="space-y-2">
                    {analytics.top_products.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm border-b pb-2">
                        <span className="text-gray-700">{p.product_name}</span>
                        <span className="font-medium text-gray-800">₹{Number(p.total_revenue || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'market' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Category Price Trends</h3>
          <div className="flex gap-2 mb-4">
            <input value={priceTrendCategory} onChange={(e) => setPriceTrendCategory(e.target.value)} placeholder="Category ID"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            <button onClick={() => priceTrendCategory && fetchTrends()} disabled={!priceTrendCategory || trendsLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
              {trendsLoading ? 'Loading...' : 'View Trends'}
            </button>
          </div>
          {priceTrends && priceTrends.length > 0 && (
            <div className="space-y-1">
              {priceTrends.map((t, i) => (
                <div key={i} className="flex justify-between text-sm border-b py-1">
                  <span className="text-gray-600">{t.date?.slice(0, 10)}</span>
                  <span className="font-medium text-gray-800">avg ₹{Number(t.avg_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {priceTrends && priceTrends.length === 0 && <div className="text-gray-500 text-sm">No price data for this category yet.</div>}
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Listing' : 'New Listing'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.product_name || !form.category_id || !form.quantity || !form.unit || !form.base_price || !form.harvest_date) {
                    toast.error('All fields except description are required')
                    return
                  }
                  saveMutation.mutate(form)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
                  <input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category ID *</label>
                    <input value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base price *</label>
                    <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, quintal..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harvest date *</label>
                  <input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" rows="3" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default EcommerceMarketplacePage
