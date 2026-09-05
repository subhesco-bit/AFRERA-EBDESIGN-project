/**
 * Farmer Revenue Ledger Page.
 *
 * Provides UI for viewing farmer revenue data that powers the Farmer Value Engine.
 * Backs services/legacy/farmerValueService.js's getSeasonLedger function.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { farmerValueAPI } from '../services/api';

function formatInr(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
}

export default function FarmerRevenueLedgerPage() {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState('');
  const [year, setYear] = useState('');
  const [currentSeason, setCurrentSeason] = useState('');

  useEffect(() => {
    loadLedger();
    setCurrentSeason(getCurrentSeason());
  }, []);

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    if (month >= 10 && month <= 11) return 'winter';
    return 'spring';
  };

  const loadLedger = async () => {
    setLoading(true);
    try {
      const response = await farmerValueAPI.getSeasonLedger({
        season: season || undefined,
        year: year ? parseInt(year) : undefined,
      });
      setLedger(response.data.data);
    } catch (error) {
      toast.error('Failed to load revenue ledger');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitMargin = () => {
    if (!ledger) return 0;
    const netRevenue = Number(ledger.revenue?.net_revenue || 0);
    const netCost = Number(ledger.cost?.net_cost || 0);
    if (netCost === 0) return 0;
    return ((netRevenue - netCost) / netCost) * 100;
  };

  const calculateROI = () => {
    if (!ledger) return 0;
    let netRevenue = Number(ledger.revenue?.net_revenue || 0);
    let netCost = Number(ledger.cost?.net_cost || 0);
    if (netCost === 0) return 0;
    return ((netRevenue - netCost) / netCost) * 100;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading revenue ledger...</div>;
  }

  const profitMargin = calculateProfitMargin();
  const roi = calculateROI();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Farmer Revenue Ledger
        </h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter by Season
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="season">Season</Label>
              <select
                id="season"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value="">All Seasons</option>
                <option value="summer">Summer (Kharif)</option>
                <option value="monsoon">Monsoon</option>
                <option value="winter">Winter (Rabi)</option>
                <option value="spring">Spring</option>
              </select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g., 2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadLedger} className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Net Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatInr(ledger?.revenue?.net_revenue)}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Net Cost</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatInr(ledger?.cost?.net_cost)}
                </div>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Profit Margin</div>
                <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">ROI</div>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.toFixed(1)}%
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Gross Cost</span>
              <span className="font-bold">{formatInr(ledger?.cost?.gross_cost)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Subsidy Received</span>
              <span className="font-bold text-green-600">-{formatInr(ledger?.cost?.subsidy_received)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="font-semibold text-gray-800">Net Cost</span>
              <span className="font-bold text-blue-600">{formatInr(ledger?.cost?.net_cost)}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Cost line items: {ledger?.cost?.line_count || 0}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Gross Revenue</span>
              <span className="font-bold">{formatInr(ledger?.revenue?.gross_revenue)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Quantity Sold</span>
              <span className="font-bold">{ledger?.revenue?.quantity_sold_kg?.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-600">Pending Payments</span>
              <span className="font-bold text-yellow-600">{formatInr(ledger?.revenue?.pending_amount)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="font-semibold text-gray-800">Net Revenue</span>
              <span className="font-bold text-blue-600">{formatInr(ledger?.revenue?.net_revenue)}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Sales: {ledger?.revenue?.sale_count || 0} · Pending: {ledger?.revenue?.pending_count || 0}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yield Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Yield Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Harvested</div>
              <div className="text-xl font-bold text-gray-900">
                {ledger?.yield?.harvested_kg?.toFixed(2)} kg
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Lost</div>
              <div className="text-xl font-bold text-red-600">
                {ledger?.yield?.lost_kg?.toFixed(2)} kg
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Area</div>
              <div className="text-xl font-bold text-blue-600">
                {ledger?.yield?.area_ha?.toFixed(2)} ha
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Measurement basis: <span className="font-medium">{ledger?.yield?.basis || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Value Engine Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle>Farmer Value Engine Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${profitMargin >= 20 ? 'bg-green-500' : profitMargin >= 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <div>
                <div className="font-medium text-gray-800">
                  {profitMargin >= 20 ? 'Strong profitability' : profitMargin >= 0 ? 'Modest profitability' : 'Operating at loss'}
                </div>
                <div className="text-sm text-gray-600">
                  Current profit margin of {profitMargin.toFixed(1)}% indicates{' '}
                  {profitMargin >= 20 ? 'strong value generation capacity' : profitMargin >= 0 ? 'adequate but improvable performance' : 'need for intervention support'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${ledger?.revenue?.pending_count > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <div>
                <div className="font-medium text-gray-800">
                  {ledger?.revenue?.pending_count > 0 ? 'Payment collection required' : 'Revenue fully realized'}
                </div>
                <div className="text-sm text-gray-600">
                  {ledger?.revenue?.pending_count || 0} pending payments totaling {formatInr(ledger?.revenue?.pending_amount)} require follow-up
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${ledger?.yield?.basis === 'weighbridge' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div>
                <div className="font-medium text-gray-800">
                  Data quality: {ledger?.yield?.basis === 'weighbridge' ? 'High confidence' : 'Moderate confidence'}
                </div>
                <div className="text-sm text-gray-600">
                  Yield measurements based on {ledger?.yield?.basis || 'N/A'} — affects FVI calculation confidence
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
