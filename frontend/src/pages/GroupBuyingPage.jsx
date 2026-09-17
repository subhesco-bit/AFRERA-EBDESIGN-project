import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users } from 'lucide-react';

// 2026-09-16: was a hardcoded `groupBuys` array (3 fabricated campaigns
// with invented target/current quantities, discounts and end dates),
// zero fetch/axios anywhere. Investigated a real backend:
// - `services/legacy/buyingClubService.js` (`buying_clubs` /
//   `group_buying_orders` tables, real, DB-backed, exposed via
//   `setupRoutes` at `/api/v1/buying-clubs`) is the real "group buying"
//   feature in this codebase, and even already has a frontend client
//   (`buyingClubAPI`, `api.js`) - but every list-style endpoint it
//   exposes is scoped to a specific village or district
//   (`GET /clubs/village/:villageId`, `GET /clubs/district/:district`)
//   or a specific club (`GET /clubs/:clubId`, `GET /orders/club/:clubId`).
//   There is no "list all active group buys across the platform"
//   endpoint, which is what this page's flat campaign list needs -
//   checked the route file's full method list directly, not assumed.
// Rendering this page against the real API would mean guessing a
// village/district id to pass in, which isn't part of this page's design
// and would misrepresent one club's data as "all group buys". Converted
// to an honest unavailable state instead.
const GroupBuyingPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Group Buying</h1>
          <p className="text-muted-foreground">Join group purchases for better prices</p>
        </div>
        <Button disabled title="Group buy creation has no live backend for this view yet">
          <Users className="mr-2 h-4 w-4" />
          Create Group Buy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live group buy data isn&apos;t available yet</CardTitle>
          <CardDescription>
            The backend&apos;s buying-club system tracks group buys per village or district
            rather than as one platform-wide list, so this page can&apos;t show a flat feed of
            active group buys yet. It will be wired up once a matching endpoint exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active group buys to display.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupBuyingPage;
