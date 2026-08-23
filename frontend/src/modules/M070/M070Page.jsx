import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation lives in HarvestScorePage, not here.
export default function M070Page() {
  return (
    <div className='module-M070 p-4'>
      <h1>Yield Recording (M070)</h1>
      <p>Domain: Crop — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/HarvestScorePage.jsx</code>,
        not here.
      </p>
      <Link to="/harvest-score" className="text-blue-600 underline">
        Go to Harvest Score →
      </Link>
    </div>
  );
}
