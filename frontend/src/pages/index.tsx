import React from 'react';

export default function IndexPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">EBDESIGN Platform</h1>
      <p className="text-lg text-gray-600 mb-8">Agricultural Digital Operating System</p>
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-blue-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Operating Systems</h2>
          <ul className="space-y-2 text-sm">
            <li>• Body (Operations)</li>
            <li>• Brain (Decisions)</li>
            <li>• Organism (Health)</li>
            <li>• Vet (Traceability)</li>
            <li>• Lattice (Networking)</li>
          </ul>
        </div>
        <div className="p-6 bg-green-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Commerce & Finance</h2>
          <ul className="space-y-2 text-sm">
            <li>• Share (Trading)</li>
            <li>• ERP (Accounting)</li>
            <li>• Flows (Workflows)</li>
            <li>• Economy (Tokens)</li>
            <li>• Ledger (Finance)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
