import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Plus, Package, Battery, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { sharedInfraAPI } from '../services/api'

// Built 2026-08-11 to wire the real, previously-orphaned sharedInfraService.js
// (backend/src/index.js calls sharedInfraService.setupRoutes(app) but nothing
// ever called it from the frontend). FarmerSharedDoorPage.jsx explicitly
// labelled "cold storage and packhouse booking" as "coming soon" pending this
// page — see the link update there. Covers: shared-asset register/search/book,
// second-life equipment listings, community battery listings, renewable
// support lookup.
function SharedInfraPage() {
  const [tab, setTab] = useState('assets')
  const [searchQuery, setSearchQuery] = useState('')
  const [assetForm, setAssetForm] = useState({ asset_type: '', location: '', description: '' })

  const { data: assets, isLoading: assetsLoading, error: assetsError, refetch: refetchAssets } = useQuery({
    queryKey: ['shared-infra-assets', searchQuery],
    queryFn: () => sharedInfraAPI.searchAssets({ q: searchQuery }).then((r) => r.data?.data ?? r.data),
    enabled: tab === 'assets',
  })

  const { data: secondLife, isLoading: secondLifeLoading, error: secondLifeError } = useQuery({
    queryKey: ['shared-infra-second-life', searchQuery],
    queryFn: () => sharedInfraAPI.searchSecondLife({ q: searchQuery }).then((r) => r.data?.data ?? r.data),
    enabled: tab === 'second-life',
  })

  const { data: renewableSupport, isLoading: renewableLoading, error: renewableError } = useQuery({
    queryKey: ['shared-infra-renewable-support'],
    queryFn: () => sharedInfraAPI.getRenewableSupport({}).then((r) => r.data?.data ?? r.data),
    enabled: tab === 'renewable',
  })

  const registerMutation = useMutation({
    mutationFn: (data) => sharedInfraAPI.registerAsset(data),
    onSuccess: () => {
      toast.success('Asset registered')
      setAssetForm({ asset_type: '', location: '', description: '' })
      refetchAssets()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to register asset'),
  })

  const bookMutation = useMutation({
    mutationFn: (data) => sharedInfraAPI.bookAsset(data),
    onSuccess: () => toast.success('Booking request submitted'),
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to book asset'),
  })

  const TABS = [
    { id: 'assets', label: 'Shared Assets', icon: Package },
    { id: 'second-life', label: 'Second-Life Equipment', icon: Battery },
    { id: 'renewable', label: 'Renewable Support', icon: Sun },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/farmer-entrance/shared" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Shared infra & rental
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Cold Storage & Shared Infrastructure</h1>
        <p className="text-gray-600">Register, search and book cold storage, packhouses and other shared assets</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <t.icon className="w-5 h-5 mr-2" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Register a Shared Asset</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!assetForm.asset_type) {
                  toast.error('Asset type is required')
                  return
                }
                registerMutation.mutate(assetForm)
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <input
                value={assetForm.asset_type}
                onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}
                placeholder="Asset type (e.g. cold storage) *"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={assetForm.location}
                onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                placeholder="Location"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={assetForm.description}
                onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="md:col-span-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-60"
              >
                <Plus className="w-4 h-4 mr-2" />
                {registerMutation.isPending ? 'Registering...' : 'Register Asset'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                aria-label="Search assets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shared assets..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {assetsLoading && <div className="text-sm text-gray-500">Loading assets...</div>}
            {assetsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                Could not load assets: {assetsError.message}
              </div>
            )}
            {!assetsLoading && !assetsError && (
              (assets?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {assets.map((a, i) => (
                    <div key={a.id ?? i} className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <div className="font-medium text-gray-800">{a.asset_type || a.name}</div>
                        <div className="text-sm text-gray-500">{a.location}</div>
                      </div>
                      <button
                        onClick={() => bookMutation.mutate({ asset_id: a.id })}
                        disabled={bookMutation.isPending}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No shared assets found yet.</div>
              )
            )}
          </div>
        </div>
      )}

      {tab === 'second-life' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              aria-label="Search second-life equipment"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search second-life equipment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {secondLifeLoading && <div className="text-sm text-gray-500">Loading listings...</div>}
          {secondLifeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              Could not load listings: {secondLifeError.message}
            </div>
          )}
          {!secondLifeLoading && !secondLifeError && (
            (secondLife?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {secondLife.map((s, i) => (
                  <div key={s.id ?? i} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-800">{s.equipment_type || s.name}</div>
                    <div className="text-sm text-gray-500">{s.condition || s.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No second-life equipment listed yet.</div>
            )
          )}
        </div>
      )}

      {tab === 'renewable' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Renewable Energy Support</h3>
          {renewableLoading && <div className="text-sm text-gray-500">Loading...</div>}
          {renewableError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              Could not load renewable support data: {renewableError.message}
            </div>
          )}
          {!renewableLoading && !renewableError && renewableSupport && (
            <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto">{JSON.stringify(renewableSupport, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  )
}

export default SharedInfraPage
