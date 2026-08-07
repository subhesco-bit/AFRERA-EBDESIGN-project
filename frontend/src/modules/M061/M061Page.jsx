import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation lives in WhatGrowPage, not here.
export default function M061Page() {
  return (
    <div className='module-M061 p-4'>
      <h1>Crop Planning (M061)</h1>
      <p>Domain: Crop — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/WhatGrowPage.jsx</code>,
        not here.
      </p>
      <Link to="/whatgrow" className="text-blue-600 underline">
        Go to What To Grow →
      </Link>
    </div>
  );
}
