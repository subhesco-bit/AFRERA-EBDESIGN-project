import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react';

const SalesReportPage = () => {
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const salesData = {
    totalRevenue: 1250000,
    totalOrders: 1520,
    averageOrderValue: 822,
    growthRate: 15.3,
    topProducts: [
      { name: 'Organic Rice', sales: 45000, revenue: 225000 },
      { name: 'Fresh Vegetables', sales: 38000, revenue: 190000 },
      { name: 'Dairy Products', sales: 32000, revenue: 160000 },
    ],
    topFarmers: [
      { name: 'Green Valley Co-op', orders: 120, revenue: 85000 },
      { name: 'Organic Farms Ltd', orders: 95, revenue: 72000 },
      { name: 'Sunrise Agriculture', orders: 88, revenue: 68000 },
    ],
  };

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">Comprehensive sales performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{salesData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{salesData.growthRate}% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{salesData.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">+8% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450</div>
            <p className="text-xs text-muted-foreground">+18% from last period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best-selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                  </div>
                  <p className="font-bold">₹{product.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Farmers</CardTitle>
            <CardDescription>Highest-performing farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.topFarmers.map((farmer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{farmer.name}</p>
                    <p className="text-sm text-muted-foreground">{farmer.orders} orders</p>
                  </div>
                  <p className="font-bold">₹{farmer.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesReportPage;
