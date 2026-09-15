import React from "react";
import { History } from "lucide-react";

export default function AuditTrail() {
  const events = [
    { id: 1, action: "User Login", user: "user@example.com", timestamp: "2024-01-20 10:30" },
    { id: 2, action: "Settings Updated", user: "admin@example.com", timestamp: "2024-01-20 09:15" },
    { id: 3, action: "Data Export", user: "user@example.com", timestamp: "2024-01-19 14:20" },
  ];

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <History className="w-8 h-8 text-gray-600" />
        <h1 className="text-3xl font-bold">Audit Trail</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-6 py-3 text-sm">{e.action}</td>
                <td className="px-6 py-3 text-sm">{e.user}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{e.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
