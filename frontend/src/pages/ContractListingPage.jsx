import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileText } from 'lucide-react';

// 2026-09-16: was hardcoded fake contract data (3 sample contract
// objects with invented farmers/values/statuses) with zero fetch/axios
// call anywhere in the file. Investigated a real backend the same way
// MarketplacePage.jsx's fix did:
// - `routes/strategic/contractFarmingRoutes.js` is a dead "Route
//   operational" scaffold and isn't even mounted in backend/src/index.js.
// - `services/strategic/contractFarmingService.js` has real,
//   DB-backed logic (getAvailableContractOpportunities(farmerId),
//   getBuyerContractPortfolio(buyerId)) that's conceptually close to
//   this page, but `services/index.js` requires it from the wrong path
//   (`./contractFarmingService` instead of
//   `./strategic/contractFarmingService`, confirmed by running the
//   require directly - throws `Cannot find module`), and no route or
//   controller anywhere calls either method - grepped
//   routes/+controllers/ directly, zero matches.
// - `services/legacy/ecommerceBusinessSalesService.js` has a real,
//   mounted `createContractFarming`/`recordContractMilestone` (at
//   `/api/ecommercebusinesssales/create-contract-farming`), but those
//   are write-only (create a contract, record a milestone) - there is
//   no GET/list endpoint anywhere in the codebase for browsing
//   available contracts, which is what this page needs.
// No reachable real backend for "browse contract listings" exists.
// Converted to an honest unavailable state rather than leaving the
// fabricated data or inventing a fake API call.
const ContractListingPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contract Listings</h1>
          <p className="text-muted-foreground">Browse and apply for farming contracts</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search contracts..." className="w-64" disabled />
          <Button disabled title="Contract browsing has no live backend yet">
            <FileText className="mr-2 h-4 w-4" />
            My Contracts
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live contract data isn't available yet</CardTitle>
          <CardDescription>
            Contract farming agreements can be created through the backend&apos;s contract
            farming service, but there is no endpoint yet for browsing or listing available
            contracts. This page will show real contract listings once that endpoint exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No contracts to display.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractListingPage;
