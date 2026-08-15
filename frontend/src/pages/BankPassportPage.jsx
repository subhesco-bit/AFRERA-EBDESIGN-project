/**
 * Bank Passport — consent-gated, lender-ready evidence of a farmer's real
 * financial activity: wallet transaction history + issued eNWR (electronic
 * Negotiable Warehouse Receipt) collateral.
 *
 * Confirmed genuinely absent (2026-08-15 concept-document gap analysis):
 * the eNWR backend (services/recoveredFinanceService.js) was real and
 * complete, but only had an issue endpoint, no way to list what had been
 * issued, and zero frontend — the only prior reference was a marketing
 * sentence in FarmerEntranceHubPage.jsx with no functional binding.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { FileCheck, Wallet as WalletIcon, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { walletAPI, financeAPI } from '../services/api'

function formatInr(amount) {
  const n = Number(amount)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
}

export default function BankPassportPage() {
  const [consentGranted, setConsentGranted] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (consentGranted) load()
  }, [consentGranted])

  const load = async () => {
    setLoading(true)
    try {
      const [txRes, receiptsRes] = await Promise.all([
        walletAPI.getTransactions({ limit: 50 }),
        financeAPI.getMyEnwrReceipts(),
      ])
      setTransactions(txRes.data.data?.transactions || [])
      setReceipts(receiptsRes.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load Bank Passport data')
    } finally {
      setLoading(false)
    }
  }

  const totalCollateralInr = receipts
    .filter((r) => r.status === 'issued' || r.status === 'partially_released')
    .reduce((sum, r) => sum + Number(r.max_collateral_inr || 0), 0)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            Bank Passport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            The platform does not open your bank account. This page shows only what you choose to share:
            your real recorded wallet activity and any warehouse receipts (eNWR) you've been issued —
            evidence a lender can use, shared only when you explicitly consent below.
          </p>

          {!consentGranted ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <EyeOff className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 text-sm text-gray-700">
                Your Bank Passport is hidden by default. Nothing is shared or shown until you turn it on.
              </div>
              <Button onClick={() => setConsentGranted(true)}>
                <Eye className="w-4 h-4 mr-2" /> Show My Passport
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Eye className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 text-sm text-green-800">Passport visible. Turn off to hide it again.</div>
              <Button variant="outline" onClick={() => setConsentGranted(false)}>
                <EyeOff className="w-4 h-4 mr-2" /> Hide
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {consentGranted && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Warehouse Receipts (eNWR) — {formatInr(totalCollateralInr)} pledgeable collateral
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : receipts.length === 0 ? (
                <p className="text-gray-500 text-sm">No warehouse receipts issued yet.</p>
              ) : (
                <div className="space-y-3">
                  {receipts.map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{r.receipt_no}</div>
                        <div className="text-sm text-gray-500">
                          {r.commodity || 'Commodity not recorded'} · {r.quantity_qtl} qtl · status: {r.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">{formatInr(r.max_collateral_inr)}</div>
                        <div className="text-xs text-gray-500">of {formatInr(r.estimated_value_inr)} ({r.haircut_pct}% haircut)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WalletIcon className="w-5 h-5 text-purple-600" />
                Recent Wallet Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="text-gray-500 text-sm">No wallet transactions on record.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="capitalize text-gray-700">{tx.type} — {tx.description}</span>
                      <span className="font-medium text-gray-800">{formatInr(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
