import React from 'react';

export default function BodyPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Body System</h1>
      <p className="text-gray-600 mb-6">Operations, actions, and reflex management</p>
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-bold mb-2">Action Execution</h3>
          <p className="text-sm">Queue and execute operations with compensation logic</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-bold mb-2">Reflex System</h3>
          <p className="text-sm">Event-driven immediate responses without deliberation</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-bold mb-2">Operational Anatomy</h3>
          <p className="text-sm">Capability registry with cost, latency, and dependencies</p>
        </div>
      </div>
    </div>
  );
}
