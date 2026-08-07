import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation lives in FPODashboardPage's Collective Orders tab, not here.
export default function M058Page() {
  return (
    <div className='module-M058 p-4'>
      <h1>FPO Sales (M058)</h1>
      <p>Domain: FPO — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/FPODashboardPage.jsx</code>
        {' '}("Collective Orders" tab), not here.
      </p>
      <Link to="/fpo-dashboard" className="text-blue-600 underline">
        Go to the FPO Dashboard →
      </Link>
    </div>
  );
}
