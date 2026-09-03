import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp,
  Users,
  DollarSign,
  Package,
  BarChart3
} from 'lucide-react'

const ReportsDashboardPage = () => {
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)

  const reportCategories = [
    {
      id: 'sales',
      name: 'Sales Reports',
      icon: DollarSign,
      reports: [
        { id: 'daily-sales', name: 'Daily Sales Report', description: 'Daily sales performance metrics' },
        { id: 'weekly-sales', name: 'Weekly Sales Report', description: 'Weekly sales trends and analysis' },
        { id: 'monthly-sales', name: 'Monthly Sales Report', description: 'Monthly sales comprehensive report' },
        { id: 'quarterly-sales', name: 'Quarterly Sales Report', description: 'Quarterly sales performance review' }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory Reports',
      icon: Package,
      reports: [
        { id: 'stock-level', name: 'Stock Level Report', description: 'Current inventory status' },
        { id: 'stock-movement', name: 'Stock Movement Report', description: 'Inventory flow analysis' },
        { id: 'low-stock', name: 'Low Stock Alert', description: 'Items below minimum threshold' },
        { id: 'valuation', name: 'Inventory Valuation', description: 'Total inventory value' }
      ]
    },
    {
      id: 'farmer',
      name: 'Farmer Reports',
      icon: Users,
      reports: [
        { id: 'farmer-performance', name: 'Farmer Performance', description: 'Individual farmer metrics' },
        { id: 'fpo-summary', name: 'FPO Summary', description: 'FPO collective performance' },
        { id: 'crop-yield', name: 'Crop Yield Analysis', description: 'Yield statistics by crop' },
        { id: 'quality-report', name: 'Quality Report', description: 'Product quality metrics' }
      ]
    },
    {
      id: 'financial',
      name: 'Financial Reports',
      icon: TrendingUp,
      reports: [
        { id: 'revenue', name: 'Revenue Report', description: 'Revenue breakdown and analysis' },
        { id: 'expense', name: 'Expense Report', description: 'Operating expenses detail' },
        { id: 'profit-loss', name: 'Profit & Loss', description: 'P&L statement' },
        { id: 'cash-flow', name: 'Cash Flow', description: 'Cash flow analysis' }
      ]
    },
    {
      id: 'operations',
      name: 'Operations Reports',
      icon: BarChart3,
      reports: [
        { id: 'logistics', name: 'Logistics Report', description: 'Supply chain performance' },
        { id: 'warehouse', name: 'Warehouse Report', description: 'Storage and operations' },
        { id: 'delivery', name: 'Delivery Report', description: 'Delivery performance metrics' },
        { id: 'returns', name: 'Returns Report', description: 'Product returns analysis' }
      ]
    }
  ]

  const handleGenerateReport = (reportId) => {
    setLoading(true)
    // Simulate report generation
    setTimeout(() => {
      setLoading(false)
      setSelectedReport(reportId)
    }, 1500)
  }

  const handleDownload = (format) => {
    // Simulate download
    console.log(`Downloading report in ${format} format`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports Dashboard</h1>
          <p className="text-muted-foreground">Generate and manage comprehensive reports</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-auto"
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-auto"
          />
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => (
          <Card key={category.id} className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                {category.name}
              </CardTitle>
              <CardDescription>{category.reports.length} reports available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleGenerateReport(report.id)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>Preview of generated report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => handleDownload('pdf')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => handleDownload('excel')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
              <Button onClick={() => handleDownload('csv')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
            <div className="border rounded-lg p-4 min-h-[400px] bg-muted/50">
              <p className="text-center text-muted-foreground">Report preview will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReportsDashboardPage