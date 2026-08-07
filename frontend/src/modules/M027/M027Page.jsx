import React from 'react';
import './styles.css';

// Unlike the other "HIDDEN" module stubs, OrganicFarmRegistration.jsx has no
// host page or route at all yet (verified against App.jsx) — so there is
// nowhere honest to <Link> to. Building that host page is new-build work,
// out of scope for this fix; this stub says so plainly instead of guessing
// at a route that doesn't exist.
export default function M027Page() {
  return (
    <div className='module-M027 p-4'>
      <h1>Farmer Certification (M027)</h1>
      <p>Domain: Farmer — Status: HIDDEN (built, not yet routed)</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at{' '}
        <code>components/OrganicTraceability/OrganicFarmRegistration.jsx</code>
        {' '}— a complete organic farm registration form — but no page in this
        app currently mounts it, so there is no working link to send you to.
        It needs a host page before it is reachable from the UI.
      </p>
    </div>
  );
}
