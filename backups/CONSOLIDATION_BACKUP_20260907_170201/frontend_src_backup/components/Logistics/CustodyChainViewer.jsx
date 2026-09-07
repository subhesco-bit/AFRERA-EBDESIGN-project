/**
 * Custody Chain Viewer
 * Displays the append-only, hash-chained custody event history for a shipment
 * (backend/src/services/custodyEventService.js) — a real, tamper-evident
 * event log of who held custody of a shipment and when, plus any settlement
 * instructions issued off the back of it. Never moves real money itself.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ShieldCheck, ShieldAlert, Link2 } from 'lucide-react';
import { custodyAPI } from '../../services/api';

const EVENT_LABELS = {
  job_offered: 'Job Offered',
  job_accepted: 'Job Accepted',
  pickup_scheduled: 'Pickup Scheduled',
  pickup_confirmed: 'Pickup Confirmed',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivery_attempted: 'Delivery Attempted',
  delivery_confirmed: 'Delivery Confirmed',
  settlement_pending: 'Settlement Pending',
  settlement_ready: 'Settlement Ready',
  settlement_complete: 'Settlement Complete',
  pickup_delayed: 'Pickup Delayed',
  transit_delayed: 'Transit Delayed',
  delivery_failed: 'Delivery Failed',
  goods_damaged: 'Goods Damaged',
  goods_lost: 'Goods Lost',
  carrier_rejected: 'Carrier Rejected',
  documentation_missing: 'Documentation Missing',
  dispute_raised: 'Dispute Raised',
};

const EXCEPTION_EVENTS = new Set([
  'pickup_delayed', 'transit_delayed', 'delivery_failed', 'goods_damaged',
  'goods_lost', 'carrier_rejected', 'documentation_missing', 'dispute_raised',
]);

const CustodyChainViewer = ({ shipmentId }) => {
  const [chain, setChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shipmentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    custodyAPI.getChain(shipmentId)
      .then((response) => {
        if (!cancelled) setChain(response.data.chain);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load custody chain');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shipmentId]);

  if (!shipmentId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Custody Chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-center py-6 text-gray-500">Loading custody chain...</div>}

        {!loading && error && (
          <div className="text-center py-6 text-red-500">{error}</div>
        )}

        {!loading && !error && chain && chain.events.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No custody events recorded yet for this shipment.
          </div>
        )}

        {!loading && !error && chain && chain.events.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {chain.chain_integrity === 'verified' ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Chain Verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Chain Integrity Issue
                </Badge>
              )}
              <span className="text-sm text-gray-600">
                {chain.verification_details?.verified_events ?? chain.events.length} of {chain.events.length} events hash-verified
              </span>
            </div>

            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {chain.events.map((event) => (
                <li key={event.event_id} className="ml-4">
                  <div
                    className={`absolute w-2.5 h-2.5 rounded-full -left-[5px] mt-1.5 ${
                      EXCEPTION_EVENTS.has(event.event_type) ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {EVENT_LABELS[event.event_type] || event.event_type}
                    </span>
                    <time className="text-xs text-gray-500">
                      {new Date(event.event_timestamp).toLocaleString()}
                    </time>
                  </div>
                  <div className="text-xs text-gray-400 font-mono truncate">
                    hash: {event.current_event_hash?.slice(0, 16)}...
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustodyChainViewer;
