/**
 * Farmer Wallet Page.
 *
 * Backs services/farmerService.js's wallet functions — real, DB-backed,
 * transactional (row-level locking + ordered-lock transfer to prevent
 * overdraft/deadlock). Found with a complete backend + routes but no
 * frontend page anywhere in the app.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Send, Landmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { walletAPI } from '../services/api';

function formatInr(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null); // null | 'deposit' | 'withdraw' | 'transfer'
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [bankAccount, setBankAccount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions({ limit: 20 }),
      ]);
      setWallet(walletRes.data.data);
      setTransactions(txRes.data.data?.transactions || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveForm(null);
    setAmount('');
    setBankAccount('');
    setRecipientId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      if (activeForm === 'deposit') {
        await walletAPI.deposit({ amount: Number(amount), paymentMethod });
        toast.success('Deposit successful');
      } else if (activeForm === 'withdraw') {
        if (!bankAccount) { toast.error('Bank account is required'); setSubmitting(false); return; }
        await walletAPI.withdraw({ amount: Number(amount), bankAccount });
        toast.success('Withdrawal successful');
      } else if (activeForm === 'transfer') {
        if (!recipientId) { toast.error('Recipient is required'); setSubmitting(false); return; }
        await walletAPI.transfer({ recipientId, amount: Number(amount), description: 'Wallet transfer' });
        toast.success('Transfer successful');
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading wallet...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-600" />
            My Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{formatInr(wallet?.balance)}</div>
          <div className="text-sm text-gray-500 mt-1">Status: {wallet?.status || 'active'} · {wallet?.currency || 'INR'}</div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={() => setActiveForm('deposit')} className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" /> Deposit
            </Button>
            <Button variant="outline" onClick={() => setActiveForm('withdraw')} className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" /> Withdraw
            </Button>
            <Button variant="outline" onClick={() => setActiveForm('transfer')} className="flex items-center gap-2">
              <Send className="w-4 h-4" /> Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeForm && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{activeForm}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              {activeForm === 'deposit' && (
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              )}

              {activeForm === 'withdraw' && (
                <div>
                  <Label htmlFor="bankAccount" className="flex items-center gap-1"><Landmark className="w-4 h-4" /> Bank Account</Label>
                  <Input id="bankAccount" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Linked bank account number" required />
                </div>
              )}

              {activeForm === 'transfer' && (
                <div>
                  <Label htmlFor="recipientId">Recipient Farmer ID</Label>
                  <Input id="recipientId" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required />
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>{submitting ? 'Processing...' : 'Confirm'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="capitalize">{tx.type}</TableCell>
                    <TableCell>{formatInr(tx.amount)}</TableCell>
                    <TableCell>{formatInr(tx.balance_after)}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className="capitalize">{tx.status}</TableCell>
                    <TableCell>{tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : '—'}</TableCell>
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
