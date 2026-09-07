import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// This module's catalogue entry previously claimed Status: ABSENT. That was
// stale — the real implementation is ModuleHubPage.jsx, mounted at /modules.
// This stub points there instead of duplicating it.
export default function M001Page() {
  return (
    <div className='module-M001 p-4'>
      <h1>Platform Core (M001)</h1>
      <p>Domain: Platform Foundation — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at <code>pages/ModuleHubPage.jsx</code>,
        not here.
      </p>
      <Link to="/modules" className="text-blue-600 underline">
        Go to the Module Hub →
      </Link>
    </div>
  );
}
