import React, { useState } from 'react';

/**
 * QR Code Scanner Component
 * Allows consumers to scan QR codes and view organic traceability information
 */
const QRCodeScanner = () => {
  const [qrCode, setQrCode] = useState('');
  const [traceabilityData, setTraceabilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setLoading(true);
    setError(null);
    setTraceabilityData(null);

    try {
      const response = await fetch(`/api/v1/organic-traceability/consumer-transparency/qr/${qrCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('QR code not found. Please verify the code and try again.');
        }
        throw new Error('Failed to fetch traceability data');
      }

      const data = await response.json();
      setTraceabilityData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Organic Traceability Scanner</h2>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <form onSubmit={handleScan} className="flex gap-4">
          <input aria-label="Text"
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Enter QR code or scan..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {traceabilityData && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-xl font-bold">Certified Organic</h3>
                <p className="text-green-100">{traceabilityData.farm_certification_number}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Product Information */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Product Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Lot Number:</span>
                  <p className="font-medium">{traceabilityData.lot_number}</p>
                </div>
                <div>
                  <span className="text-gray-500">Packaging Date:</span>
                  <p className="font-medium">{traceabilityData.packaging_date}</p>
                </div>
              </div>
            </div>

            {/* Farmer Information */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Farmer Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Farmer:</span>
                  <p className="font-medium">{traceabilityData.farmer_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Farm Location:</span>
                  <p className="font-medium">{traceabilityData.farm_location}</p>
                </div>
              </div>
            </div>

            {/* Harvest Information */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Harvest Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Harvest Date:</span>
                  <p className="font-medium">{traceabilityData.harvest_date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Processing Facility:</span>
                  <p className="font-medium">{traceabilityData.processing_facility}</p>
                </div>
                <div>
                  <span className="text-gray-500">Processing Date:</span>
                  <p className="font-medium">{traceabilityData.processing_date}</p>
                </div>
              </div>
            </div>

            {/* Certification Details */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Organic Certification</h4>
              {traceabilityData.organic_certification_details && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <pre className="text-sm text-green-800 whitespace-pre-wrap">
                    {JSON.stringify(traceabilityData.organic_certification_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Chain of Custody */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Chain of Custody</h4>
              {traceabilityData.chain_of_custody_summary && (
                <div className="space-y-2">
                  {traceabilityData.chain_of_custody_summary.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.holder}</p>
                        <p className="text-gray-500">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Test Results */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Quality Test Results</h4>
              {traceabilityData.quality_test_results && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                    {JSON.stringify(traceabilityData.quality_test_results, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
            <p>This product is certified organic and traceable from seed to consumer.</p>
            <p className="mt-1">Scan this QR code to verify authenticity anytime.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
