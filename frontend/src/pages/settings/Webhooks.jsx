import React from "react";
import { GitBranch, MoreVertical } from "lucide-react";

export default function Webhooks() {
  const webhooks = [
    { id: 1, url: "https://api.example.com/webhooks", event: "order.created", active: true },
    { id: 2, url: "https://api.example.com/webhooks", event: "payment.completed", active: true },
  ];

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <GitBranch className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold">Webhooks</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">URL</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Event</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-6 py-3 text-sm font-mono">{w.url}</td>
                <td className="px-6 py-3 text-sm">{w.event}</td>
                <td className="px-6 py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span></td>
                <td className="px-6 py-3"><button className="p-1 hover:bg-gray-100 rounded"><MoreVertical size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
