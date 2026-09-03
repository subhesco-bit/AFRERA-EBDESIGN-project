import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { logisticsAPI } from '../services/api'
import { Truck, PackageCheck, AlertCircle, MapPinned, RefreshCw, ArrowUpRight, Thermometer, Clock3 } from 'lucide-react'

export default function SupplyChainAnalyticsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const shipmentsQuery = useQuery({
    queryKey: ['supply-chain-shipments', statusFilter],
    queryFn: () => logisticsAPI.getShipments(statusFilter === 'all' ? {} : { status: statusFilter }, { page: 1, limit: 50 }).then((response) => response.data),
    refetchInterval: 120000,
  })

  const shipments = shipmentsQuery.data?.shipments || shipmentsQuery.data?.items || []
  const activeShipments = shipments.filter((shipment) => !['delivered', 'cancelled'].includes(shipment.status))
  const delayedShipments = shipments.filter((shipment) => ['delayed', 'at_risk', 'exception'].includes(shipment.status))
  const deliveredShipments = shipments.filter((shipment) => shipment.status === 'delivered')
  const onTimeRate = shipments.length ? Math.round((deliveredShipments.length / shipments.length) * 100) : 0
  const statusOptions = ['all', 'pending', 'in_transit', 'delayed', 'delivered']

  return (
    <div className="min-h-screen bg-v42-paddy2 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300"><Truck className="h-4 w-4" /> Commerce control tower</div>
              <h1 className="text-3xl font-bold sm:text-4xl">Supply chain command</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Coordinate farm pickup, warehouse movement, cold-chain integrity, and customer delivery from one operational view.</p>
            </div>
            <button type="button" onClick={() => shipmentsQuery.refetch()} className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><RefreshCw className="mr-2 h-4 w-4" /> Refresh network</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Active shipments', activeShipments.length, Truck, 'text-cyan-700'],
            ['Exceptions', delayedShipments.length, AlertCircle, 'text-red-700'],
            ['Delivered', deliveredShipments.length, PackageCheck, 'text-emerald-700'],
            ['Delivery completion', `${onTimeRate}%`, Clock3, 'text-amber-700'],
          ].map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-xl border border-v42-line bg-white p-5 shadow-sm"><div className={`flex items-center gap-2 text-sm font-medium ${color}`}><Icon className="h-5 w-5" /> {label}</div><div className="mt-3 text-3xl font-bold text-v42-ink">{value}</div></div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-v42-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-v42-ink">Network movement</h2><p className="text-sm text-v42-mut">Live shipment records scoped to your authenticated account.</p></div>
          <div className="flex flex-wrap gap-2">{statusOptions.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${statusFilter === status ? 'bg-slate-900 text-white' : 'bg-v42-paddy2 text-v42-ink2 hover:bg-slate-100'}`}>{status.replace('_', ' ')}</button>)}</div>
        </div>

        {shipmentsQuery.isLoading && <div className="rounded-xl border border-v42-line bg-white p-10 text-center text-v42-mut">Loading network movement...</div>}
        {shipmentsQuery.isError && <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load shipment operations: {shipmentsQuery.error.message}</div>}
        {!shipmentsQuery.isLoading && !shipmentsQuery.isError && shipments.length === 0 && <div className="rounded-xl border border-v42-line bg-white p-10 text-center text-v42-mut">No shipments match this operating view.</div>}
        {!shipmentsQuery.isLoading && !shipmentsQuery.isError && shipments.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-xl border border-v42-line bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-v42-ink">Shipment control board</h2><span className="text-sm text-v42-mut">{shipments.length} records</span></div>
              <div className="space-y-3">{shipments.map((shipment) => <div key={shipment.id} className="rounded-xl border border-v42-line p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-v42-ink">{shipment.shipment_number || shipment.tracking_number || `Shipment ${shipment.id}`}</div><div className="mt-1 flex flex-wrap gap-3 text-sm text-v42-mut"><span className="inline-flex items-center gap-1"><MapPinned className="h-4 w-4" />{shipment.origin || shipment.pickup_location || 'Origin pending'} to {shipment.destination || shipment.delivery_location || 'Destination pending'}</span><span className="inline-flex items-center gap-1"><Thermometer className="h-4 w-4" />{shipment.temperature_status || 'Cold-chain monitored'}</span></div></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${delayedShipments.includes(shipment) ? 'bg-red-100 text-red-700' : shipment.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'}`}>{shipment.status || 'pending'}</span><ArrowUpRight className="h-4 w-4 text-v42-mut" /></div></div></div>)}</div>
            </div>
            <div className="rounded-xl bg-slate-900 p-5 text-white shadow-sm"><h2 className="text-lg font-semibold">Operational priorities</h2><div className="mt-5 space-y-4"><div className="border-b border-slate-700 pb-4"><div className="text-sm text-slate-400">Exception queue</div><div className="mt-1 text-2xl font-bold">{delayedShipments.length} routes</div><p className="mt-1 text-sm text-slate-300">Review delays before the next customer promise window.</p></div><div className="border-b border-slate-700 pb-4"><div className="text-sm text-slate-400">Cold-chain coverage</div><div className="mt-1 text-2xl font-bold">{activeShipments.length ? 'Active' : 'Standby'}</div><p className="mt-1 text-sm text-slate-300">Temperature and handoff status should be confirmed at each node.</p></div><div><div className="text-sm text-slate-400">Decision source</div><div className="mt-1 font-semibold">Live logistics records</div><p className="mt-1 text-sm text-slate-300">Recommendations must be reviewed against real route and inventory state.</p></div></div></div>
          </div>
        )}
      </div>
    </div>
  )
}