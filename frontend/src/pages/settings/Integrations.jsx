import React from "react";
import { Zap, Check, Plus } from "lucide-react";

export default function Integrations() {
  const integrations = [
    { name: "Stripe", status: "connected", icon: "💳" },
    { name: "Datadog", status: "connected", icon: "📊" },
    { name: "Slack", status: "available", icon: "💬" },
  ];

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-8 h-8 text-yellow-600" />
        <h1 className="text-3xl font-bold">Integrations</h1>
      </div>

      <div className="grid gap-4">
        {integrations.map((int, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{int.icon}</span>
              <div>
                <h3 className="font-semibold">{int.name}</h3>
                <p className="text-sm text-gray-600">{int.status}</p>
              </div>
            </div>
            {int.status === "connected" ? (
              <Check className="w-6 h-6 text-green-600" />
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={18} />Connect</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
