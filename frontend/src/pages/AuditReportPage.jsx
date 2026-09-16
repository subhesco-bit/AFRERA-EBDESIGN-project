import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield } from 'lucide-react';

// 2026-09-16: was a hardcoded `auditData` object (`totalAudits: 156`,
// fabricated pass/fail/pending counts, fabricated security/compliance/
// performance percentage scores) plus a "Generate Report" button that
// just ran a fake `setTimeout`. Investigated a real backend:
// - `routes/auditRoutes.js` is real and mounted at `/api/audit`
//   (`GET /report` -> `auditService.generateAuditReport()`,
//   `GET /security` -> `getSecurityAudit()`,
//   `GET /compliance/:complianceType` -> `getComplianceAudit()`).
// - But its shape is completely different from what this page needs:
//   `generateAuditReport` returns real audit-log events grouped by user
//   or entity (event/success/failure counts per user), and
//   `getSecurityAudit` returns raw security-related log rows (logins,
//   failed logins, permission denials) - there is no pass/fail "audit"
//   count and no security/compliance/performance percentage score
//   anywhere in this service. Checked the full service file directly,
//   not assumed from the route names.
// This page's specific "156 audits, 3 score percentages" concept doesn't
// exist in the backend at all - it isn't a wiring gap, the metric itself
// was invented. Converted to an honest unavailable state and removed the
// fake "Generate Report" button (it never called a real API) rather than
// inventing a mapping from real audit-log data to a score that doesn't
// exist server-side.
const AuditReportPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Report</h1>
        <p className="text-muted-foreground">System compliance and security audit results</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Live audit score data isn&apos;t available yet
          </CardTitle>
          <CardDescription>
            The backend has a real audit log (event history, security events, compliance
            events) but no pass/fail audit counts or security/compliance/performance
            percentage scores - that scoring concept doesn&apos;t exist server-side yet. This
            page will show real figures once a matching endpoint is built.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No audit summary to display.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditReportPage;
