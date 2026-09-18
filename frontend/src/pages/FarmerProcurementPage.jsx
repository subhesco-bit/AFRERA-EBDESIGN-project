import { useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const categories = ['household', 'machine', 'seed', 'fertilizer', 'piping', 'drip', 'pump', 'repair', 'second_life'];
const errorText = (error) => error?.response?.data?.error || 'The procurement service is unavailable. Please try again.';

export default function FarmerProcurementPage() {
  const { user } = useAuthStore();
  const [buyer, setBuyer] = useState({ farmerId: '', destinationAddressId: '', category: 'household', quantity: '1', pooledQuantity: '' });
  const [supplier, setSupplier] = useState({ category: 'household', product_name: '', unit: 'piece', origin_state: '', served_states: '', list_price_per_unit: '', minimum_order_quantity: '1', available_quantity: '', freight_per_order: '', quoted_delivery_days: '', terms_source: '', effective_from: '', effective_to: '', bulk_tiers: '' });
  const [approvalId, setApprovalId] = useState('');
  const [quote, setQuote] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function compare(event) {
    event.preventDefault(); setBusy(true); setNotice(''); setQuote(null);
    try {
      const { data } = await api.post('/farmer-procurement/compare', {
        ...buyer, quantity: Number(buyer.quantity), pooledQuantity: buyer.pooledQuantity ? Number(buyer.pooledQuantity) : undefined,
      });
      setQuote(data.data);
    } catch (error) { setNotice(errorText(error)); }
    finally { setBusy(false); }
  }

  async function submitOffer(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const tiers = supplier.bulk_tiers.trim() ? supplier.bulk_tiers.split('\n').map(line => {
        const [min_quantity, price_per_unit] = line.split(',').map(Number);
        if (!(min_quantity > 0 && price_per_unit > 0)) throw new Error('Each bulk tier must contain a positive minimum quantity and unit price, separated by a comma.');
        return { min_quantity, price_per_unit };
      }) : [];
      const { data } = await api.post('/farmer-procurement/offers', {
        ...supplier, served_states: supplier.served_states.split(',').map(s => s.trim()).filter(Boolean), bulk_tiers: tiers,
        list_price_per_unit: Number(supplier.list_price_per_unit), minimum_order_quantity: Number(supplier.minimum_order_quantity),
        available_quantity: Number(supplier.available_quantity), freight_per_order: Number(supplier.freight_per_order),
        quoted_delivery_days: Number(supplier.quoted_delivery_days), effective_to: supplier.effective_to || null,
      });
      setNotice(`Draft ${data.data.id} saved. A separate administrator must approve its terms.`);
    } catch (error) { setNotice(error?.response ? errorText(error) : error.message); }
    finally { setBusy(false); }
  }

  async function approve(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const { data } = await api.post(`/farmer-procurement/offers/${encodeURIComponent(approvalId.trim())}/approve`);
      setNotice(`Offer ${data.data.id} approved with a named administrator.`);
    } catch (error) { setNotice(errorText(error)); }
    finally { setBusy(false); }
  }

  const field = (label, name, value, change, props = {}) => <label className="block text-sm font-medium text-slate-800" key={name}>
    {label}<input {...props} value={value} onChange={event => change(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
  </label>;
  const buyerField = (label, name, props) => field(label, name, buyer[name], value => setBuyer(old => ({ ...old, [name]: value })), props);
  const supplierField = (label, name, props) => field(label, name, supplier[name], value => setSupplier(old => ({ ...old, [name]: value })), props);

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-labelledby="procurement-title">
    <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">National farmer purchasing</p>
      <h1 id="procurement-title" className="mt-2 text-3xl font-bold sm:text-4xl">Buy across India, compare delivered cost</h1>
      <p className="mt-3 max-w-3xl text-slate-200">Farmers and verified family buyers can compare approved supplier offers from any state. Village and FPO pooling may lower quoted unit prices; freight, tax, subsidies, stock and final delivery must be confirmed before an order.</p>
    </header>
    {notice && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-950">{notice}</p>}
    <div className="mt-7 grid gap-7 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold">Farmer or family comparison</h2>
        <p className="mt-2 text-sm text-slate-600">Use your verified farmer ID and one of your saved delivery address IDs.</p>
        <form onSubmit={compare} className="mt-5 grid gap-4">
          {buyerField('Farmer ID', 'farmerId', { required: true })}
          {buyerField('Delivery address ID', 'destinationAddressId', { required: true })}
          <label className="text-sm font-medium">Product category<select value={buyer.category} onChange={event => setBuyer(old => ({ ...old, category: event.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-3">{categories.map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2">{buyerField('Your quantity', 'quantity', { type: 'number', min: '0.001', step: 'any', required: true })}{buyerField('Confirmed pool quantity, if any', 'pooledQuantity', { type: 'number', min: '0.001', step: 'any' })}</div>
          <button disabled={busy} className="min-h-11 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">Compare supplier offers</button>
        </form>
        {quote && <div className="mt-5" role="status">
          <p className="text-sm text-slate-600">Comparison record: {quote.quote_run_id}. No order has been placed. GST and subsidy are not included.</p>
          {!quote.recommendation && <p className="mt-3 rounded-lg bg-slate-100 p-3">No approved offer currently meets destination, stock, date and quantity conditions.</p>}
          <div className="mt-4 space-y-3">{quote.alternatives.map(item => <article key={item.offer_id} className="rounded-xl border p-4">
            <div className="flex justify-between gap-3"><strong>{item.origin_state} supplier</strong><span>{item.feasible ? 'Feasible quote' : 'Unavailable'}</span></div>
            <p className="mt-2">Goods ₹{item.goods_cost} + allocated freight ₹{item.freight_allocation} = <strong>₹{item.provisional_landed_cost_excluding_tax}</strong> before tax</p>
            <p className="mt-1 text-sm text-slate-600">Quoted delivery: {item.quoted_delivery_days} days · Terms: {item.terms_source}</p>
            {item.rejection_reasons.length > 0 && <p className="mt-1 text-sm text-red-700">{item.rejection_reasons.join(', ')}</p>}
          </article>)}</div>
        </div>}
      </section>
      {(user?.role === 'corporate' || user?.role === 'admin') && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold">Supplier quote publication</h2>
        <p className="mt-2 text-sm text-slate-600">Terms remain a draft until an independent administrator approves them.</p>
        <form onSubmit={submitOffer} className="mt-5 grid gap-4">
          <label className="text-sm font-medium">Category<select value={supplier.category} onChange={event => setSupplier(old => ({ ...old, category: event.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-3">{categories.map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label>
          {supplierField('Product name', 'product_name', { required: true })}{supplierField('Unit', 'unit', { required: true })}
          {supplierField('Origin state on your saved address', 'origin_state', { required: true })}
          {supplierField('States served, separated by commas', 'served_states', { required: true })}
          <div className="grid gap-4 sm:grid-cols-2">{supplierField('Unit list price (₹)', 'list_price_per_unit', { type: 'number', min: '0.01', step: 'any', required: true })}{supplierField('Minimum order quantity', 'minimum_order_quantity', { type: 'number', min: '0.001', step: 'any', required: true })}</div>
          <div className="grid gap-4 sm:grid-cols-2">{supplierField('Available quantity', 'available_quantity', { type: 'number', min: '0', step: 'any', required: true })}{supplierField('Freight per quoted order (₹)', 'freight_per_order', { type: 'number', min: '0', step: 'any', required: true })}</div>
          {supplierField('Quoted delivery days', 'quoted_delivery_days', { type: 'number', min: '0', step: '1', required: true })}
          {supplierField('Terms source / RFQ reference', 'terms_source', { required: true })}
          <div className="grid gap-4 sm:grid-cols-2">{supplierField('Effective from', 'effective_from', { type: 'date', required: true })}{supplierField('Effective to', 'effective_to', { type: 'date' })}</div>
          <label className="text-sm font-medium">Optional bulk tiers: one minimum quantity,unit price per line<textarea value={supplier.bulk_tiers} onChange={event => setSupplier(old => ({ ...old, bulk_tiers: event.target.value }))} rows={3} placeholder={'10,85\n50,79'} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
          <button disabled={busy} className="min-h-11 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">Save supplier draft</button>
        </form>
        {user?.role === 'admin' && <form onSubmit={approve} className="mt-7 border-t pt-5">
          <h3 className="font-semibold">Independent offer approval</h3><p className="mt-1 text-sm text-slate-600">The supplier cannot approve their own offer.</p>
          <div className="mt-3">{field('Draft offer ID', 'approvalId', approvalId, setApprovalId, { required: true })}</div>
          <button disabled={busy} className="mt-3 min-h-11 rounded-lg bg-emerald-700 px-4 py-3 text-white disabled:opacity-50">Approve dated terms</button>
        </form>}
      </section>}
    </div>
  </main>;
}
