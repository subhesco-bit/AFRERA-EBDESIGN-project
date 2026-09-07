import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation lives in FarmerFieldPage ("My Fields"), not here.
export default function M034Page() {
  return (
    <div className='module-M034 p-4'>
      <h1>Parcel Mapping (M034)</h1>
      <p>Domain: Land — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/FarmerFieldPage.jsx</code>
        {' '}("My Fields"), not here.
      </p>
      <Link to="/farmer-field" className="text-blue-600 underline">
        Go to My Fields →
      </Link>
    </div>
  );
}
