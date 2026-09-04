/**
 * Asset Accounting — AF-AA (996_enterprise_foundation).
 *
 * Fixed-asset register, straight-line depreciation schedules and disposal.
 * See backend/src/services/assetAccountingService.js for scope: only
 * straight_line is computed (declining-balance and units-of-production have
 * no rate/usage feed in this schema yet), and no journal entry is posted
 * here — that GL linkage belongs to whichever service owns period close.
 *
 * COMPANY ID — every call below is scoped by companyId. This is picked from
 * a real, DB-backed dropdown (GET /api/v1/companies, migration 996's
 * `companies` table, seeded by 9999_erp_foundation_seed.sql) rather than
 * typed as a raw numeric ID. There is still no company/tenant context in
 * authStore.js — the platform is single-org by design (see
 * AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C: "one identity, one ledger, one
 * ERP"), so the dropdown will usually list exactly one company, not because
 * the picker is fake but because the org itself is a single row.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { assetAccountingAPI, companyAPI } from '../services/api';
import { ModulePage, Section, Field, Rupees, Value, AsyncState, DataTable } from '../components/common/DataPrimitives';
import ResourceManager from '../components/common/ResourceManager';

const DEPRECIATION_METHODS = ['straight_line', 'declining_balance', 'units_of_production', 'wdv'];

export default function AssetAccountingPage() {
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [companiesError, setCompaniesError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    companyAPI.listCompanies()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data || [];
        setCompanies(list);
        // A single-org platform should not force a redundant click through a
        // one-item dropdown — auto-select when there is exactly one company,
        // same as a human would.
        if (list.length === 1) setCompanyId(String(list[0].id));
      })
      .catch((e) => { if (!cancelled) setCompaniesError(e.response?.data?.error || e.message); });
    return () => { cancelled = true; };
  }, []);

  // Lightweight local roster of assets for the depreciation/disposal pickers
  // below — a second, independent read of the same real endpoint the
  // register table uses, not a mock.
  const [assets, setAssets] = useState([]);
  const [assetsError, setAssetsError] = useState(null);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [scheduleMsg, setScheduleMsg] = useState(null);
  const [postPeriod, setPostPeriod] = useState('');

  const [runAsOfDate, setRunAsOfDate] = useState('');
  const [runResult, setRunResult] = useState(null);

  const [disposal, setDisposal] = useState({ disposalDate: '', disposalAmount: '' });
  const [disposalResult, setDisposalResult] = useState(null);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    if (!companyId) { setAssets([]); return; }
    try {
      const res = await assetAccountingAPI.getAssets(companyId);
      setAssets(res.data?.data || []);
      setAssetsError(null);
    } catch (e) {
      setAssetsError(e.response?.data?.error || e.message);
    }
  }, [companyId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const loadSchedule = async (assetId) => {
    if (!assetId) { setSchedule(null); return; }
    try {
      const res = await assetAccountingAPI.getDepreciationSchedule(assetId);
      setSchedule(res.data?.data || []);
    } catch (e) {
      setSchedule({ error: e.response?.data?.error || e.message });
    }
  };

  useEffect(() => { loadSchedule(selectedAssetId); }, [selectedAssetId]);

  const generateSchedule = async () => {
    if (!selectedAssetId) return;
    setScheduleMsg(null);
    try {
      const res = await assetAccountingAPI.generateDepreciationSchedule(selectedAssetId);
      setScheduleMsg(`Generated ${res.data?.data?.periods ?? 0} period(s), monthly depreciation ${res.data?.data?.monthlyDepreciation ?? '—'}.`);
      loadSchedule(selectedAssetId);
      loadAssets();
    } catch (e) {
      setScheduleMsg(e.response?.data?.error || e.message);
    }
  };

  const postOnePeriod = async () => {
    if (!selectedAssetId || !postPeriod) return;
    setScheduleMsg(null);
    try {
      await assetAccountingAPI.postDepreciationPeriod(selectedAssetId, postPeriod);
      setScheduleMsg(`Posted period ${postPeriod}.`);
      setPostPeriod('');
      loadSchedule(selectedAssetId);
      loadAssets();
    } catch (e) {
      setScheduleMsg(e.response?.data?.error || e.message);
    }
  };

  const runBatch = async (e) => {
    e.preventDefault();
    if (!companyId || !runAsOfDate) return;
    try {
      const res = await assetAccountingAPI.runDepreciationForPeriod(companyId, runAsOfDate);
      setRunResult(res.data?.data);
      loadAssets();
      if (selectedAssetId) loadSchedule(selectedAssetId);
    } catch (e) {
      setRunResult({ error: e.response?.data?.error || e.message });
    }
  };

  const submitDisposal = async (e) => {
    e.preventDefault();
    if (!selectedAssetId || !disposal.disposalDate || disposal.disposalAmount === '') return;
    try {
      const res = await assetAccountingAPI.disposeAsset(selectedAssetId, {
        disposalDate: disposal.disposalDate,
        disposalAmount: Number(disposal.disposalAmount),
      });
      setDisposalResult(res.data?.data);
      loadAssets();
    } catch (e) {
      setDisposalResult({ error: e.response?.data?.error || e.message });
    }
  };

  const loadSummary = async () => {
    if (!companyId) return;
    setSummaryLoading(true);
    try {
      const res = await assetAccountingAPI.getAssetRegisterSummary(companyId);
      setSummary(res.data?.data || []);
    } catch (e) {
      setSummary({ error: e.response?.data?.error || e.message });
    } finally {
      setSummaryLoading(false);
    }
  };

  const unpostedPeriods = (schedule && !schedule.error ? schedule : []).filter((p) => !p.is_posted);

  return (
    <ModulePage
      title="Asset accounting"
      subtitle="Fixed-asset register and straight-line depreciation, posted period by period against the general ledger."
      migration="996"
    >
      <Section title="Company" description="Every call below is scoped by company.">
        <Field label="Company" id="company-id">
          <select id="company-id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">— select a company —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </Field>
        {companiesError && (
          <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 13, marginTop: 8 }}>{companiesError}</p>
        )}
      </Section>

      {!companyId ? (
        <Section title="Fixed asset register">
          <p role="status" style={{ color: 'var(--muted,#888)' }}>Select a company above to load the register.</p>
        </Section>
      ) : (
        <>
          <Section title="Fixed asset register">
            <ResourceManager
              compact
              accent="indigo"
              queryKey={`fixed-assets-${companyId}`}
              idField="id"
              list={() => assetAccountingAPI.getAssets(companyId)}
              create={(data) => assetAccountingAPI.createAsset({ ...data, companyId })}
              searchPlaceholder="Search is not wired to a backend filter yet"
              emptyMessage="No fixed assets recorded for this company yet."
              newLabel="Add Asset"
              initialForm={{
                assetCode: '', assetName: '', assetClass: '', acquisitionDate: '',
                acquisitionCost: '', salvageValue: 0, usefulLifeMonths: '',
                depreciationMethod: 'straight_line', costCenterId: '', branchId: '',
              }}
              requiredFields={['assetCode', 'assetName', 'acquisitionDate', 'acquisitionCost', 'usefulLifeMonths']}
              columns={[
                { key: 'asset_code', label: 'Code' },
                { key: 'asset_name', label: 'Name' },
                { key: 'asset_class', label: 'Class' },
                { key: 'acquisition_cost', label: 'Acquisition cost', render: (r) => <Rupees value={r.acquisition_cost} /> },
                { key: 'accumulated_depreciation', label: 'Accum. depreciation', render: (r) => <Rupees value={r.accumulated_depreciation} /> },
                { key: 'net_book_value', label: 'Net book value', render: (r) => <Rupees value={r.net_book_value} /> },
                { key: 'status', label: 'Status' },
              ]}
              fields={[
                { name: 'assetCode', label: 'Asset code', required: true },
                { name: 'assetName', label: 'Asset name', required: true },
                { name: 'assetClass', label: 'Asset class' },
                { name: 'acquisitionDate', label: 'Acquisition date', type: 'date', required: true },
                { name: 'acquisitionCost', label: 'Acquisition cost (₹)', type: 'number', required: true },
                { name: 'salvageValue', label: 'Salvage value (₹)', type: 'number' },
                { name: 'usefulLifeMonths', label: 'Useful life (months)', type: 'number', required: true },
                { name: 'depreciationMethod', label: 'Depreciation method', type: 'select', options: DEPRECIATION_METHODS },
                { name: 'costCenterId', label: 'Cost centre ID', type: 'number' },
                { name: 'branchId', label: 'Branch ID', type: 'number' },
              ]}
              stats={(items) => [
                { label: 'Assets', value: items.length },
                { label: 'Active', value: items.filter((i) => i.status === 'active').length },
                { label: 'Total net book value', value: items.reduce((s, i) => s + (Number(i.net_book_value) || 0), 0).toLocaleString('en-IN') },
              ]}
            />
            {assetsError && (
              <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 13, marginTop: 8 }}>{assetsError}</p>
            )}
          </Section>

          <Section title="Depreciation"
            description="Only straight-line is computed — the service refuses declining-balance and units-of-production honestly rather than guessing a formula.">
            <Field label="Asset" id="dep-asset">
              <select id="dep-asset" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} style={{ minWidth: 260 }}>
                <option value="">— select an asset —</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.asset_code} — {a.asset_name} ({a.depreciation_method})</option>
                ))}
              </select>
            </Field>

            {selectedAssetId && (
              <>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={generateSchedule}>Generate schedule</button>
                  <Field label="Period to post" id="post-period" hint="From the unposted periods below">
                    <select id="post-period" value={postPeriod} onChange={(e) => setPostPeriod(e.target.value)}>
                      <option value="">— select —</option>
                      {unpostedPeriods.map((p) => (
                        <option key={p.id} value={p.period_date}>{String(p.period_date).slice(0, 10)}</option>
                      ))}
                    </select>
                  </Field>
                  <button type="button" onClick={postOnePeriod} disabled={!postPeriod}>Post period</button>
                </div>
                {scheduleMsg && <p role="status" style={{ fontSize: 13, marginTop: 8 }}>{scheduleMsg}</p>}

                {schedule?.error ? (
                  <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 12 }}>{schedule.error}</p>
                ) : (
                  <DataTable
                    caption="Depreciation schedule"
                    emptyMessage="No schedule generated for this asset yet."
                    columns={[
                      { key: 'period_date', label: 'Period', render: (r) => String(r.period_date).slice(0, 10) },
                      { key: 'depreciation_amount', label: 'Amount', numeric: true, render: (r) => <Rupees value={r.depreciation_amount} /> },
                      { key: 'accumulated_after', label: 'Accumulated after', numeric: true, render: (r) => <Rupees value={r.accumulated_after} /> },
                      { key: 'is_posted', label: 'Posted', render: (r) => (r.is_posted ? 'Yes' : 'No') },
                    ]}
                    rows={schedule || []}
                    rowKey={(r) => r.id}
                  />
                )}
              </>
            )}
          </Section>

          <Section title="Depreciation run"
            description="Posts every unposted, due period for every active asset in this company, in period order. One asset's failure does not abort the rest of the run.">
            <form onSubmit={runBatch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="As of date" id="run-date">
                <input id="run-date" type="date" value={runAsOfDate} onChange={(e) => setRunAsOfDate(e.target.value)} />
              </Field>
              <button type="submit" disabled={!companyId || !runAsOfDate}>Run for period</button>
            </form>
            {runResult && (
              runResult.error ? (
                <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 8 }}>{runResult.error}</p>
              ) : (
                <p role="status" style={{ marginTop: 8, fontSize: 14 }}>
                  Posted <Value value={runResult.postedCount} decimals={0} /> period(s), total depreciation{' '}
                  <strong><Rupees value={runResult.totalDepreciation} /></strong>
                  {runResult.failures?.length > 0 && <> · {runResult.failures.length} failure(s)</>}
                </p>
              )
            )}
          </Section>

          <Section title="Disposal">
            <form onSubmit={submitDisposal} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Disposal date" id="disp-date">
                <input id="disp-date" type="date" value={disposal.disposalDate}
                  onChange={(e) => setDisposal((d) => ({ ...d, disposalDate: e.target.value }))} />
              </Field>
              <Field label="Disposal amount (₹)" id="disp-amount">
                <input id="disp-amount" type="number" value={disposal.disposalAmount}
                  onChange={(e) => setDisposal((d) => ({ ...d, disposalAmount: e.target.value }))} />
              </Field>
              <button type="submit" disabled={!selectedAssetId}>Dispose selected asset</button>
            </form>
            {disposalResult && (
              disposalResult.error ? (
                <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 8 }}>{disposalResult.error}</p>
              ) : (
                <p role="status" style={{ marginTop: 8, fontSize: 14 }}>
                  Net book value at disposal <strong><Rupees value={disposalResult.netBookValueAtDisposal} /></strong>
                  {' · '}
                  {disposalResult.gainLoss >= 0 ? 'gain' : 'loss'}{' '}
                  <strong><Rupees value={Math.abs(disposalResult.gainLoss)} /></strong>
                </p>
              )
            )}
          </Section>

          <Section title="Register summary">
            <button type="button" onClick={loadSummary} disabled={!companyId}>Load summary</button>
            <AsyncState loading={summaryLoading} error={summary?.error}>
              <DataTable
                caption="Assets by class and status"
                emptyMessage="No summary loaded yet."
                columns={[
                  { key: 'asset_class', label: 'Class' },
                  { key: 'status', label: 'Status' },
                  { key: 'asset_count', label: 'Count', numeric: true },
                  { key: 'total_acquisition_cost', label: 'Acquisition cost', numeric: true, render: (r) => <Rupees value={r.total_acquisition_cost} /> },
                  { key: 'total_accumulated_depreciation', label: 'Accum. depreciation', numeric: true, render: (r) => <Rupees value={r.total_accumulated_depreciation} /> },
                  { key: 'total_net_book_value', label: 'Net book value', numeric: true, render: (r) => <Rupees value={r.total_net_book_value} /> },
                ]}
                rows={Array.isArray(summary) ? summary : []}
                rowKey={(r, i) => `${r.asset_class}-${r.status}-${i}`}
              />
            </AsyncState>
          </Section>
        </>
      )}
    </ModulePage>
  );
}
