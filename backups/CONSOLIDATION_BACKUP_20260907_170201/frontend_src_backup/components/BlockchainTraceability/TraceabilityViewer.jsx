import React, { useState, useEffect } from 'react';
import { blockchainTraceabilityAPI } from '../../services/api';

/**
 * Traceability Viewer Component
 * Displays blockchain-based product traceability information
 *
 * FE-02 note: no current parent page renders this component (unmounted as of
 * 2026-08-07). It accepts optional `traceabilityEvents`/`chainOfCustody` props
 * so a future parent page can supply data directly; falls back to fetching by
 * productId/batchNumber when they are omitted.
 */
const TraceabilityViewer = ({ productId, batchNumber, traceabilityEvents: eventsProp, chainOfCustody: custodyProp }) => {
  const [traceabilityEvents, setTraceabilityEvents] = useState(eventsProp || []);
  const [chainOfCustody, setChainOfCustody] = useState(custodyProp || null);
  const [loading, setLoading] = useState(!eventsProp);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (eventsProp) {
      setTraceabilityEvents(eventsProp);
      setChainOfCustody(custodyProp || null);
      setLoading(false);
      return;
    }
    fetchTraceabilityData();
  }, [productId, batchNumber, eventsProp, custodyProp]);

  const fetchTraceabilityData = async () => {
    try {
      const [eventsRes, custodyRes] = await Promise.all([
        blockchainTraceabilityAPI.getTraceabilityEvents(productId, batchNumber),
        blockchainTraceabilityAPI.verifyChainOfCustody(productId, batchNumber)
      ]);

      setTraceabilityEvents(eventsRes.data);
      setChainOfCustody(custodyRes.data);
    } catch (err) {
      setError('Failed to load traceability data');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    const icons = {
      harvest: '🌱',
      processing: '🏭',
      packaging: '📦',
      shipping: '🚚',
      delivery: '📬',
      sale: '🏪'
    };
    return icons[eventType] || '📍';
  };

  const getEventColor = (eventType) => {
    const colors = {
      harvest: 'bg-green-100 border-green-300',
      processing: 'bg-blue-100 border-blue-300',
      packaging: 'bg-purple-100 border-purple-300',
      shipping: 'bg-orange-100 border-orange-300',
      delivery: 'bg-teal-100 border-teal-300',
      sale: 'bg-pink-100 border-pink-300'
    };
    return colors[eventType] || 'bg-gray-100 border-gray-300';
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Blockchain Traceability</h3>
        {chainOfCustody && (
          <div className={`px-3 py-1 rounded-full text-sm ${
            chainOfCustody.is_complete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {chainOfCustody.is_complete ? '✓ Verified Chain' : '⚠ Incomplete Chain'}
          </div>
        )}
      </div>

      {/* Blockchain Verification Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Blockchain Verified</p>
            <p className="text-sm text-gray-600">All transactions recorded on immutable ledger</p>
          </div>
        </div>
      </div>

      {/* Traceability Timeline */}
      <div className="space-y-4">
        {traceabilityEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No traceability events recorded</p>
        ) : (
          traceabilityEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline Line */}
              {index < traceabilityEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}

              <div className={`flex gap-4 p-4 rounded-lg border-2 ${getEventColor(event.event_type)}`}>
                {/* Event Icon */}
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                  {getEventIcon(event.event_type)}
                </div>

                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">{event.event_type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.event_timestamp).toLocaleString()}
                      </p>
                    </div>
                    {event.transaction_hash && (
                      <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                        ✓ Blockchain
                      </div>
                    )}
                  </div>

                  {/* Actor Info */}
                  {event.actor_id && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">By:</span> {event.first_name} {event.last_name}
                      {event.city && <span> • {event.city}, {event.state}</span>}
                    </p>
                  )}

                  {/* Event Data */}
                  {event.event_data && Object.keys(event.event_data).length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {Object.entries(event.event_data).map(([key, value]) => (
                        <span key={key} className="inline-block mr-3">
                          <span className="font-medium">{key}:</span> {value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* IPFS Hash */}
                  {event.ipfs_hash && (
                    <div className="mt-2 text-xs text-gray-500 font-mono">
                      IPFS: {event.ipfs_hash}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chain of Custody Summary */}
      {chainOfCustody && chainOfCustody.chain && chainOfCustody.chain.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-700 mb-3">Chain of Custody</h4>
          <div className="flex flex-wrap gap-2">
            {chainOfCustody.chain.map((transfer, index) => (
              <div key={transfer.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{transfer.holder_type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transfer.transfer_date).toLocaleDateString()}
                  </p>
                </div>
                {index < chainOfCustody.chain.length - 1 && (
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TraceabilityViewer;
