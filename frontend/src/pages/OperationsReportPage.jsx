import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download, Truck, Warehouse, Package, Clock } from 'lucide-react';

const OperationsReportPage = () => {
  const [view, setView] = useState('logistics');

  const operationsData = {
    totalShipments: 1250,
    onTimeDeliveries: 1180,
    averageDeliveryTime: 2.8,
    warehouseCapacity: 85,
    returns: 45,
    damaged: 12,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Operations Report</h1>
          <p className="text-muted-foreground">Logistics and warehouse performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="logistics">Logistics</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="returns">Returns</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData.totalShipments}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData.onTimeDeliveries}</div>
            <p className="text-xs text-green-600">94.4% on-time rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData.averageDeliveryTime}d</div>
            <p className="text-xs text-muted-foreground">Days to deliver</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouse Capacity</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData.warehouseCapacity}%</div>
            <p className="text-xs text-muted-foreground">Space utilization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
            <CardDescription>Product quality and damage analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Returns</span>
                <span className="font-bold">{operationsData.returns}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Damaged Items</span>
                <span className="font-bold text-red-600">{operationsData.damaged}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Return Rate</span>
                <span className="font-bold">3.6%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Damage Rate</span>
                <span className="font-bold text-orange-600">0.96%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrier Performance</CardTitle>
            <CardDescription>Logistics partner metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Primary Carrier</span>
                <span className="font-bold">Express Logistics</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">On-Time Rate</span>
                <span className="font-bold text-green-600">96.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cost per Shipment</span>
                <span className="font-bold">₹450</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Customer Rating</span>
                <span className="font-bold">4.7/5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperationsReportPage;
