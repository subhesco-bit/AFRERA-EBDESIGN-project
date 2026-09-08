/**
 * AI Insights Panel Component
 * Displays AI-powered insights and recommendations
 * Real-time data visualization and intelligent suggestions
 */

import React, { useState, useEffect } from 'react';
import { Card, Alert, Badge, Button, Spinner } from './common';

const AIInsightsPanel = ({ insights, loading, onRefresh, onApplyRecommendation }) => {
  const [expandedInsights, setExpandedInsights] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (insights) {
      // Auto-expand critical insights
      insights.forEach(insight => {
        if (insight.severity === 'critical') {
          setExpandedInsights(prev => ({ ...prev, [insight.id]: true }));
        }
      });
    }
  }, [insights]);

  const filteredInsights = insights ? insights.filter(insight => {
    if (filter === 'all') return true;
    return insight.severity === filter;
  }) : [];

  const toggleExpand = (insightId) => {
    setExpandedInsights(prev => ({
      ...prev,
      [insightId]: !prev[insightId],
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '⚠️';
      case 'warning': return '⚡';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <Card className="ai-insights-panel">
        <div className="flex items-center justify-center p-8">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">Loading AI insights...</span>
        </div>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="ai-insights-panel">
        <div className="text-center p-8 text-gray-500">
          <div className="text-4xl mb-2">🤖</div>
          <p>No AI insights available at this time</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="mt-4"
          >
            Refresh Insights
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="ai-insights-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">🤖</span>
          AI Insights
          <Badge variant="primary" className="ml-2">
            {filteredInsights.length}
          </Badge>
        </h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            title="Refresh insights"
          >
            🔄
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredInsights.map(insight => (
          <Alert
            key={insight.id}
            variant={getSeverityColor(insight.severity)}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleExpand(insight.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <span className="text-xl mr-3">{getSeverityIcon(insight.severity)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant={getSeverityColor(insight.severity)} size="sm">
                      {insight.severity}
                    </Badge>
                  </div>

                  {expandedInsights[insight.id] && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-700">{insight.description}</p>

                      {insight.data && (
                        <div className="bg-gray-50 rounded p-3 mt-2">
                          <h5 className="text-xs font-semibold text-gray-600 mb-2">DATA ANALYSIS</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(insight.data).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-600">{key}:</span>
                                <span className="ml-1 font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-gray-600 mb-2">RECOMMENDATIONS</h5>
                          <ul className="space-y-1">
                            {insight.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="mr-2">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                          {onApplyRecommendation && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="mt-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApplyRecommendation(insight);
                              }}
                            >
                              Apply Recommendations
                            </Button>
                          )}
                        </div>
                      )}

                      {insight.confidence && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Confidence</span>
                            <span>{(insight.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${insight.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        Generated: {new Date(insight.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
              >
                {expandedInsights[insight.id] ? '▼' : '▶'}
              </Button>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
};

export default AIInsightsPanel;
