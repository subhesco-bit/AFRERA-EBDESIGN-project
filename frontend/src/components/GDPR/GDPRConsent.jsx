import React, { useState } from 'react';
import { privacyAPI } from '../../services/componentApi';

/**
 * GDPR Consent Component
 * Manages user consent for GDPR compliance
 */
export default function GDPRConsent() {
  const [consents, setConsents] = useState({
    marketing: false,
    analytics: false,
    personalization: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const consentTypes = [
    {
      key: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive marketing emails and promotional content',
    },
    {
      key: 'analytics',
      title: 'Analytics and Tracking',
      description: 'Allow us to analyze your usage to improve our services',
    },
    {
      key: 'personalization',
      title: 'Personalization',
      description: 'Personalize your experience based on your preferences',
    },
  ];

  const handleConsentChange = (key) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveConsents = async () => {
    try {
      setLoading(true);
      for (const [consentType, consentGiven] of Object.entries(consents)) {
        await privacyAPI.recordConsent(consentType, consentGiven);
      }
      setSuccess(true);
    } catch (err) {
      console.error('Failed to save consents:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Consent Preferences Saved</h2>
          <p className="text-gray-600 mb-6">Your privacy preferences have been updated successfully.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Consent Preferences</h2>
      <p className="text-gray-600 mb-6">Manage your privacy preferences and consent settings.</p>

      <div className="space-y-4">
        {consentTypes.map(({ key, title, description }) => (
          <div key={key} className="flex items-start p-4 border border-gray-200 rounded">
            <input
              type="checkbox"
              id={key}
              checked={consents[key]}
              onChange={() => handleConsentChange(key)}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3">
              <label htmlFor={key} className="block text-sm font-medium text-gray-900">
                {title}
              </label>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={saveConsents}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
