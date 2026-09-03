import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Download, Users, TrendingUp, Award, MapPin } from 'lucide-react'

const FarmerReportPage = () => {
  const [region, setRegion] = useState('all')

  const farmerData = {
    totalFarmers: 1250,
    activeFarmers: 1180,
    averageFDI: 72.5,
    certifiedFarmers: 890,
    topPerformers: [
      { name: 'Rajesh Kumar', fdi: 95, village: 'Green Valley', revenue: 450000 },
      { name: 'Priya Singh', fdi: 92, village: 'Sunrise Farm', revenue: 420000 },
      { name: 'Amit Patel', fdi: 89, village: 'Organic Fields', revenue: 380000 }
    ],
    regionalBreakdown: [
      { region: 'Assam', farmers: 320, avgFDI: 75 },
      { region: 'Meghalaya', farmers: 280, avgFDI: 70 },
      { region: 'Nagaland', farmers: 250, avgFDI: 68 },
      { region: 'Manipur', farmers: 220, avgFDI: 72 },
      { region: 'Mizoram', farmers: 180, avgFDI: 78 }
    ]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Farmer Report</h1>
          <p className="text-muted-foreground">Farmer performance and demographics analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="assam">Assam</SelectItem>
              <SelectItem value="meghalaya">Meghalaya</SelectItem>
              <SelectItem value="nagaland">Nagaland</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerData.totalFarmers}</div>
            <p className="text-xs text-muted-foreground">Registered farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerData.activeFarmers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg FDI Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerData.averageFDI}</div>
            <p className="text-xs text-muted-foreground">Farmer Development Index</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certified</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerData.certifiedFarmers}</div>
            <p className="text-xs text-muted-foreground">Organic certified</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Farmers</CardTitle>
            <CardDescription>Highest FDI scores and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {farmerData.topPerformers.map((farmer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{farmer.name}</p>
                    <p className="text-sm text-muted-foreground">{farmer.village}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">FDI: {farmer.fdi}</p>
                    <p className="text-sm text-muted-foreground">₹{farmer.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Breakdown</CardTitle>
            <CardDescription>Farmer distribution by region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {farmerData.regionalBreakdown.map((region, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-muted-foreground">{region.farmers} farmers</p>
                  </div>
                  <p className="font-bold">Avg FDI: {region.avgFDI}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FarmerReportPage