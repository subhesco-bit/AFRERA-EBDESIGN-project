import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, TrendingUp, Award } from 'lucide-react';

// 2026-09-16: was a hardcoded `farmerData` object (named fake farmers
// like 'Rajesh Kumar' with invented FDI/revenue, a fabricated regional
// breakdown), zero fetch/axios anywhere. Wired to the real, mounted
// `GET /api/farmer` endpoint (`routes/farmerRoutes_merged.js` ->
// `services/legacy/farmerService.js#getFarmers`, already exported as
// `farmersAPI.getFarmers` and used elsewhere this session) - it returns
// real `{farmers, pagination: {total, ...}}` wrapped in the standard
// `{success, data: {...}}` envelope (`apiResponseHandler.sendSuccess`),
// verified by reading both files directly.
//
// It has no single "farmer report dashboard" aggregate, so this page
// makes 3 real, separate calls rather than fabricating one:
// - top 5 real farmers sorted by `fdi_score` (also gives the real grand
//   total via `pagination.total`, unaffected by the `limit`)
// - a `status=active` filtered count
// - a `certification_count_min=1` filtered count (real "certified"
//   proxy - matches the `certification_count` column directly)
// There is no per-farmer `revenue` column and no region/state filter or
// average-FDI aggregate anywhere in `farmerService.js`, so this page no
// longer shows revenue, a region selector, an "Avg FDI" card or a
// regional breakdown - none of that exists server-side and rendering it
// would mean inventing numbers again.
const FarmerReportPage = () => {
  const topQuery = useQuery({
    queryKey: ['farmer-report-top'],
    queryFn: () =>
      farmersAPI
        .getFarmers({}, { limit: 5, sort_by: 'fdi_score', sort_order: 'DESC' })
        .then((r) => r.data.data),
  });

  const activeQuery = useQuery({
    queryKey: ['farmer-report-active-count'],
    queryFn: () =>
      farmersAPI.getFarmers({ status: 'active' }, { limit: 1 }).then((r) => r.data.data),
  });

  const certifiedQuery = useQuery({
    queryKey: ['farmer-report-certified-count'],
    queryFn: () =>
      farmersAPI
        .getFarmers({ certification_count_min: 1 }, { limit: 1 })
        .then((r) => r.data.data),
  });

  const isLoading = topQuery.isLoading || activeQuery.isLoading || certifiedQuery.isLoading;
  const error = topQuery.error || activeQuery.error || certifiedQuery.error;

  const totalFarmers = topQuery.data?.pagination?.total;
  const activeFarmers = activeQuery.data?.pagination?.total;
  const certifiedFarmers = certifiedQuery.data?.pagination?.total;
  const topFarmers = topQuery.data?.farmers || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Farmer Report</h1>
        <p className="text-muted-foreground">Farmer performance and demographics analysis</p>
      </div>

      {isLoading && <p className="text-gray-500">Loading farmer data...</p>}
      {error && <p className="text-red-600">Failed to load farmer data: {error.message}</p>}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFarmers ?? 0}</div>
                <p className="text-xs text-muted-foreground">Registered farmers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeFarmers ?? 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certified</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{certifiedFarmers ?? 0}</div>
                <p className="text-xs text-muted-foreground">With at least one certification</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Farmers</CardTitle>
              <CardDescription>Highest FDI (Farmer Development Index) scores</CardDescription>
            </CardHeader>
            <CardContent>
              {topFarmers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No farmers found.</p>
              ) : (
                <div className="space-y-4">
                  {topFarmers.map((farmer) => (
                    <div key={farmer.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{farmer.name}</p>
                        <p className="text-sm text-muted-foreground">{farmer.fpo_name || 'No FPO'}</p>
                      </div>
                      <p className="font-bold">FDI: {farmer.fdi_score ?? 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Breakdown</CardTitle>
              <CardDescription>Farmer distribution by region</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Live regional breakdown isn&apos;t available yet - the farmer directory has no
                region/state filter or aggregate yet.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FarmerReportPage;
