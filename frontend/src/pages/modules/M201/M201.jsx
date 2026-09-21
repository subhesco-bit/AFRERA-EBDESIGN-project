/**
 * M201: Module M201 Service Page
 * Mobile, Tablet & Desktop Responsive
 */

import React, { useState } from 'react';
import './M201.css';

export default function M201Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/backend-modules/M201/');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m201-page">
      <div className="m201-container">
        <h1>Module M201 Service</h1>
        <p>Module M201 - ENTERPRISE - Tier 5</p>

        <div className="m201-controls">
          <button onClick={handleFetch} disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {data && (
          <div className="m201-content">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
