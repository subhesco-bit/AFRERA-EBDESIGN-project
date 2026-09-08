import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Shield, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { auditComplianceAPI } from '../services/api';

const toCsv = (report) => {
  const rows = [['Metric', 'Value'], ...Object.entries(report || {}).filter(([, v]) => typeof v !== 'object')];
  return rows.map((row) => row.join(',')).join('\n');
};

const AuditReportPage = () => {
  const [state, setState] = useState({ loading: true, error: null, report: null, anomalies: [] });
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    Promise.all([
      auditComplianceAPI.generateComplianceReport({ reportType: 'summary' }),
      auditComplianceAPI.detectAuditAnomalies({}),
    ])
      .then(([reportRes, anomaliesRes]) => {
        setState({
          loading: false,
          error: null,
          report: reportRes.data?.data || reportRes.data || null,
          anomalies: anomaliesRes.data?.data || anomaliesRes.data || [],
        });
      })
      .catch((error) => {
        setState({ loading: false, error: error.message || 'Audit report could not be loaded.', report: null, anomalies: [] });
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = () => {
    setGenerating(true);
    auditComplianceAPI.generateComplianceReport({ reportType: 'detailed' })
      .then((res) => {
        setState((prev) => ({ ...prev, report: res.data?.data || res.data || prev.report }));
      })
      .catch(() => { /* surfaced via retry state below */ })
      .finally(() => setGenerating(false));
  };

  const handleExport = () => {
    if (!state.report) return;
    const csv = toCsv(state.report);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (state.loading) {
    return <div className="container mx-auto p-6" aria-busy="true"><p>Loading audit report...</p></div>;
  }

  if (state.error) {
    return (
      <div className="container mx-auto p-6">
        <p role="alert" className="text-red-600">{state.error}</p>
        <Button type="button" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
      </div>
    );
  }

  const report = state.report || {};
  const totalLogs = report.totalLogs ?? 0;
  const uniqueUsers = report.uniqueUsers ?? 0;
  const uniqueEntities = report.uniqueEntities ?? 0;
  const criticalAnomalies = state.anomalies.filter((a) => a.severity === 'critical').length;
  const warningAnomalies = state.anomalies.filter((a) => a.severity !== 'critical').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Report</h1>
          <p className="text-muted-foreground">System compliance and security audit results, from the audit compliance service</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!state.report}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audit Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">Recorded in period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Distinct actors logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAnomalies}</div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Anomalies</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{warningAnomalies}</div>
            <p className="text-xs text-muted-foreground">Below critical threshold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Actions</CardTitle>
            <CardDescription>Most frequent audited actions in the reporting period</CardDescription>
          </CardHeader>
          <CardContent>
            {report.topActions?.length ? (
              <ul className="space-y-2">
                {report.topActions.map((item) => (
                  <li key={item.action} className="flex justify-between text-sm">
                    <span>{item.action}</span>
                    <span className="font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No actions recorded for this period.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
            <CardDescription>Unusual audit-log patterns flagged by the audit service</CardDescription>
          </CardHeader>
          <CardContent>
            {state.anomalies.length ? (
              <ul className="space-y-2">
                {state.anomalies.map((a, index) => (
                  <li key={`${a.type}-${a.userId || index}`} className="text-sm">
                    <span className={a.severity === 'critical' ? 'text-red-600 font-medium' : 'text-orange-600 font-medium'}>
                      {a.severity}
                    </span>
                    {' — '}{a.type} {a.userId ? `(user ${a.userId})` : ''} {a.count ? `x${a.count}` : ''}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No anomalies detected.</p>}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Entities covered in this period: {uniqueEntities}. Uses the audit-compliance service's summary report and
        threshold-based anomaly detection — a human reviewer should assess flagged items before acting on them.
      </p>
    </div>
  );
};

export default AuditReportPage;
