/**
 * M63: Module M63 Service Page
 * Mobile, Tablet & Desktop Responsive
 */

import React, { useState } from 'react';
import './M63.css';

export default function M63Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/backend-modules/M63/');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m63-page">
      <div className="m63-container">
        <h1>Module M63 Service</h1>
        <p>Module M63 - AGRICULTURAL - Tier 2</p>

        <div className="m63-controls">
          <button onClick={handleFetch} disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {data && (
          <div className="m63-content">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
