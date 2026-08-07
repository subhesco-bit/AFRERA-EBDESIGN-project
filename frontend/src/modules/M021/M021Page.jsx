import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation lives in the farmer portal pages, not here.
export default function M021Page() {
  return (
    <div className='module-M021 p-4'>
      <h1>Farmer Registry (M021)</h1>
      <p>Domain: Farmer — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/FarmerPortalPage.jsx</code>
        {' '}and <code>pages/FarmerHomePage.jsx</code>, not here.
      </p>
      <Link to="/farmer-portal" className="text-blue-600 underline">
        Go to the Farmer Portal →
      </Link>
    </div>
  );
}
