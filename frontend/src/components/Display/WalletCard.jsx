import React, { useState, useEffect } from 'react';
import { walletAPI } from '../../services/api';

/**
 * WalletCard Component
 * Displays user wallet balance and recent transactions
 */
export default function WalletCard({ onAddFunds, onTransfer }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const response = await walletAPI.getBalance();
      setBalance(response.data.data.balance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="wallet-card">Loading...</div>;

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h3>My Wallet</h3>
        <div className="wallet-actions">
          {onAddFunds && (
            <button onClick={onAddFunds} className="action-btn-small">
              + Add Funds
            </button>
          )}
          {onTransfer && (
            <button onClick={onTransfer} className="action-btn-small">
              Transfer
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="wallet-balance">
        <p className="balance-label">Available Balance</p>
        <p className="balance-amount">₹{balance.toFixed(2)}</p>
      </div>

      <div className="wallet-info">
        <div className="wallet-status">
          <span className="status-label">Status:</span>
          <span className="status-value active">Active</span>
        </div>
        <div className="wallet-currency">
          <span className="currency-label">Currency:</span>
          <span className="currency-value">INR</span>
        </div>
      </div>
    </div>
  );
}
