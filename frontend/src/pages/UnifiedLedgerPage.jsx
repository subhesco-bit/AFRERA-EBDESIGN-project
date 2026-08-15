import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { unifiedLedgerAPI } from '../services/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  RefreshCw,
  Plus,
  BarChart3
} from 'lucide-react'

function UnifiedLedgerPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEconomy, setSelectedEconomy] = useState('all')
  const [currency, setCurrency] = useState('INR')

  // Fetch all economy balances
  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ['unified-ledger-balances', currency],
    queryFn: async () => (await unifiedLedgerAPI.getAllEconomyBalances(currency)).data,
  })

  // Fetch ledger entries
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['unified-ledger-entries', selectedEconomy],
    queryFn: async () => (await unifiedLedgerAPI.getEntries({
      economy: selectedEconomy === 'all' ? undefined : selectedEconomy,
      limit: 50
    })).data,
  })

  // Fetch cross-economy transfers
  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ['unified-ledger-transfers'],
    queryFn: async () => (await unifiedLedgerAPI.getTransfers({ limit: 20 })).data,
  })

  // Reconciliation mutation
  const reconcileMutation = useMutation({
    mutationFn: () => unifiedLedgerAPI.reconcileCrossEconomy(),
    onSuccess: (data) => {
      toast.success(`Reconciliation complete: ${data.data.balanced} balanced, ${data.data.mismatched} mismatched`)
      queryClient.invalidateQueries({ queryKey: ['unified-ledger-transfers'] })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Reconciliation failed'),
  })

  const handleReconcile = () => {
    reconcileMutation.mutate()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getEconomyName = (code) => {
    const names = {
      north: 'Northern',
      south: 'Southern',
      east: 'Eastern',
      west: 'Western',
      central: 'Central',
      northeast: 'Northeastern',
      northwest: 'Northwestern',
      southeast: 'Southeastern',
      southwest: 'Southwestern',
    }
    return names[code] || code
  }

  const getEconomyColor = (code) => {
    const colors = {
      north: 'bg-blue-500',
      south: 'bg-green-500',
      east: 'bg-orange-500',
      west: 'bg-purple-500',
      central: 'bg-red-500',
      northeast: 'bg-teal-500',
      northwest: 'bg-cyan-500',
      southeast: 'bg-pink-500',
      southwest: 'bg-yellow-500',
    }
    return colors[code] || 'bg-gray-500'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified Ledger Management</h1>
          <p className="text-muted-foreground">One Ledger + 9 Economies - Hybrid Financial Architecture</p>
        </div>
        <div className="flex gap-2">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleReconcile} disabled={reconcileMutation.isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${reconcileMutation.isLoading ? 'animate-spin' : ''}`} />
            Reconcile
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="economies">Economies</TabsTrigger>
          <TabsTrigger value="transfers">Cross-Economy Transfers</TabsTrigger>
          <TabsTrigger value="entries">Ledger Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Unified Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Unified Balance (All Economies)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(balancesData?.unified?.totalCredits || 0)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Debits</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(balancesData?.unified?.totalDebits || 0)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(balancesData?.unified?.netBalance || 0)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">
                      {balancesData?.unified?.totalTransactions || 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Economy Balances Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balancesLoading ? (
              <div className="col-span-3 text-center py-8">Loading economy balances...</div>
            ) : (
              Object.entries(balancesData?.economies || {}).map(([economy, balance]) => (
                <Card key={economy}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getEconomyColor(economy)}`} />
                      {getEconomyName(economy)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Net Balance</span>
                        <span className="font-bold">{formatCurrency(balance.netBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Transactions</span>
                        <span className="text-sm">{balance.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          Credits
                        </span>
                        <span className="text-sm text-green-600">{formatCurrency(balance.totalCredits)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          Debits
                        </span>
                        <span className="text-sm text-red-600">{formatCurrency(balance.totalDebits)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="economies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Economy Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Economy</TableHead>
                    <TableHead>Net Balance</TableHead>
                    <TableHead>Total Credits</TableHead>
                    <TableHead>Total Debits</TableHead>
                    <TableHead>Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(balancesData?.economies || {}).map(([economy, balance]) => (
                      <TableRow key={economy}>
                        <TableCell className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getEconomyColor(economy)}`} />
                          {getEconomyName(economy)}
                        </TableCell>
                        <TableCell className={balance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(balance.netBalance)}
                        </TableCell>
                        <TableCell>{formatCurrency(balance.totalCredits)}</TableCell>
                        <TableCell>{formatCurrency(balance.totalDebits)}</TableCell>
                        <TableCell>{balance.totalTransactions}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Cross-Economy Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer ID</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading transfers...</TableCell>
                    </TableRow>
                  ) : transfersData?.transfers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No cross-economy transfers found</TableCell>
                    </TableRow>
                  ) : (
                    transfersData?.transfers?.map((transfer) => (
                      <TableRow key={transfer.transfer_id}>
                        <TableCell className="font-mono text-xs">{transfer.transfer_id.slice(0, 8)}...</TableCell>
                        <TableCell>{getEconomyName(transfer.from_economy)}</TableCell>
                        <TableCell>{getEconomyName(transfer.to_economy)}</TableCell>
                        <TableCell>{formatCurrency(transfer.amount)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transfer.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ledger Entries
                </div>
                <div className="flex gap-2">
                  <Select value={selectedEconomy} onValueChange={setSelectedEconomy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Economies</SelectItem>
                      <SelectItem value="north">Northern</SelectItem>
                      <SelectItem value="south">Southern</SelectItem>
                      <SelectItem value="east">Eastern</SelectItem>
                      <SelectItem value="west">Western</SelectItem>
                      <SelectItem value="central">Central</SelectItem>
                      <SelectItem value="northeast">Northeastern</SelectItem>
                      <SelectItem value="northwest">Northwestern</SelectItem>
                      <SelectItem value="southeast">Southeastern</SelectItem>
                      <SelectItem value="southwest">Southwestern</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Entry
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Economy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading entries...</TableCell>
                    </TableRow>
                  ) : entriesData?.entries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No ledger entries found</TableCell>
                    </TableRow>
                  ) : (
                    entriesData?.entries?.map((entry) => (
                      <TableRow key={entry.transaction_id}>
                        <TableCell className="font-mono text-xs">{entry.transaction_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getEconomyColor(entry.economy)}`} />
                            {getEconomyName(entry.economy)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.type === 'credit' ? 'bg-green-100 text-green-800' :
                            entry.type === 'debit' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {entry.type}
                          </span>
                        </TableCell>
                        <TableCell className={entry.amount.toString().includes('-') ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>{entry.category || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                        <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UnifiedLedgerPage
