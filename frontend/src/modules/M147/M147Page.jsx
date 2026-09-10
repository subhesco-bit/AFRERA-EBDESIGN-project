import React, { useState, useEffect } from 'react';

export default function M147Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/m147')
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="M147-container">
      <h1>M147</h1>
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