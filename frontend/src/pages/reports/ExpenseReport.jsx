import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CreditCard } from "lucide-react";

export default function ExpenseReport() {
  const data = [
    { month: "Jan", expenses: 25000, budget: 30000 },
    { month: "Feb", expenses: 28000, budget: 30000 },
    { month: "Mar", expenses: 22000, budget: 30000 },
    { month: "Apr", expenses: 31000, budget: 35000 },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-8 h-8 text-red-600" />
        <h1 className="text-3xl font-bold">Expense Report</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="expenses" fill="#ef4444" />
            <Bar dataKey="budget" fill="#9ca3af" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
