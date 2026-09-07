import React, { useState } from 'react';

const MobileWallet = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mobile Wallet</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Page content */}
        <p className="text-gray-600">Content for MobileWallet</p>
      </div>
    </div>
  );
};

export default MobileWallet;
