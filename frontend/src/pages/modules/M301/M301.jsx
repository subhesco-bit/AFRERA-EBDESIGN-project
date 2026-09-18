/**
 * M301: Module M301 Service Page
 * Mobile, Tablet & Desktop Responsive
 */

import React, { useState } from 'react';
import './M301.css';

export default function M301Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/backend-modules/M301/');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m301-page">
      <div className="m301-container">
        <h1>Module M301 Service</h1>
        <p>Module M301 - ENTERPRISE - Tier 7</p>

        <div className="m301-controls">
          <button onClick={handleFetch} disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {data && (
          <div className="m301-content">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
