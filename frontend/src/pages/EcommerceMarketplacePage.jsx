import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Plus, X, Star, TrendingUp, Award, Search, Edit, Trash2, Leaf, ShieldCheck } from 'lucide-react'
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
          <h1 className="text-2xl font-bold text-v42-ink mb-2 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-v42-forest" />
            Marketplace
          </h1>
          <p className="text-v42-mut">Browse listings, manage your products, and track market intelligence.</p>
        </div>
        {tab === 'my-listings' && (
          <button onClick={() => { setForm(emptyListing); setEditingId(null); setShowForm(true) }}
            className="px-4 py-2 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition flex items-center">
            <Plus className="w-4 h-4 mr-2" />New Listing
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-v42-line overflow-x-auto">
        {[['browse', 'Browse'], ['gi', 'GI Marketplace'], ['my-listings', 'My Listings'], ['analytics', 'Seller Analytics'], ['market', 'Market Intelligence']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-v42-forest text-v42-forestd' : 'border-transparent text-v42-mut hover:text-v42-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-v42-mut w-4 h-4" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings..."
                className="w-full pl-9 pr-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
            </div>
            <label className="flex items-center text-sm text-v42-ink2">
              <input type="checkbox" checked={giTagged} onChange={(e) => setGiTagged(e.target.checked)} className="mr-2" />GI Tagged
            </label>
            <label className="flex items-center text-sm text-v42-ink2">
              <input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} className="mr-2" />Organic
            </label>
          </div>
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-v42-paddy2 rounded-lg" />)}
            </div>
          )}
          {error && <div className="bg-v42-chilli/10 border border-v42-chilli/30 text-v42-chilli rounded-lg p-4">Error loading listings: {error.message}</div>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listings.length === 0 && <div className="col-span-full text-center py-10 text-v42-mut">No listings found.</div>}
              {listings.map((l) => (
                <div key={l.id} className="bg-v42-paddy border border-v42-line rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                  <div className="relative">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt={l.product_name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-v42-paddy2 flex items-center justify-center text-v42-mut text-sm">No image</div>
                    )}
                    {l.gi_tagged && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-v42-turmeric text-v42-forestd text-xs font-medium px-2 py-1 rounded">
                        <Award className="w-3 h-3" />GI Tagged
                      </span>
                    )}
                    {l.organic && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-v42-forest text-v42-paddy text-xs font-medium px-2 py-1 rounded">
                        <Leaf className="w-3 h-3" />Organic
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-v42-ink line-clamp-1">{l.product_name}</div>
                    <div className="text-sm text-v42-mut mb-1">{l.quantity} {l.unit_symbol || l.unit} available</div>
                    {l.seller_name && (
                      <div className="text-xs text-v42-mut mb-2">Sold by {l.seller_name}{l.city ? ` · ${l.city}` : ''}</div>
                    )}
                    {Number(l.review_count) > 0 && (
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 text-v42-turmeric fill-current" />
                        <span className="text-sm text-v42-mut ml-1">{Number(l.avg_rating).toFixed(1)} ({l.review_count})</span>
                      </div>
                    )}
                    <div className="text-lg font-bold text-v42-forestd mt-1">₹{l.base_price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'gi' && (
        <>
          {giLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-v42-paddy2 rounded-lg" />)}
            </div>
          )}
          {giError && <div className="bg-v42-chilli/10 border border-v42-chilli/30 text-v42-chilli rounded-lg p-4">Error: {giError.message}</div>}
          {!giLoading && !giError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(giListings || []).length === 0 && <div className="col-span-full text-center py-10 text-v42-mut">No GI listings yet.</div>}
              {(giListings || []).map((l) => (
                <div key={l.id} className="bg-v42-paddy rounded-lg shadow p-4 border border-v42-turmeric/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center text-v42-turmericink text-xs font-medium">
                      <Award className="w-4 h-4 mr-1" />{l.gi_name ? `GI Certified · ${l.gi_name}` : 'GI Certified'}
                    </div>
                    {l.authenticity_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-v42-forestd">
                        <ShieldCheck className="w-3.5 h-3.5" />Verified
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-v42-ink">{l.listing_title}</div>
                  {l.geographical_region && <div className="text-xs text-v42-mut mb-1">{l.geographical_region}{l.state ? `, ${l.state}` : ''}</div>}
                  {l.seller_name && <div className="text-xs text-v42-mut">Sold by {l.seller_name}</div>}
                  <div className="text-lg font-bold text-v42-forestd mt-2">
                    ₹{l.price_per_unit}<span className="text-sm font-normal text-v42-mut">/{l.unit}</span>
                  </div>
                  {Number(l.premium_percentage) > 0 && (
                    <div className="text-xs text-v42-turmericink mt-1">+{l.premium_percentage}% GI premium over base market price</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'my-listings' && (
        <>
          {sellerLoading && <div className="animate-pulse h-40 bg-v42-paddy2 rounded-lg" />}
          {sellerError && <div className="bg-v42-chilli/10 border border-v42-chilli/30 text-v42-chilli rounded-lg p-4">Error: {sellerError.message}. This tab requires being signed in as a seller.</div>}
          {!sellerLoading && !sellerError && (
            <div className="bg-v42-paddy border border-v42-line rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-v42-line">
                <thead className="bg-v42-paddy2">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-v42-mut uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-v42-mut uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-v42-mut uppercase">Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-v42-mut uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-v42-line">
                  {(sellerListings || []).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-v42-mut">
                      No listings yet. Use "New Listing" above to put your first product on the marketplace.
                    </td></tr>
                  )}
                  {(sellerListings || []).map((l) => (
                    <tr key={l.id} className="hover:bg-v42-paddy2">
                      <td className="px-4 py-3 font-medium text-v42-ink">{l.product_name}</td>
                      <td className="px-4 py-3 text-v42-ink2">₹{l.base_price}</td>
                      <td className="px-4 py-3 text-v42-ink2">{l.total_quantity_sold || 0}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(l)} className="p-2 text-v42-indigo hover:bg-v42-indigo/10 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Remove this listing?')) deleteMutation.mutate(l.id) }} className="p-2 text-v42-chilli hover:bg-v42-chilli/10 rounded"><Trash2 className="w-4 h-4" /></button>
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
          {analyticsLoading && <div className="animate-pulse h-40 bg-v42-paddy2 rounded-lg" />}
          {analyticsError && <div className="bg-v42-chilli/10 border border-v42-chilli/30 text-v42-chilli rounded-lg p-4">Error: {analyticsError.message}. Requires being signed in as a seller.</div>}
          {!analyticsLoading && !analyticsError && analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-4">
                  <div className="text-sm text-v42-mut flex items-center"><TrendingUp className="w-4 h-4 mr-1" />Total Listings</div>
                  <div className="text-2xl font-bold text-v42-ink">{analytics.listings?.total_listings ?? '—'}</div>
                </div>
                <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-4">
                  <div className="text-sm text-v42-mut">Revenue ({analytics.period})</div>
                  <div className="text-2xl font-bold text-v42-ink">₹{Number(analytics.sales?.total_revenue || 0).toLocaleString()}</div>
                </div>
                <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-4">
                  <div className="text-sm text-v42-mut flex items-center"><Star className="w-4 h-4 mr-1" />Top Products</div>
                  <div className="text-2xl font-bold text-v42-ink">{analytics.top_products?.length ?? 0}</div>
                </div>
              </div>
              {analytics.top_products?.length > 0 && (
                <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-4">
                  <h3 className="font-semibold text-v42-ink mb-3">Top Selling Products</h3>
                  <div className="space-y-2">
                    {analytics.top_products.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm border-b border-v42-line pb-2">
                        <span className="text-v42-ink2">{p.product_name}</span>
                        <span className="font-medium text-v42-ink">₹{Number(p.total_revenue || 0).toLocaleString()}</span>
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
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
          <h3 className="font-semibold text-v42-ink mb-3">Category Price Trends</h3>
          <div className="flex gap-2 mb-4">
            <input value={priceTrendCategory} onChange={(e) => setPriceTrendCategory(e.target.value)} placeholder="Category ID"
              className="px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
            <button onClick={() => priceTrendCategory && fetchTrends()} disabled={!priceTrendCategory || trendsLoading}
              className="px-4 py-2 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition disabled:opacity-50">
              {trendsLoading ? 'Loading...' : 'View Trends'}
            </button>
          </div>
          {priceTrends && priceTrends.length > 0 && (
            <div className="space-y-1">
              {priceTrends.map((t, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-v42-line py-1">
                  <span className="text-v42-mut">{t.date?.slice(0, 10)}</span>
                  <span className="font-medium text-v42-ink">avg ₹{Number(t.avg_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {priceTrends && priceTrends.length === 0 && <div className="text-v42-mut text-sm">No price data for this category yet.</div>}
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-v42-paddy rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-v42-ink">{editingId ? 'Edit Listing' : 'New Listing'}</h2>
                <button onClick={closeForm} className="text-v42-mut hover:text-v42-ink"><X className="w-5 h-5" /></button>
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
                  <label className="block text-sm font-medium text-v42-ink2 mb-1">Product name *</label>
                  <input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                    className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-v42-ink2 mb-1">Category ID *</label>
                    <input value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-v42-ink2 mb-1">Base price *</label>
                    <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                      className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-v42-ink2 mb-1">Quantity *</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-v42-ink2 mb-1">Unit *</label>
                    <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, quintal..."
                      className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-v42-ink2 mb-1">Harvest date *</label>
                  <input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-v42-ink2 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric" rows="3" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-v42-line text-v42-ink2 rounded-lg hover:bg-v42-paddy2 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-v42-forest text-v42-paddy rounded-lg hover:bg-v42-forestd transition disabled:opacity-60">
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
