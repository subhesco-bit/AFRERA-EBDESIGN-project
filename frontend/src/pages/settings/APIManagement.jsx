import React from "react";
import { Code, Copy, Trash2 } from "lucide-react";

export default function APIManagement() {
  const [keys] = React.useState([
    { id: 1, name: "Production Key", key: "pk_live_***", created: "2024-01-15" },
    { id: 2, name: "Development Key", key: "pk_test_***", created: "2024-01-10" },
  ]);

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <Code className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">API Keys</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Key</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t">
                <td className="px-6 py-3">{k.name}</td>
                <td className="px-6 py-3 font-mono text-sm">{k.key}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{k.created}</td>
                <td className="px-6 py-3 flex gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded"><Copy size={18} /></button>
                  <button className="p-1 hover:bg-gray-100 rounded text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
