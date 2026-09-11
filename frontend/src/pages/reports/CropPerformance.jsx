import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Leaf } from "lucide-react";

export default function CropPerformance() {
  const data = [
    { crop: "Rice", yield: 5000, target: 5500 },
    { crop: "Wheat", yield: 4500, target: 4800 },
    { crop: "Corn", yield: 6000, target: 5800 },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="flex items-center gap-3 mb-8">
        <Leaf className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">Crop Performance</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="crop" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="yield" fill="#10b981" />
            <Bar dataKey="target" fill="#9ca3af" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
