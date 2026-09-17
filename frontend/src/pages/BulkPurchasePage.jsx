import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package } from 'lucide-react';

// 2026-09-16: was a hardcoded `sampleProducts` array (fixed price/unit/
// minOrder per product) driving a fake cart-and-checkout flow, zero
// fetch/axios anywhere. Investigated a real backend:
// - A real, mounted bulk-order backend exists
//   (`routes/bulkOrderRoutes.js` -> `controllers/bulkOrderController.js`
//   -> `services/legacy/bulkOrderService.js`, live at `/api/bulkorder`),
//   already wired to a *different* page via `bulkOrderAPI` - but it's an
//   RFQ/quotation workflow (buyer creates a bulk order request, sellers
//   submit quotations, buyer accepts one), not a flat product catalog
//   with fixed prices/minimum order quantities and a cart/checkout the
//   way this page is built. There is no "list purchasable products with
//   a minimum order quantity" endpoint anywhere - checked
//   bulkOrderController.js's full method list directly.
// - The real product catalog (`productAPI.getProducts`, verified in
//   MarketplacePage.jsx) has no `minOrder` field and isn't itself a bulk
//   ordering flow.
// This page's specific catalog+cart+checkout shape has no matching real
// backend. Converted to an honest unavailable state rather than
// reshaping it into a different feature or inventing a fake API call.
const BulkPurchasePage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bulk Purchase</h1>
          <p className="text-muted-foreground">Order agricultural products in bulk quantities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled title="Bulk purchase catalog has no live backend yet">
            <Package className="mr-2 h-4 w-4" />
            View Catalog
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live bulk purchase data isn&apos;t available yet</CardTitle>
          <CardDescription>
            The backend supports bulk ordering as a quotation-based workflow (request a
            quote, review seller quotations, accept one) rather than a fixed-price catalog
            with a cart. This page will be rebuilt against that real workflow, or a matching
            catalog endpoint, once one is available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No products to display.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkPurchasePage;
