import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download, Package, AlertTriangle, TrendingUp, Warehouse } from 'lucide-react';
import AIInsightsPanel from '../components/ui/AIInsightsPanel';
import { aiDecisionService } from '../services/aiDecisionService';

const InventoryReportPage = () => {
  const [view, setView] = useState('overview');

  const aiInsights = useMemo(
    () => [
      aiDecisionService.buildDecision({
        id: 'inventory-reorder-wave',
        title: 'Reorder wave recommendation',
        description: 'Rice and fertilizer stock are trending below target for the next 72 hours. Replenishment should be prioritized before the next dispatch cycle.',
        status: 'pending',
        confidence: 0.89,
        impact: 'high',
        category: 'inventory',
        icon: '📦',
        severity: 'warning',
        metadata: { source: 'fallback', module: 'inventory' },
        context: { stock: 'below target', horizon: '72h' },
        timestamp: new Date().toISOString(),
      }),
      aiDecisionService.buildDecision({
        id: 'inventory-pace-risk',
        title: 'Demand spike risk',
        description: 'Demand for fruits and vegetables is accelerating beyond the recent three-week average. Consider shifting holding capacity and increasing safety stock.',
        status: 'pending',
        confidence: 0.83,
        impact: 'medium',
        category: 'inventory',
        icon: '📈',
        severity: 'info',
        metadata: { source: 'fallback', module: 'demand' },
        context: { category: 'produce', trend: '+18%' },
        timestamp: new Date().toISOString(),
      }),
    ],
    [],
  );

  const handleApplyRecommendation = (insight) => {
    alert(`Applied recommendation: ${insight.title}`);
  };

  const inventoryData = {
    totalItems: 1520,
    totalValue: 2450000,
    lowStockItems: 45,
    outOfStock: 8,
    categories: [
      { name: 'Grains', items: 450, value: 850000 },
      { name: 'Vegetables', items: 380, value: 620000 },
      { name: 'Dairy', items: 320, value: 580000 },
      { name: 'Fruits', items: 370, value: 400000 },
    ],
    lowStockAlerts: [
      { name: 'Organic Wheat', current: 15, minimum: 50, unit: 'kg' },
      { name: 'Fresh Tomatoes', current: 8, minimum: 30, unit: 'kg' },
      { name: 'Milk', current: 20, minimum: 40, unit: 'liters' },
    ],
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Report</h1>
          <p className="text-muted-foreground">Current inventory status and analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="valuation">Valuation</SelectItem>
              <SelectItem value="movement">Movement</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <AIInsightsPanel
          insights={aiInsights}
          loading={false}
          onRefresh={() => window.location.reload()}
          onApplyRecommendation={handleApplyRecommendation}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData.totalItems}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{inventoryData.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{inventoryData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items below minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{inventoryData.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Item count and value per category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.items} items</p>
                  </div>
                  <p className="font-bold">₹{category.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData.lowStockAlerts.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.current} / {item.minimum} {item.unit}</p>
                  </div>
                  <Button size="sm" variant="outline">Reorder</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryReportPage;
