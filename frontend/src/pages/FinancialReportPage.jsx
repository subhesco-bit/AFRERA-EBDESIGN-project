import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Download, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import AIInsightsPanel from '../components/ui/AIInsightsPanel'
import { aiDecisionService } from '../services/aiDecisionService'

const FinancialReportPage = () => {
  const [period, setPeriod] = useState('monthly')

  const aiInsights = useMemo(
    () => [
      aiDecisionService.buildDecision({
        id: 'finance-cashflow-risk',
        title: 'Cash-flow protection recommendation',
        description: 'Collections are slowing in the current cycle, while loan servicing remains stable. Tightening disbursement timing may reduce working capital strain.',
        status: 'pending',
        confidence: 0.86,
        impact: 'high',
        category: 'finance',
        icon: '💰',
        severity: 'warning',
        metadata: { source: 'fallback', module: 'finance' },
        context: { period, gap: 'cash flow' },
        timestamp: new Date().toISOString()
      }),
      aiDecisionService.buildDecision({
        id: 'finance-margin-upside',
        title: 'Margin improvement opportunity',
        description: 'Service fees and loan interest are trending above recent norms. A targeted push on high-margin bundles can improve the current net margin further.',
        status: 'pending',
        confidence: 0.81,
        impact: 'medium',
        category: 'finance',
        icon: '📊',
        severity: 'info',
        metadata: { source: 'fallback', module: 'margin' },
        context: { margin: '35.4%' },
        timestamp: new Date().toISOString()
      })
    ],
    [period]
  )

  const handleApplyRecommendation = (insight) => {
    alert(`Applied recommendation: ${insight.title}`)
  }

  const financialData = {
    totalRevenue: 3250000,
    totalExpenses: 2100000,
    netProfit: 1150000,
    profitMargin: 35.4,
    revenueGrowth: 18.5,
    expenseGrowth: 12.3,
    cashFlow: 890000,
    outstandingLoans: 1450000,
    loanRepayments: 285000
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Report</h1>
          <p className="text-muted-foreground">Comprehensive financial performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <AIInsightsPanel
          insights={aiInsights}
          loading={false}
          onRefresh={() => window.location.reload()}
          onApplyRecommendation={handleApplyRecommendation}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{financialData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">+{financialData.revenueGrowth}% growth</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{financialData.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-orange-600">+{financialData.expenseGrowth}% increase</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{financialData.netProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{financialData.profitMargin}% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{financialData.cashFlow.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Positive cash flow</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Portfolio</CardTitle>
            <CardDescription>Outstanding loans and repayments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Outstanding Loans</span>
                <span className="font-bold">₹{financialData.outstandingLoans.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Repayments</span>
                <span className="font-bold">₹{financialData.loanRepayments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Borrowers</span>
                <span className="font-bold">245</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Default Rate</span>
                <span className="font-bold text-green-600">2.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Marketplace Sales</span>
                <span className="font-bold">₹1,850,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Fees</span>
                <span className="font-bold">₹680,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Loan Interest</span>
                <span className="font-bold">₹485,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Insurance Premiums</span>
                <span className="font-bold">₹235,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FinancialReportPage