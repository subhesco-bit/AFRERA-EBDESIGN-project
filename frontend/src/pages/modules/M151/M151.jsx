/**
 * M151: Module M151 Service Page
 * Mobile, Tablet & Desktop Responsive
 */

import React, { useState } from 'react';
import './M151.css';

export default function M151Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/backend-modules/M151/');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m151-page">
      <div className="m151-container">
        <h1>Module M151 Service</h1>
        <p>Module M151 - ENTERPRISE - Tier 4</p>

        <div className="m151-controls">
          <button onClick={handleFetch} disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {data && (
          <div className="m151-content">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
