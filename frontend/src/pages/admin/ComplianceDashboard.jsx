import React from 'react';

const ComplianceDashboard = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Compliance & Audit Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
          <p className="text-gray-600">Compliance Score</p>
          <p className="text-3xl font-bold text-green-600">98%</p>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
          <p className="text-gray-600">Issues Found</p>
          <p className="text-3xl font-bold text-yellow-600">5</p>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
          <p className="text-gray-600">Last Audit</p>
          <p className="text-lg font-bold">2 days ago</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Audit Trail</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border-l-4 border-blue-600">
              <span className="text-blue-600">✓</span>
              <div>
                <p className="font-semibold">User Access Log</p>
                <p className="text-sm text-gray-600">Completed - 100% compliant</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border-l-4 border-yellow-600">
              <span className="text-yellow-600">!</span>
              <div>
                <p className="font-semibold">Data Protection</p>
                <p className="text-sm text-gray-600">Review needed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">GDPR Compliance</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">Data Privacy</span>
                <span className="text-sm">95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '95%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">Consent Management</span>
                <span className="text-sm">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
