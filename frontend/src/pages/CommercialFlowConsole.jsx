import React, { useState } from 'react';
import commercialFlowAPI from '../services/commercialFlowAPI';

export default function CommercialFlowConsole() {
  const [orderId, setOrderId] = useState('');
  const [shipmentId, setShipmentId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setBusy(true); setError('');
    try { const response = await fn(); setResult(response.data?.data ?? response.data); }
    catch (e) { setError(e.response?.data?.error || e.message || 'Operation failed'); }
    finally { setBusy(false); }
  };

  return (
    <main aria-labelledby="commercial-flow-title" style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 id="commercial-flow-title">Commercial Flow Console</h1>
      <p>Operate the order → fulfillment → inventory → accounting → reconciliation spine.</p>
      <section aria-label="Shipment controls">
        <label>Shipment ID <input value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} /></label>
        <label>Order ID <input value={orderId} onChange={(e) => setOrderId(e.target.value)} /></label>
        <label>Next shipment status <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Select</option><option value="picked_up">Picked up</option><option value="in_transit">In transit</option><option value="out_for_delivery">Out for delivery</option><option value="delivered">Delivered</option><option value="failed">Failed</option><option value="returned">Returned</option>
        </select></label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button disabled={busy || !shipmentId || !status} onClick={() => run(() => commercialFlowAPI.transitionShipment(shipmentId, status))}>Transition shipment</button>
          <button disabled={busy || !shipmentId} onClick={() => run(() => commercialFlowAPI.getShipment(shipmentId))}>Refresh shipment</button>
          <button disabled={busy || !orderId} onClick={() => run(() => commercialFlowAPI.reconcileOrder(orderId))}>Reconcile order</button>
        </div>
      </section>
      {busy && <p role="status">Processing…</p>}
      {error && <p role="alert">{error}</p>}
      {result && <pre style={{ overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
