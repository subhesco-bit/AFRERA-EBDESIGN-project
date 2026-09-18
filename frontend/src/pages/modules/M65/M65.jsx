/**
 * M65: Module M65 Service Page
 * Mobile, Tablet & Desktop Responsive
 */

import React, { useState } from 'react';
import './M65.css';

export default function M65Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/backend-modules/M65/');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m65-page">
      <div className="m65-container">
        <h1>Module M65 Service</h1>
        <p>Module M65 - AGRICULTURAL - Tier 2</p>

        <div className="m65-controls">
          <button onClick={handleFetch} disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {data && (
          <div className="m65-content">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
