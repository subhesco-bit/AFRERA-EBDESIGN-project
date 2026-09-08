import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seedVaultAPI } from '../services/api';
import { Package, Search, Plus, Edit, Trash2, Thermometer, Droplets, Sprout, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

function SeedVaultPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [newSeed, setNewSeed] = useState({
    name: '', variety: '', category: '', quantity: '', unit: 'kg',
    purchaseDate: '', minStock: '', supplier: '',
  });
  const queryClient = useQueryClient();

  const { data: seeds } = useQuery({
    queryKey: ['seed-vault'],
    queryFn: async () => (await seedVaultAPI.getSeeds()).data.data,
  });

  const { data: categories } = useQuery({
    queryKey: ['seed-categories'],
    queryFn: async () => (await seedVaultAPI.getCategories()).data.data,
  });

  const addSeedMutation = useMutation({
    mutationFn: (data) => seedVaultAPI.addSeed(data),
    onSuccess: () => {
      toast.success('Seed added to vault');
      queryClient.invalidateQueries({ queryKey: ['seed-vault'] });
      queryClient.invalidateQueries({ queryKey: ['seed-categories'] });
      setShowAddModal(false);
      setNewSeed({ name: '', variety: '', category: '', quantity: '', unit: 'kg', purchaseDate: '', minStock: '', supplier: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add seed');
    },
  });

  const deleteSeedMutation = useMutation({
    mutationFn: (seedId) => seedVaultAPI.deleteSeed(seedId),
    onSuccess: () => {
      toast.success('Seed removed from vault');
      queryClient.invalidateQueries({ queryKey: ['seed-vault'] });
    },
    onError: () => {
      toast.error('Failed to remove seed');
    },
  });

  const handleAddSeedSubmit = (e) => {
    e.preventDefault();
    if (!newSeed.name || !newSeed.category || newSeed.quantity === '') {
      toast.error('Seed name, category, and quantity are required');
      return;
    }
    addSeedMutation.mutate(newSeed);
  };

  const filteredSeeds = seeds?.filter(seed =>
    seed.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'all' || seed.category === selectedCategory),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Seed Vault</h1>
          <p className="text-gray-600">Manage your seed inventory and track seed quality</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Seeds
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input aria-label="Text"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search seeds..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === 'all' ?
                  'bg-green-600 text-white' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === cat.id ?
                    'bg-green-600 text-white' :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seed Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSeeds?.map((seed) => (
          <div
            key={seed.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              // Enter and Space are what a native <button> responds to.
              // Without this the card is unreachable by keyboard entirely.
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
            }}
            className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
            onClick={() => setSelectedSeed(seed)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Sprout className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{seed.name}</h3>
                    <div className="text-sm text-gray-500">{seed.variety}</div>
                  </div>
                </div>
                {seed.quantity <= seed.min_stock && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium text-gray-800">{seed.quantity} {seed.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-800">{seed.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Purchased</span>
                  <span className="font-medium text-gray-800">{seed.purchase_date}</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Stock Level</span>
                  <span className={`text-xs font-medium ${
                    seed.quantity > seed.min_stock * 2 ? 'text-green-600' :
                      seed.quantity > seed.min_stock ? 'text-yellow-600' :
                        'text-red-600'
                  }`}>
                    {seed.quantity > seed.min_stock * 2 ? 'Good' :
                      seed.quantity > seed.min_stock ? 'Low' :
                        'Critical'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      seed.quantity > seed.min_stock * 2 ? 'bg-green-600' :
                        seed.quantity > seed.min_stock ? 'bg-yellow-600' :
                          'bg-red-600'
                    }`}
                    style={{ width: `${Math.min((seed.quantity / (seed.min_stock * 3)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Edit logic
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to remove this seed?')) {
                      deleteSeedMutation.mutate(seed.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )) || (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Seeds in Vault</h3>
            <p className="text-gray-600 mb-4">Start by adding your seed inventory</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Add Your First Seeds
            </button>
          </div>
        )}
      </div>

      {/* Add Seed Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add Seeds to Vault</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleAddSeedSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="seed-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Seed Name *
                    </label>
                    <input id="seed-name"
                      type="text"
                      value={newSeed.name}
                      onChange={(e) => setNewSeed({ ...newSeed, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Rice, Wheat"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="variety" className="block text-sm font-medium text-gray-700 mb-1">
                      Variety
                    </label>
                    <input id="variety"
                      type="text"
                      value={newSeed.variety}
                      onChange={(e) => setNewSeed({ ...newSeed, variety: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Basmati, Sharbati"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input id="category"
                    type="text"
                    list="seed-category-options"
                    value={newSeed.category}
                    onChange={(e) => setNewSeed({ ...newSeed, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Cereal, Pulse, Vegetable"
                    required
                  />
                  <datalist id="seed-category-options">
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input id="quantity"
                      type="number"
                      min="0"
                      value={newSeed.quantity}
                      onChange={(e) => setNewSeed({ ...newSeed, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select id="unit"
                      value={newSeed.unit}
                      onChange={(e) => setNewSeed({ ...newSeed, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="kg">Kg</option>
                      <option value="g">Grams</option>
                      <option value="quintal">Quintal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="purchase-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input id="purchase-date"
                      type="date"
                      value={newSeed.purchaseDate}
                      onChange={(e) => setNewSeed({ ...newSeed, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="min-stock-alert" className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Alert
                    </label>
                    <input id="min-stock-alert"
                      type="number"
                      min="0"
                      value={newSeed.minStock}
                      onChange={(e) => setNewSeed({ ...newSeed, minStock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Alert when below"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input id="supplier"
                    type="text"
                    value={newSeed.supplier}
                    onChange={(e) => setNewSeed({ ...newSeed, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Supplier name"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addSeedMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {addSeedMutation.isPending ? 'Adding...' : 'Add Seeds'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Seed Detail Modal */}
      {selectedSeed && (
        <Modal onClose={() => setSelectedSeed(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{selectedSeed.name}</h2>
                <button
                  onClick={() => setSelectedSeed(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Variety</div>
                    <div className="font-semibold text-gray-800">{selectedSeed.variety || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Category</div>
                    <div className="font-semibold text-gray-800">{selectedSeed.category}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Quantity</div>
                    <div className="font-semibold text-gray-800">{selectedSeed.quantity} {selectedSeed.unit}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Purchase Date</div>
                    <div className="font-semibold text-gray-800">{selectedSeed.purchase_date}</div>
                  </div>
                </div>

                {selectedSeed.storage_conditions && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Storage Conditions</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center">
                        <Thermometer className="w-4 h-4 mr-1 text-red-600" />
                        <span>{selectedSeed.storage_conditions.temp}</span>
                      </div>
                      <div className="flex items-center">
                        <Droplets className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{selectedSeed.storage_conditions.humidity}</span>
                      </div>
                      <div className="flex items-center">
                        <Sprout className="w-4 h-4 mr-1 text-green-600" />
                        <span>{selectedSeed.storage_conditions.light}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                    Edit Details
                  </button>
                  <button className="flex-1 px-4 py-2 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition">
                    Record Usage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SeedVaultPage;
