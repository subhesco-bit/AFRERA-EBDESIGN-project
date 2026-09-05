import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { mfaAPI } from '../../services/componentApi';
import { useAuthStore } from '../../store/authStore';

/**
 * MFA Setup Component
 * Allows users to set up multi-factor authentication
 */
export default function MFASetup() {
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setupMFA();
  }, []);

  const setupMFA = async () => {
    try {
      setLoading(true);
      const response = await mfaAPI.setup();
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.otpauth_url);
      setBackupCodes(response.data.data.backupCodes);
      setStep(2);
    } catch (err) {
      setError('Failed to setup MFA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    try {
      setLoading(true);
      await mfaAPI.verify(user?.id, verificationCode);
      setSuccess(true);
      setStep(4);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MFA Enabled Successfully</h2>
          <p className="text-gray-600 mb-6">Your account is now protected with multi-factor authentication.</p>
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Multi-Factor Authentication</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up MFA...</p>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Step 1: Scan QR Code</h3>
            <p className="text-gray-600 mb-4">Use your authenticator app to scan this QR code</p>
            <div className="flex justify-center mb-4">
              {qrCode && <QRCodeSVG value={secret} size={200} />}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Step 2: Enter Verification Code</h3>
            <p className="text-gray-600 mb-4">Enter the 6-digit code from your authenticator app</p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
            />
          </div>

          <button
            onClick={verifyMFA}
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Verifying...' : 'Verify and Enable MFA'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Backup Codes</h3>
            <p className="text-gray-600 mb-4">Save these backup codes securely. You can use them if you lose access to your authenticator app.</p>
            <div className="bg-gray-100 p-4 rounded">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm py-1">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      )}
    </div>
  );
}
