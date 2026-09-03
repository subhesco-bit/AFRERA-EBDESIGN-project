import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { FileText, Calendar, DollarSign, User, CheckCircle } from 'lucide-react'

const ContractListingPage = () => {
  const [contracts, setContracts] = useState([
    { id: 1, title: 'Organic Rice Cultivation', farmer: 'Green Valley Co-op', duration: '6 months', value: 250000, status: 'open' },
    { id: 2, title: 'Vegetable Supply Agreement', farmer: 'Sunrise Farms', duration: '12 months', value: 450000, status: 'open' },
    { id: 3, title: 'Dairy Production Contract', farmer: 'Organic Dairy Ltd', duration: '8 months', value: 320000, status: 'pending' }
  ])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contract Listings</h1>
          <p className="text-muted-foreground">Browse and apply for farming contracts</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search contracts..." className="w-64" />
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            My Contracts
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract) => (
          <Card key={contract.id}>
            <CardHeader>
              <CardTitle>{contract.title}</CardTitle>
              <CardDescription>by {contract.farmer}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {contract.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Value: ₹{contract.value.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Status: {contract.status}</span>
                </div>
                <Button className="w-full mt-4">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ContractListingPage