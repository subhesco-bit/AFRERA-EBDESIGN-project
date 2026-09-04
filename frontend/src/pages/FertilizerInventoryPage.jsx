import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fertilizerAPI } from '../services/api';
import { Package, Plus, X, Trash2, Edit, AlertTriangle, PackageMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

const CATEGORIES = ['Urea', 'DAP', 'MOP', 'NPK Complex', 'Organic/Compost', 'Micronutrient', 'Bio-fertilizer'];
const UNITS = ['kg', 'bag (50kg)', 'litre', 'tonne'];

const emptyItem = { name: '', category: 'Urea', unit: 'bag (50kg)', quantity: '', reorder_level: '', unit_price: '' };

function FertilizerInventoryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [issueTarget, setIssueTarget] = useState(null);
  const [issueForm, setIssueForm] = useState({ quantity: '', issued_to: '', purpose: '' });

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['fertilizer-inventory'],
    queryFn: async () => (await fertilizerAPI.getInventory()).data?.data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? fertilizerAPI.updateInventoryItem(editingId, payload) : fertilizerAPI.createInventoryItem(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Item updated' : 'Item added to inventory');
      queryClient.invalidateQueries({ queryKey: ['fertilizer-inventory'] });
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save item'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fertilizerAPI.deleteInventoryItem(id),
    onSuccess: () => { toast.success('Item removed'); queryClient.invalidateQueries({ queryKey: ['fertilizer-inventory'] }); },
    onError: () => toast.error('Failed to remove item'),
  });

  const issueMutation = useMutation({
    mutationFn: ({ id, payload }) => fertilizerAPI.issueStock(id, payload),
    onSuccess: () => {
      toast.success('Stock issued');
      queryClient.invalidateQueries({ queryKey: ['fertilizer-inventory'] });
      setIssueTarget(null);
      setIssueForm({ quantity: '', issued_to: '', purpose: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to issue stock'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyItem); };

  const openEdit = (i) => {
    setForm({
      name: i.name || '', category: i.category || 'Urea', unit: i.unit || 'bag (50kg)',
      quantity: i.quantity ?? '', reorder_level: i.reorder_level ?? '', unit_price: i.unit_price ?? '',
    });
    setEditingId(i.id);
    setShowForm(true);
  };

  const items = data || [];
  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.reorder_level ?? 0));
  const totalValue = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Package className="w-6 h-6 mr-2 text-amber-600" />
            Fertilizer Inventory
          </h1>
          <p className="text-gray-600">Track fertilizer stock levels, reorder points and issues to fields</p>
        </div>
        <button onClick={() => { setForm(emptyItem); setEditingId(null); setShowForm(true); }}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />Add Stock Item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Stock items</div>
          <div className="text-2xl font-bold text-gray-800">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Low stock alerts</div>
          <div className="text-2xl font-bold text-red-600 flex items-center">{lowStock.length > 0 && <AlertTriangle className="w-5 h-5 mr-1" />}{lowStock.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Inventory value (₹)</div>
          <div className="text-2xl font-bold text-gray-800">{totalValue.toFixed(0)}</div>
        </div>
      </div>

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading inventory: {error.message}. Backend endpoint /fertilizer/inventory has not been built yet — this page is wired and ready once it is.
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No stock items yet.</td></tr>}
              {items.map((i) => {
                const low = Number(i.quantity) <= Number(i.reorder_level ?? 0);
                return (
                  <tr key={i.id} className={`hover:bg-gray-50 ${low ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">{i.category}</span></td>
                    <td className="px-4 py-3 text-gray-700">{i.quantity} {i.unit}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {i.reorder_level ?? '—'} {low && <span className="text-red-600 text-xs ml-1">Low</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">₹{i.unit_price ?? '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setIssueTarget(i)} className="p-2 text-amber-600 hover:bg-amber-50 rounded" title="Issue stock"><PackageMinus className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(i)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Remove this item?')) deleteMutation.mutate(i.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Stock Item' : 'Add Stock Item'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.name || form.quantity === '') { toast.error('Name and quantity are required'); return; }
                  saveMutation.mutate({
                    ...form,
                    quantity: Number(form.quantity),
                    reorder_level: form.reorder_level === '' ? null : Number(form.reorder_level),
                    unit_price: form.unit_price === '' ? null : Number(form.unit_price),
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Item name *</label>
                  <input id="classname-w-full-px-3-py-2-border-border" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select id="classname-w-full-px-3-py-2-border-border-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select id="classname-w-full-px-3-py-2-border-border-3" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input id="classname-w-full-px-3-py-2-border-border-4" type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Reorder level</label>
                    <input id="classname-w-full-px-3-py-2-border-border-5" type="number" step="0.01" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Unit price (₹)</label>
                    <input id="classname-w-full-px-3-py-2-border-border-6" type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {issueTarget && (
        <Modal onClose={() => setIssueTarget(null)}>
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Issue Stock — {issueTarget.name}</h2>
                <button onClick={() => setIssueTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!issueForm.quantity) { toast.error('Quantity is required'); return; }
                  issueMutation.mutate({ id: issueTarget.id, payload: { ...issueForm, quantity: Number(issueForm.quantity) } });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-7" className="block text-sm font-medium text-gray-700 mb-1">Quantity to issue *</label>
                  <input id="classname-w-full-px-3-py-2-border-border-7" type="number" step="0.01" value={issueForm.quantity} onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-8" className="block text-sm font-medium text-gray-700 mb-1">Issued to</label>
                  <input id="classname-w-full-px-3-py-2-border-border-8" value={issueForm.issued_to} onChange={(e) => setIssueForm({ ...issueForm, issued_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" placeholder="Farmer / field name" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-9" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input id="classname-w-full-px-3-py-2-border-border-9" value={issueForm.purpose} onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIssueTarget(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={issueMutation.isPending} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-60">
                    {issueMutation.isPending ? 'Issuing...' : 'Issue Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default FertilizerInventoryPage;
