import React, { useState, useEffect } from 'react';

export default function M251Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/m251')
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="M251-container">
      <h1>M251</h1>
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