import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesAnalyticsAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Download, DollarSign, TrendingUp, Package, Users } from 'lucide-react';

// 2026-09-16: was a hardcoded `salesData` object (totalRevenue: 1250000,
// fabricated topProducts/topFarmers, a fake "Generate Report" button
// that just ran setTimeout), zero fetch/axios anywhere. Wired to the
// real, mounted `GET /api/ecommercebusinesssales/sales-analytics`
// endpoint (see services/api.js's `salesAnalyticsAPI` for the full
// verification trail against `ecommerceBusinessSalesService.js`).
// The real endpoint takes `start_date`/`end_date` filters (not a
// daily/weekly/monthly/quarterly "period" the old fake dropdown
// offered), so the period selector was replaced with a real date range
// that actually drives the query. `topProducts`/`topFarmers`/
// `growthRate`/"Active Customers" have no backend equivalent and were
// removed rather than fabricated; the real per-day breakdown
// (`daily_data`) is rendered instead. Export has no real backend either
// (checked - no export/download endpoint exists for this data), so it's
// disabled with a reason instead of pretending to work.
const SalesReportPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-analytics', startDate, endDate],
    queryFn: () =>
      salesAnalyticsAPI
        .getSalesAnalytics({ start_date: startDate || undefined, end_date: endDate || undefined })
        .then((r) => r.data),
  });

  const summary = data?.summary;
  const dailyData = data?.daily_data || [];
  const avgOrderValue = summary && summary.total_orders > 0
    ? summary.total_revenue / summary.total_orders
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">Comprehensive sales performance analysis</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
            aria-label="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
            aria-label="End date"
          />
          <Button variant="outline" disabled title="Export has no live backend yet">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Loading sales data...</p>}
      {error && <p className="text-red-600">Failed to load sales data: {error.message}</p>}

      {!isLoading && !error && (!summary || summary.total_orders === 0) && (
        <p className="text-gray-500">No completed sales found for this period.</p>
      )}

      {!isLoading && !error && summary && summary.total_orders > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{Math.round(summary.total_revenue).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_orders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{Math.round(avgOrderValue).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.unique_customers}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Revenue and orders by day</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No daily data for this period.</p>
              ) : (
                <div className="space-y-2">
                  {dailyData.map((row, index) => (
                    <div key={index} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0">
                      <span>{new Date(row.date).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">{row.total_orders} orders</span>
                      <span className="font-medium">₹{Math.round(row.total_revenue).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SalesReportPage;
