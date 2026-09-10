import React, { useState, useEffect } from 'react';

export default function M087Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/m087')
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="M087-container">
      <h1>M087</h1>
      {loading && <p>Loading...</p>}
      {!loading && data.length === 0 && <p>No data</p>}
      {!loading && data.length > 0 && (
        <ul>
          {data.map((item) => (
            <li key={item.id}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}