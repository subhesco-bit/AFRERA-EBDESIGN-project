import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShoppingCart, Package, Check, Clock } from 'lucide-react';

const BulkPurchasePage = () => {
  const [step, setStep] = useState(1);
  const [orderData, setOrderData] = useState({
    products: [],
    quantity: 0,
    deliveryDate: '',
    specialInstructions: '',
  });

  const sampleProducts = [
    { id: 1, name: 'Organic Rice', price: 45, unit: 'kg', minOrder: 100 },
    { id: 2, name: 'Fresh Tomatoes', price: 30, unit: 'kg', minOrder: 50 },
    { id: 3, name: 'Organic Wheat', price: 40, unit: 'kg', minOrder: 100 },
  ];

  const handleAddProduct = (product) => {
    setOrderData(prev => ({
      ...prev,
      products: [...prev.products, { ...product, quantity: product.minOrder }],
    }));
  };

  const handleQuantityChange = (productId, quantity) => {
    setOrderData(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === productId ? { ...p, quantity } : p,
      ),
    }));
  };

  const calculateTotal = () => {
    return orderData.products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bulk Purchase</h1>
          <p className="text-muted-foreground">Order agricultural products in bulk quantities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            View Catalog
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && <div className="flex-1 h-1 mx-2 bg-muted" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
            <CardDescription>Choose products and specify quantities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">₹{product.price}/{product.unit} | Min: {product.minOrder} {product.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={product.minOrder}
                      placeholder="Qty"
                      className="w-24"
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                    />
                    <Button onClick={() => handleAddProduct(product)} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your bulk order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderData.products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No products selected
                </p>
              ) : (
                <>
                  {orderData.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{product.name} x {product.quantity} {product.unit}</span>
                      <span className="font-medium">₹{product.price * product.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkPurchasePage;
