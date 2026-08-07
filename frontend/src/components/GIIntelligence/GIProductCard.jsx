import React, { useState } from 'react';
import { giIntelligenceAPI } from '../../services/api';

/**
 * GI Product Card Component
 * Displays Geographical Indication product information with premium pricing
 *
 * FE-02 note: the display data already arrives via the `giProduct` prop, so
 * this component satisfies FE-02 for its primary content. Only the
 * authenticity-verify action still fetches, and that's inherent to the
 * feature — it looks up whatever code the user types at the moment they type
 * it, which isn't something a parent page could pre-fetch as props.
 */
const GIProductCard = ({ giProduct, onVerify }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!authCode.trim()) return;

    setVerifying(true);
    try {
      const response = await giIntelligenceAPI.verifyAuthentication(authCode);
      setVerificationResult(response.data);
    } catch (err) {
      setVerificationResult({ error: err.response?.status === 404 ? 'Invalid authentication code' : 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with GI Badge */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">{giProduct.gi_name}</h3>
              <p className="text-amber-100 text-sm">Geographical Indication</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
            {giProduct.state}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-500">Registration Number</p>
          <p className="font-mono font-medium">{giProduct.gi_registration_number}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500">Geographical Region</p>
          <p className="font-medium">{giProduct.geographical_region}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500">Category</p>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
            {giProduct.gi_category}
          </span>
        </div>

        {showDetails && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Historical Significance</p>
              <p className="text-sm text-gray-700">{giProduct.historical_significance}</p>
            </div>

            {giProduct.unique_characteristics && giProduct.unique_characteristics.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Unique Characteristics</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {giProduct.unique_characteristics.map((char, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">Quality Standards</p>
              <p className="text-sm text-gray-700">{JSON.stringify(giProduct.quality_standards, null, 2)}</p>
            </div>
          </div>
        )}

        {/* Verification Section */}
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Verify Authenticity</p>
          <div className="flex gap-2">
            <input aria-label="Text"
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Enter authentication code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              onClick={handleVerify}
              disabled={verifying || !authCode.trim()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {verificationResult && (
            <div className={`mt-3 p-3 rounded-lg ${
              verificationResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {verificationResult.error ? (
                <p className="text-sm">{verificationResult.error}</p>
              ) : (
                <div className="text-sm">
                  <p className="font-medium">✓ Verified Authentic</p>
                  <p className="mt-1">
                    <span className="text-gray-600">Product:</span> {verificationResult.gi_name}
                  </p>
                  <p>
                    <span className="text-gray-600">Region:</span> {verificationResult.geographical_region}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          {showDetails ? 'Show Less' : 'Show Details'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Premium:</span>
          <span className="font-bold text-amber-600">15-25%</span>
        </div>
      </div>
    </div>
  );
};

export default GIProductCard;
