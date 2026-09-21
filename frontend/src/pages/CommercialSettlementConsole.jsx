import React, { useState } from 'react';
import commercialSettlementAPI from '../services/commercialSettlementAPI';

export default function CommercialSettlementConsole() {
  const [settlementId, setSettlementId] = useState('');
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!settlementId) return;
    setLoading(true); setError('');
    try { const { data } = await commercialSettlementAPI.get(settlementId); setSettlement(data.data); }
    catch (e) { setSettlement(null); setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  const transition = async (toStatus) => {
    if (!settlement) return;
    setLoading(true); setError('');
    try { const { data } = await commercialSettlementAPI.transition(settlement.id, toStatus); setSettlement(data.data); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  return (
    <section aria-labelledby="commercial-settlement-title">
      <h1 id="commercial-settlement-title">Commercial Settlement</h1>
      <div>
        <label htmlFor="settlement-id">Settlement ID</label>
        <input id="settlement-id" value={settlementId} onChange={(e) => setSettlementId(e.target.value)} placeholder="Enter settlement ID" />
        <button type="button" onClick={load} disabled={loading || !settlementId}>{loading ? 'Loading…' : 'Load'}</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {settlement && (
        <div>
          <p><strong>Status:</strong> {settlement.status}</p>
          <p><strong>Beneficiary:</strong> {settlement.beneficiary_type} / {settlement.beneficiary_id}</p>
          <p><strong>Gross:</strong> {settlement.gross_amount} {settlement.currency}</p>
          <p><strong>Deductions:</strong> {settlement.deductions} {settlement.currency}</p>
          <p><strong>Net:</strong> {settlement.net_amount} {settlement.currency}</p>
          <div aria-label="Settlement actions">
            {(settlement.status === 'pending' || settlement.status === 'failed') && <button type="button" onClick={() => transition('approved')}>Approve</button>}
            {settlement.status === 'approved' && <button type="button" onClick={() => transition('queued')}>Queue Payment</button>}
            {settlement.status === 'queued' && <button type="button" onClick={() => transition('processing')}>Start Processing</button>}
            {settlement.status === 'processing' && <button type="button" onClick={() => transition('paid')}>Mark Paid</button>}
          </div>
          <h2>Events</h2>
          <ul>{(settlement.events || []).map((event) => <li key={event.id}>{event.from_status || 'created'} → {event.to_status}{event.reason ? ` — ${event.reason}` : ''}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
