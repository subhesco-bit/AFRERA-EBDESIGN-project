import React, { useState } from 'react';

const GovernmentSchemeDashboard = () => {
  const [schemes, setSchemes] = useState([]);
  const [filter, setFilter] = useState('all');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Government Scheme Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600">Active Schemes</p>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-gray-600">Total Applicants</p>
          <p className="text-3xl font-bold">1,240</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-gray-600">Expiring Soon</p>
          <p className="text-3xl font-bold">8</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-gray-600">Pending Verification</p>
          <p className="text-3xl font-bold">12</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Schemes List</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add Scheme
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border rounded">
            <option value="all">All Schemes</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Scheme Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Applicants</th>
              <th className="p-3 text-left">Expiry Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Placeholder rows */}
            <tr className="border-b">
              <td className="p-3">PM Kisan Scheme</td>
              <td className="p-3"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Active</span></td>
              <td className="p-3">245</td>
              <td className="p-3">2027-12-31</td>
              <td className="p-3 space-x-2">
                <button className="text-blue-600 hover:underline">Edit</button>
                <button className="text-red-600 hover:underline">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GovernmentSchemeDashboard;
