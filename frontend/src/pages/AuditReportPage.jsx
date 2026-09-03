import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Download, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const AuditReportPage = () => {
  const [loading, setLoading] = useState(false)

  const auditData = {
    totalAudits: 156,
    passedAudits: 147,
    failedAudits: 3,
    pendingAudits: 6,
    securityScore: 95,
    complianceScore: 92,
    performanceScore: 88
  }

  const handleGenerate = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Report</h1>
          <p className="text-muted-foreground">System compliance and security audit results</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditData.totalAudits}</div>
            <p className="text-xs text-muted-foreground">Comprehensive checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{auditData.passedAudits}</div>
            <p className="text-xs text-muted-foreground">94% pass rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{auditData.failedAudits}</div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{auditData.pendingAudits}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Score</CardTitle>
            <CardDescription>Overall security assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{auditData.securityScore}%</div>
            <p className="text-sm text-muted-foreground mt-2">Excellent security posture</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
            <CardDescription>Regulatory compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{auditData.complianceScore}%</div>
            <p className="text-sm text-muted-foreground mt-2">GDPR compliant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance Score</CardTitle>
            <CardDescription>System performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">{auditData.performanceScore}%</div>
            <p className="text-sm text-muted-foreground mt-2">Good performance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuditReportPage