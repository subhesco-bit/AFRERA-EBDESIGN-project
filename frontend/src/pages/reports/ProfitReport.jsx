import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export default function ProfitReport() {
  const data = [
    { month: "Jan", revenue: 45000, expenses: 25000, profit: 20000 },
    { month: "Feb", revenue: 52000, expenses: 28000, profit: 24000 },
    { month: "Mar", revenue: 48000, expenses: 22000, profit: 26000 },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold">Profit & Loss</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
