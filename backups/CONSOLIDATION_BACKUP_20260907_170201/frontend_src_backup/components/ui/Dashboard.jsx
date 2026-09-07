/**
 * Advanced Dashboard Component
 * Real-time data visualization with interactive charts and widgets
 * Supports multiple data types and customizable layouts
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Select, DatePicker } from './common';

const Dashboard = ({ 
  title, 
  widgets = [], 
  layout = 'grid',
  refreshInterval = 60000,
  onRefresh,
  onLayoutChange 
}) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedPeriod, autoRefresh, refreshInterval]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate data loading - in production, this would call actual APIs
      const dashboardData = {};
      
      for (const widget of widgets) {
        dashboardData[widget.id] = await fetchWidgetData(widget, selectedPeriod);
      }
      
      setData(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2026-08-31: this used to invent Math.random() numbers for every widget
  // regardless of what the caller passed in, discarding real data callers
  // (e.g. PlatformManagementPage.jsx) compute from real API responses and
  // hand down via widget.value/widget.data. Widgets are now real-data-in,
  // real-data-out: use whatever the widget prop actually carries, and only
  // fall back to an honest "no data" render (handled by each *Widget
  // component below) rather than a fabricated number.
  const fetchWidgetData = async (widget, _period) => {
    switch (widget.type) {
      case 'metric':
        if (widget.value === undefined) return null;
        return {
          value: widget.value,
          change: widget.change,
        };
      case 'chart':
        if (!widget.data) return null;
        return widget.data;
      case 'table':
        if (!widget.rows) return null;
        return {
          headers: widget.columns || ['Name', 'Value', 'Status'],
          rows: widget.rows,
        };
      case 'gauge':
        if (widget.value === undefined) return null;
        return {
          value: widget.value,
          min: widget.min ?? 0,
          max: widget.max ?? 100,
        };
      case 'map':
        if (!widget.markers) return null;
        return { markers: widget.markers };
      default:
        return null;
    }
  };

  const renderWidget = (widget) => {
    const widgetData = data[widget.id];
    
    switch (widget.type) {
      case 'metric':
        return <MetricWidget widget={widget} data={widgetData} />;
      case 'chart':
        return <ChartWidget widget={widget} data={widgetData} />;
      case 'table':
        return <TableWidget widget={widget} data={widgetData} />;
      case 'gauge':
        return <GaugeWidget widget={widget} data={widgetData} />;
      case 'map':
        return <MapWidget widget={widget} data={widgetData} />;
      default:
        return <div className="text-gray-500">Unknown widget type</div>;
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-4';
      case 'list':
        return 'space-y-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  return (
    <div className="dashboard">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={[
              { value: '1d', label: '1 Day' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' }
            ]}
            className="w-32"
          />
          
          <Button
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Auto'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            🔄 Refresh
          </Button>
          
          {onLayoutChange && (
            <Select
              value={layout}
              onChange={onLayoutChange}
              options={[
                { value: 'grid', label: 'Grid' },
                { value: 'masonry', label: 'Masonry' },
                { value: 'list', label: 'List' }
              ]}
              className="w-24"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className={getLayoutClasses()}>
          {widgets.map(widget => (
            <Card 
              key={widget.id} 
              className={`widget widget-${widget.type}`}
              style={{ 
                gridColumn: widget.colSpan ? `span ${widget.colSpan}` : 'auto',
                gridRow: widget.rowSpan ? `span ${widget.rowSpan}` : 'auto'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{widget.title}</h3>
                {widget.actions && (
                  <div className="flex space-x-2">
                    {widget.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => action.onClick()}
                      >
                        {action.icon}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {renderWidget(widget)}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Widget Components
const MetricWidget = ({ widget, data }) => {
  if (!data || data.value === undefined || data.value === null) {
    return <div className="metric-widget text-sm text-gray-500">No data available</div>;
  }

  const hasChange = typeof data.change === 'number';
  const isPositive = hasChange && data.change >= 0;

  return (
    <div className="metric-widget">
      <div className="text-4xl font-bold text-gray-900">
        {widget.prefix}{typeof data.value === 'number' ? data.value.toFixed(2) : data.value}{widget.suffix}
      </div>
      {hasChange && (
        <div className={`flex items-center mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span className="ml-1">{Math.abs(data.change).toFixed(1)}%</span>
          <span className="ml-2 text-gray-500 text-sm">vs last period</span>
        </div>
      )}
      {widget.description && (
        <p className="text-sm text-gray-600 mt-2">{widget.description}</p>
      )}
    </div>
  );
};

const ChartWidget = ({ widget, data }) => {
  if (!data) return null;
  
  // Simple chart rendering - in production, use a charting library like Chart.js or Recharts
  const maxValue = Math.max(...data.datasets[0].data);
  
  return (
    <div className="chart-widget">
      <div className="flex items-end justify-between h-48">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index];
          const height = (value / maxValue) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${height}%` }}
                title={`${label}: ${value.toFixed(2)}`}
              />
              <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TableWidget = ({ widget, data }) => {
  if (!data) return null;
  
  return (
    <div className="table-widget overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {data.headers.map((header, index) => (
              <th key={index} className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50">
              {Object.values(row).map((cell, cellIndex) => (
                <td key={cellIndex} className="py-2 px-3 text-sm text-gray-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GaugeWidget = ({ widget, data }) => {
  if (!data) return null;
  
  const percentage = (data.value / data.max) * 100;
  const getColor = () => {
    if (percentage < 33) return 'bg-red-500';
    if (percentage < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="gauge-widget">
      <div className="relative h-48 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-8 border-gray-200 relative">
          <div 
            className={`absolute inset-0 rounded-full ${getColor()} transition-all`}
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
              transform: `rotate(${(percentage / 100) * 360}deg)`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {data.value.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">
                {widget.unit || ''}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-4 text-sm text-gray-600">
        <span>{data.min}</span>
        <span>{data.max}</span>
      </div>
    </div>
  );
};

const MapWidget = ({ widget, data }) => {
  if (!data) return null;
  
  return (
    <div className="map-widget">
      <div className="h-48 bg-gray-100 rounded relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm">Map visualization</p>
            <p className="text-xs mt-1">{data.markers.length} markers</p>
          </div>
        </div>
        {data.markers.slice(0, 5).map((marker, index) => (
          <div
            key={index}
            className="absolute w-3 h-3 bg-blue-500 rounded-full animate-pulse"
            style={{
              left: `${((marker.lng + 180) / 360) * 100}%`,
              top: `${((marker.lat + 90) / 180) * 100}%`
            }}
            title={`Value: ${marker.value.toFixed(2)}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;