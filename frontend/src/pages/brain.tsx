import React from 'react';
export default function BrainPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Brain System</h1>
      <p className="text-gray-600 mb-6">Decision engine and AI recommendations</p>
      <div className="space-y-4">
        <div className="p-4 bg-indigo-50 rounded-lg">
          <h3 className="font-bold mb-2">Decision Engine</h3>
          <p className="text-sm">AI-driven decision making for crop and financial recommendations</p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-lg">
          <h3 className="font-bold mb-2">Tissues & Atlas</h3>
          <p className="text-sm">Knowledge domains and recommendation models</p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-lg">
          <h3 className="font-bold mb-2">Predictions</h3>
          <p className="text-sm">Weather, market, and crop yield forecasting</p>
        </div>
      </div>
    </div>
  );
}
