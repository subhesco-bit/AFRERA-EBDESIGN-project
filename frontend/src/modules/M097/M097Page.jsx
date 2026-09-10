import React, { useState, useEffect } from 'react';

export default function M097Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/m097')
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="M097-container">
      <h1>M097</h1>
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