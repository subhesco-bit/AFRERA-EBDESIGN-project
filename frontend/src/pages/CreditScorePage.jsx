import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { TrendingUp } from 'lucide-react';

// 2026-09-16: was a hardcoded `creditData` object (`score: 750`, fake
// factor percentages, fabricated recommendation text), zero fetch/axios
// anywhere. Investigated a real backend:
// - `services/aiService/creditRisk.js`'s `assessCreditRisk(farmerId)` is
//   real and DB-backed (queries `farmers`/`loans`, computes an actual
//   credit score + risk level from repayment history and FDI).
// - It's exposed by `services/aiService/router.js`
//   (`POST /assess/credit-risk`) and again by
//   `routes/claude/aiDecisionRoutes.js` (`POST /assess/credit-risk`) and
//   `routes/claude/financialAIRoutes.js` - but none of these routers are
//   ever mounted: grepped backend/src/index.js for every one of these
//   names/paths, zero matches. The dynamic route loader
//   (`core/dynamicRouteLoader.js`) explicitly skips the whole
//   `routes/claude/` directory with a comment claiming those routes are
//   "manually mounted" - that claim doesn't hold, nothing mounts them.
// So real, correct credit-scoring logic exists but isn't reachable by
// any live route today. Wiring the frontend to a URL that 404s would
// just swap one kind of fabrication for another. Converting a genuinely
// unmounted backend into a mounted one is backend route-wiring work
// outside this page-level fix's scope (and would touch
// backend/src/index.js, a shared file other agents are actively
// editing per .ai/tasks/AGENT_ASSIGNMENTS.md) - flagged here rather than
// done silently. Converted to an honest unavailable state instead of
// leaving the fabricated score or fabricating a fetch to a dead route.
const CreditScorePage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Score</h1>
          <p className="text-muted-foreground">Your creditworthiness assessment</p>
        </div>
        <Button variant="outline" disabled title="Credit scoring has no live, reachable backend yet">
          <TrendingUp className="mr-2 h-4 w-4" />
          Improve Score
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live credit score data isn&apos;t available yet</CardTitle>
          <CardDescription>
            Credit risk assessment logic exists in the backend, but it isn&apos;t connected to
            any live API route yet, so there&apos;s no real score to show. This page will
            display your real assessment once that route is wired up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No credit score data to display.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditScorePage;
