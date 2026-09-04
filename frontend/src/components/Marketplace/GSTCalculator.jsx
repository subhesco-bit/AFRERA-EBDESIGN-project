/**
 * GST Calculator Component
 * Calculates GST for products and orders
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { marketplaceAPI } from '../../services/componentApi';

// FE-02 note: not resolved here. All three calculations are triggered by a
// user clicking a button over form state or an orderId prop already passed
// in — there's no fixed dataset to prop-drill, and no current parent page
// renders this component (unmounted as of 2026-08-07). FE-01 (routing
// through api.js) is fixed below.
const GSTCalculator = ({ orderId, productId }) => {
  const [loading, setLoading] = useState(false);
  const [gstData, setGstData] = useState(null);
  const [product, setProduct] = useState({
    name: '',
    price: 0,
    category: 'vegetables',
  });

  const categories = [
    { value: 'fruits', label: 'Fruits (0%)', rate: 0 },
    { value: 'vegetables', label: 'Vegetables (0%)', rate: 0 },
    { value: 'cereals', label: 'Cereals (0%)', rate: 0 },
    { value: 'pulses', label: 'Pulses (0%)', rate: 0 },
    { value: 'processed_food', label: 'Processed Food (5%)', rate: 5 },
    { value: 'spices', label: 'Spices (5%)', rate: 5 },
    { value: 'dairy_products', label: 'Dairy Products (12%)', rate: 12 },
    { value: 'packaged_food', label: 'Packaged Food (18%)', rate: 18 },
    { value: 'beverages', label: 'Beverages (18%)', rate: 18 },
  ];

  // All three GST endpoints are protected by authMiddleware on the backend.
  // This component previously sent no Authorization header (-> 401), so none
  // of them could ever succeed. Routing through the named marketplace client
  // fixes that.
  const calculateProductGST = async () => {
    setLoading(true);
    try {
      const response = await marketplaceAPI.calculateProductGST(product);
      setGstData(response.data.data);
    } catch (error) {
      console.error('Error calculating GST:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderGST = async () => {
    setLoading(true);
    try {
      const response = await marketplaceAPI.calculateOrderGST(orderId);
      setGstData(response.data.data);
    } catch (error) {
      console.error('Error calculating order GST:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    setLoading(true);
    try {
      const response = await marketplaceAPI.generateGstInvoice(orderId);
      alert(`Invoice Generated: ${response.data.data.invoiceNumber}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GST Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Product Name</Label>
            <Input
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              placeholder="Enter product name"
            />
          </div>
          <div>
            <Label>Price (₹)</Label>
            <Input
              type="number"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
              placeholder="Enter price"
            />
          </div>
        </div>

        <div>
          <Label>Category</Label>
          <Select value={product.category} onValueChange={(value) => setProduct({ ...product, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateProductGST} disabled={loading}>
            Calculate Product GST
          </Button>
          {orderId && (
            <>
              <Button onClick={calculateOrderGST} variant="outline" disabled={loading}>
                Calculate Order GST
              </Button>
              <Button onClick={generateInvoice} variant="secondary" disabled={loading}>
                Generate Invoice
              </Button>
            </>
          )}
        </div>

        {gstData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">GST Calculation Result</h3>
            <Table aria-label="GST breakdown by line item">
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>GST Rate</TableHead>
                  <TableHead>GST Amount</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{product.name || 'Order Items'}</TableCell>
                  <TableCell>₹{gstData.basePrice || gstData.totalSales?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{gstData.gstRate || '18%'}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">₹{gstData.gstAmount || gstData.totalGST}</TableCell>
                  <TableCell className="font-bold">₹{gstData.totalPrice || (parseFloat(gstData.totalSales || 0) + parseFloat(gstData.totalGST || 0)).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {gstData.gstBreakdown && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">GST Breakdown</h4>
                {gstData.gstBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1 border-b">
                    <span>{item.category}</span>
                    <span>₹{item.gstAmount.toFixed(2)} ({item.gstRate}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GSTCalculator;
