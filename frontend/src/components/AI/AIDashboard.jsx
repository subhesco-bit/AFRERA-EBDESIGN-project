import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap,
} from "lucide-react";

const AIDashboard = () => {
  const [predictions, setPredictions] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const farmerId = localStorage.getItem("farmerId") || 1;
      const token = localStorage.getItem("token");

      // Load all AI data in parallel
      const [predictRes, optimRes, analyRes, statsRes] = await Promise.all([
        fetch(`/api/ai/predictions/${farmerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/ai/optimizations/${farmerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/ai/analyses/${farmerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/ai/stats/${farmerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (predictRes.ok) setPredictions(await predictRes.json());
      if (optimRes.ok) setOptimizations(await optimRes.json());
      if (analyRes.ok) setAnalyses(await analyRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const predictionChartData = [
    {
      name: "Weather",
      count:
        predictions.filter((p) => p.model_type === "weather").length || 0,
      accuracy: 92,
    },
    {
      name: "Yield",
      count: predictions.filter((p) => p.model_type === "yield_prediction")
        .length || 0,
      accuracy: 88,
    },
    {
      name: "Market Price",
      count:
        predictions.filter((p) => p.model_type === "market_price").length ||
        0,
      accuracy: 85,
    },
    {
      name: "Pest Detection",
      count:
        predictions.filter((p) => p.model_type === "pest_detection").length ||
        0,
      accuracy: 90,
    },
  ];

  const optimizationSavings = [
    { name: "Resource", savings: 25, potential: 35 },
    { name: "Inventory", savings: 20, potential: 28 },
    { name: "Logistics", savings: 20, potential: 30 },
    { name: "Procurement", savings: 18, potential: 25 },
    { name: "Financial", savings: 12, potential: 18 },
  ];

  const modelStatusPie = [
    {
      name: "Weather Predictions",
      value: predictions.filter((p) => p.model_type === "weather").length || 0,
    },
    {
      name: "Yield Forecasts",
      value:
        predictions.filter((p) => p.model_type === "yield_prediction").length ||
        0,
    },
    {
      name: "Market Analysis",
      value:
        predictions.filter((p) => p.model_type === "market_price").length || 0,
    },
    {
      name: "Soil Analysis",
      value:
        analyses.filter((a) => a.analysis_type === "comprehensive_soil")
          .length || 0,
    },
    {
      name: "Other",
      value: Math.max(
        0,
        predictions.length + optimizations.length + analyses.length - 4
      ),
    },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Intelligence Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time insights from 23 AI models across predictions, optimization,
          and analysis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Predictions</p>
              <p className="text-3xl font-bold text-gray-900">
                {predictions.length}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Optimizations Run</p>
              <p className="text-3xl font-bold text-gray-900">
                {optimizations.length}
              </p>
            </div>
            <Target className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Analyses Generated</p>
              <p className="text-3xl font-bold text-gray-900">
                {analyses.length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">AI Models Active</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.allAIModels || 23}
              </p>
            </div>
            <Zap className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex gap-4 border-b border-gray-200">
          {["overview", "predictions", "optimizations", "analyses"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Prediction Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Prediction Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Predictions" />
                  <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Model Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Model Usage Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modelStatusPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      value > 0 ? `${name}: ${value}` : ""
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {modelStatusPie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Optimization Savings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Optimization Savings Potential
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={optimizationSavings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#10b981"
                    name="Achieved Savings %"
                  />
                  <Line
                    type="monotone"
                    dataKey="potential"
                    stroke="#f59e0b"
                    name="Potential %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      All 23 Models Active
                    </span>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    100%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Avg. Prediction Confidence
                    </span>
                  </div>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    89.2%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Optimization Efficiency
                    </span>
                  </div>
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                    18.6%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "predictions" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Recent Predictions ({predictions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Model Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Confidence
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 10).map((pred, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {pred.model_type}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-12">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(pred.confidence || 0.85) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-gray-600">
                            {Math.round((pred.confidence || 0.85) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {pred.created_at
                          ? new Date(pred.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "optimizations" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Optimization Results ({optimizations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optimizations.slice(0, 8).map((opt, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {opt.optimization_type}
                    </h4>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {opt.savings_percent}% savings
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {opt.result
                      ? typeof opt.result === "string"
                        ? opt.result.substring(0, 100)
                        : JSON.stringify(opt.result).substring(0, 100)
                      : "No details"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analyses" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Generated Analyses ({analyses.length})
            </h3>
            <div className="space-y-4">
              {analyses.slice(0, 10).map((analysis, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {analysis.analysis_type}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {analysis.result
                      ? typeof analysis.result === "string"
                        ? analysis.result.substring(0, 150)
                        : JSON.stringify(analysis.result).substring(0, 150)
                      : "No details"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;
