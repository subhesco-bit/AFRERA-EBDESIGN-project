import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DashboardPage Component
 * Main user dashboard with statistics and navigation
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadStats(token);
  }, [navigate]);

  const loadStats = async (token) => {
    try {
      const response = await fetch('/api/v1/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  if (loading) return <div className="page dashboard-page"><p>Loading...</p></div>;

  return (
    <div className="page dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome back, {user?.name || 'User'}!</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="dashboard-stats">
        <div className="stat-card">
          <h3>Account Balance</h3>
          <p className="stat-value">₹{stats?.balance || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Active Orders</h3>
          <p className="stat-value">{stats?.activeOrders || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p className="stat-value">{stats?.totalTransactions || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Loyalty Points</h3>
          <p className="stat-value">{stats?.loyaltyPoints || 0}</p>
        </div>
      </section>

      <section className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button
            onClick={() => navigate('/products')}
            className="action-btn products-btn"
          >
            📦 Browse Products
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="action-btn orders-btn"
          >
            📋 View Orders
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className="action-btn wallet-btn"
          >
            💰 Manage Wallet
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="action-btn profile-btn"
          >
            👤 Edit Profile
          </button>
        </div>
      </section>

      <section className="dashboard-recent">
        <h2>Recent Activity</h2>
        {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
          <ul className="transaction-list">
            {stats.recentTransactions.map((tx, idx) => (
              <li key={idx} className="transaction-item">
                <span className="tx-description">{tx.description}</span>
                <span className="tx-amount">₹{tx.amount}</span>
                <span className="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-activity">No recent activity</p>
        )}
      </section>
    </div>
  );
}
