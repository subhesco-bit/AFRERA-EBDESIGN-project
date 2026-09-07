import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation lives in the admin dashboard's Settings tab, not here.
export default function M002Page() {
  return (
    <div className='module-M002 p-4'>
      <h1>Platform Configuration (M002)</h1>
      <p>Domain: Platform Foundation — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/AdminDashboardPage.jsx</code>
        {' '}(Settings → "Platform Configuration"), not here.
      </p>
      <Link to="/admin/settings" className="text-blue-600 underline">
        Go to the Admin Dashboard →
      </Link>
    </div>
  );
}
