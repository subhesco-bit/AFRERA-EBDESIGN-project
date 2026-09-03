import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Users, Clock, Target, CheckCircle } from 'lucide-react'

const GroupBuyingPage = () => {
  const [groupBuys, setGroupBuys] = useState([
    { id: 1, title: 'Organic Fertilizers Group Buy', targetQuantity: 5000, currentQuantity: 3200, endDate: '2026-09-15', discount: 15, status: 'active' },
    { id: 2, title: 'Seeds Bulk Purchase', targetQuantity: 2000, currentQuantity: 1800, endDate: '2026-09-20', discount: 20, status: 'active' },
    { id: 3, title: 'Farm Equipment Group Buy', targetQuantity: 50, currentQuantity: 25, endDate: '2026-09-30', discount: 10, status: 'active' }
  ])

  const getProgress = (current, target) => {
    return Math.round((current / target) * 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Group Buying</h1>
          <p className="text-muted-foreground">Join group purchases for better prices</p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Create Group Buy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupBuys.map((groupBuy) => (
          <Card key={groupBuy.id}>
            <CardHeader>
              <CardTitle>{groupBuy.title}</CardTitle>
              <CardDescription>
                {groupBuy.discount}% discount when target reached
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{getProgress(groupBuy.currentQuantity, groupBuy.targetQuantity)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${getProgress(groupBuy.currentQuantity, groupBuy.targetQuantity)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Target: {groupBuy.targetQuantity} units</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Ends: {groupBuy.endDate}</span>
                </div>
                <Button className="w-full">
                  Join Group Buy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default GroupBuyingPage