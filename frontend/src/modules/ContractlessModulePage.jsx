import React from 'react';

export default function ContractlessModulePage({ moduleId }) {
  return (
    <div className={`module-${moduleId} p-4`}>
      <h1>{moduleId} Module</h1>
      <section aria-labelledby={`${moduleId}-configuration-title`}>
        <h2 id={`${moduleId}-configuration-title`}>Configuration required</h2>
        <p>
          This module is not connected because its backend resource contract
          has not been verified yet.
        </p>
        <p>Connect a named backend operation before enabling live records.</p>
      </section>
    </div>
  );
}
