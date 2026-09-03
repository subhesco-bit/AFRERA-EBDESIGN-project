/**
 * Escrow Management Page.
 *
 * Provides UI for managing escrow transactions between buyers and farmers.
 * Backs services/legacy/escrowService.js — real, DB-backed fund holding
 * until delivery confirmation.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Shield, CheckCircle, Clock, AlertCircle, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { escrowAPI } from '../services/api';

function formatInr(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
}

export default function EscrowPage() {
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEscrowTransactions();
  }, []);

  const loadEscrowTransactions = async () => {
    setLoading(true);
    try {
      const response = await escrowAPI.list();
      setEscrowTransactions(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load escrow transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (e) => {
    e.preventDefault();
    if (!selectedEscrow) return;
    
    setSubmitting(true);
    try {
      await escrowAPI.release(selectedEscrow.escrow_id, { notes: releaseNotes });
      toast.success('Escrow released successfully');
      setShowReleaseForm(false);
      setSelectedEscrow(null);
      setReleaseNotes('');
      loadEscrowTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to release escrow');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async (escrowId) => {
    if (!confirm('Are you sure you want to refund this escrow transaction?')) return;
    
    try {
      await escrowAPI.refund(escrowId);
      toast.success('Escrow refunded successfully');
      loadEscrowTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to refund escrow');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      released: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800'
    };
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      released: <CheckCircle className="w-3 h-3" />,
      refunded: <AlertCircle className="w-3 h-3" />,
      disputed: <AlertCircle className="w-3 h-3" />
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading escrow transactions...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Escrow Management
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Held</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatInr(escrowTransactions
                    .filter(e => e.status === 'pending')
                    .reduce((sum, e) => sum + Number(e.amount), 0)
                  )}
                </div>
              </div>
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {escrowTransactions.filter(e => e.status === 'pending').length}
                </div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Released</div>
                <div className="text-2xl font-bold text-green-600">
                  {escrowTransactions.filter(e => e.status === 'released').length}
                </div>
              </div>
              <Unlock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Refunded</div>
                <div className="text-2xl font-bold text-red-600">
                  {escrowTransactions.filter(e => e.status === 'refunded').length}
                </div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Release Form Modal */}
      {showReleaseForm && selectedEscrow && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Release Escrow Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-bold">{formatInr(selectedEscrow.amount)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Order ID:</span>
                <span className="font-medium">{selectedEscrow.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Farmer ID:</span>
                <span className="font-medium">{selectedEscrow.farmer_id}</span>
              </div>
            </div>
            <form onSubmit={handleRelease} className="space-y-4">
              <div>
                <Label htmlFor="releaseNotes">Release Notes</Label>
                <textarea
                  id="releaseNotes"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Reason for release (e.g., delivery confirmed)"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Confirm Release'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReleaseForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Escrow Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {escrowTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No escrow transactions found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escrow ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Buyer ID</TableHead>
                  <TableHead>Farmer ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escrowTransactions.map((escrow) => (
                  <TableRow key={escrow.escrow_id}>
                    <TableCell className="font-mono text-sm">{escrow.escrow_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-sm">{escrow.order_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="font-bold">{formatInr(escrow.amount)}</TableCell>
                    <TableCell className="font-mono text-sm">{escrow.buyer_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-sm">{escrow.farmer_id?.slice(0, 8)}...</TableCell>
                    <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                    <TableCell className="text-sm">
                      {escrow.created_at ? new Date(escrow.created_at).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                    <TableCell>
                      {escrow.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedEscrow(escrow);
                              setShowReleaseForm(true);
                            }}
                          >
                            Release
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRefund(escrow.escrow_id)}
                          >
                            Refund
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}