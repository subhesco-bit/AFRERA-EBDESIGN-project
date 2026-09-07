import React from 'react';
import './styles.css';

// Unlike the other "HIDDEN" module stubs, SampleRegistration.jsx has no host
// page or route at all yet (verified against App.jsx) — so there is nowhere
// honest to <Link> to. Building that host page is new-build work, out of
// scope for this fix; this stub says so plainly instead of guessing at a
// route that doesn't exist.
export default function M072Page() {
  return (
    <div className='module-M072 p-4'>
      <h1>Soil Test Management (M072)</h1>
      <p>Domain: Soil — Status: HIDDEN (built, not yet routed)</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at{' '}
        <code>components/LaboratoryERP/SampleRegistration.jsx</code>
        {' '}— a complete soil sample registration form — but no page in this
        app currently mounts it, so there is no working link to send you to.
        It needs a host page before it is reachable from the UI.
      </p>
    </div>
  );
}
