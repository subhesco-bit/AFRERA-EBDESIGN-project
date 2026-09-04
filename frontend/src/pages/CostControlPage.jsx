/**
 * Cost Control — AF-CO / "Controlling" (996_enterprise_foundation).
 *
 * Cost and profit centres, budgets and budget lines, and budget-vs-actual
 * computed live from posted journal_lines — never stored, so it can never
 * disagree with the general ledger. See
 * backend/src/services/costControlService.js for how this differs from
 * financeAPI (GL/GST), rfqAPI.centrePnl (FPO cost centres, no
 * chart-of-accounts link) and the /costs landed-cost pricing model.
 *
 * COMPANY / FISCAL YEAR / ACCOUNT — company, fiscal year (for a new budget)
 * and chart-of-accounts account (for a new budget line) are all picked from
 * real, DB-backed dropdowns (GET /api/v1/companies and its
 * /fiscal-years and /chart-of-accounts sub-resources — migration 996's
 * tables, seeded by 9999_erp_foundation_seed.sql), not typed as raw numeric
 * IDs. Cost centre / profit centre / fiscal period identifiers used
 * elsewhere on this page remain manual — this task's scope was specifically
 * companyId, fiscalYearId and accountId.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { costControlAPI, companyAPI } from '../services/api';
import { ModulePage, Section, Field, Rupees, DataTable } from '../components/common/DataPrimitives';
import ResourceManager from '../components/common/ResourceManager';

const BUDGET_TYPES = ['operating', 'capital', 'cash', 'project'];

export default function CostControlPage() {
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [companiesError, setCompaniesError] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    companyAPI.listCompanies()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data || [];
        setCompanies(list);
        if (list.length === 1) setCompanyId(String(list[0].id));
      })
      .catch((e) => { if (!cancelled) setCompaniesError(e.response?.data?.error || e.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!companyId) { setFiscalYears([]); setChartOfAccounts([]); return; }
    let cancelled = false;
    Promise.all([
      companyAPI.getFiscalYears(companyId),
      companyAPI.getChartOfAccounts(companyId),
    ]).then(([fyRes, coaRes]) => {
      if (cancelled) return;
      setFiscalYears(fyRes.data?.data || []);
      setChartOfAccounts(coaRes.data?.data || []);
    }).catch(() => { if (!cancelled) { setFiscalYears([]); setChartOfAccounts([]); } });
    return () => { cancelled = true; };
  }, [companyId]);

  const [costCenters, setCostCenters] = useState([]);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [fiscalPeriodId, setFiscalPeriodId] = useState('');
  const [actuals, setActuals] = useState(null);

  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [budgetLines, setBudgetLines] = useState(null);
  const [vsActual, setVsActual] = useState(null);
  const [budgetActionMsg, setBudgetActionMsg] = useState(null);

  const loadCostCenters = useCallback(async () => {
    if (!companyId) { setCostCenters([]); return; }
    try {
      const res = await costControlAPI.getCostCenters(companyId);
      setCostCenters(res.data?.data || []);
    } catch { setCostCenters([]); }
  }, [companyId]);

  const loadBudgets = useCallback(async () => {
    if (!companyId) { setBudgets([]); return; }
    try {
      const res = await costControlAPI.getBudgets(companyId);
      setBudgets(res.data?.data || []);
    } catch { setBudgets([]); }
  }, [companyId]);

  useEffect(() => { loadCostCenters(); loadBudgets(); }, [loadCostCenters, loadBudgets]);

  const loadActuals = async (e) => {
    e.preventDefault();
    if (!selectedCostCenterId) return;
    try {
      const res = await costControlAPI.getCostCenterActuals(selectedCostCenterId, fiscalPeriodId ? { fiscalPeriodId } : {});
      setActuals(res.data?.data || []);
    } catch (err) {
      setActuals({ error: err.response?.data?.error || err.message });
    }
  };

  const loadBudgetLines = useCallback(async (budgetId) => {
    if (!budgetId) { setBudgetLines(null); setVsActual(null); return; }
    try {
      const [linesRes, vsRes] = await Promise.all([
        costControlAPI.getBudgetLines(budgetId),
        costControlAPI.getBudgetVsActual(budgetId),
      ]);
      setBudgetLines(linesRes.data?.data || []);
      setVsActual(vsRes.data?.data || null);
    } catch (err) {
      setBudgetLines({ error: err.response?.data?.error || err.message });
    }
  }, []);

  useEffect(() => { loadBudgetLines(selectedBudgetId); }, [selectedBudgetId, loadBudgetLines]);

  const [lineForm, setLineForm] = useState({ accountId: '', costCenterId: '', profitCenterId: '', fiscalPeriodId: '', budgetedAmount: '', notes: '' });
  const submitLine = async (e) => {
    e.preventDefault();
    if (!selectedBudgetId || !lineForm.accountId || lineForm.budgetedAmount === '') return;
    try {
      await costControlAPI.addBudgetLine(selectedBudgetId, {
        accountId: Number(lineForm.accountId),
        costCenterId: lineForm.costCenterId ? Number(lineForm.costCenterId) : undefined,
        profitCenterId: lineForm.profitCenterId ? Number(lineForm.profitCenterId) : undefined,
        fiscalPeriodId: lineForm.fiscalPeriodId ? Number(lineForm.fiscalPeriodId) : undefined,
        budgetedAmount: Number(lineForm.budgetedAmount),
        notes: lineForm.notes || undefined,
      });
      setLineForm({ accountId: '', costCenterId: '', profitCenterId: '', fiscalPeriodId: '', budgetedAmount: '', notes: '' });
      loadBudgetLines(selectedBudgetId);
    } catch (err) {
      setBudgetActionMsg(err.response?.data?.error || err.message);
    }
  };

  const submitBudget = async () => {
    if (!selectedBudgetId) return;
    setBudgetActionMsg(null);
    try {
      await costControlAPI.submitBudget(selectedBudgetId);
      setBudgetActionMsg('Budget submitted.');
      loadBudgets();
    } catch (err) { setBudgetActionMsg(err.response?.data?.error || err.message); }
  };

  const approveBudget = async (approved) => {
    if (!selectedBudgetId) return;
    setBudgetActionMsg(null);
    try {
      await costControlAPI.approveBudget(selectedBudgetId, approved);
      setBudgetActionMsg(approved ? 'Budget approved.' : 'Budget rejected.');
      loadBudgets();
    } catch (err) { setBudgetActionMsg(err.response?.data?.error || err.message); }
  };

  return (
    <ModulePage
      title="Cost control"
      subtitle="Cost and profit centres, budgets, and budget-vs-actual derived live from posted ledger entries."
      migration="996"
    >
      <Section title="Company" description="Every call below is scoped by company.">
        <Field label="Company" id="cc-company-id">
          <select id="cc-company-id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">— select a company —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </Field>
        {companiesError && (
          <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 13, marginTop: 8 }}>{companiesError}</p>
        )}
      </Section>

      {!companyId ? (
        <Section title="Cost centres">
          <p role="status" style={{ color: 'var(--muted,#888)' }}>Select a company above to load cost control data.</p>
        </Section>
      ) : (
        <>
          <Section title="Cost centres">
            <ResourceManager
              compact
              accent="blue"
              queryKey={`cost-centers-${companyId}`}
              idField="id"
              list={() => costControlAPI.getCostCenters(companyId)}
              create={(data) => costControlAPI.createCostCenter({
                ...data, companyId,
                parentCostCenterId: data.parentCostCenterId || undefined,
                businessUnitId: data.businessUnitId || undefined,
                departmentId: data.departmentId || undefined,
              })}
              searchPlaceholder="Search is not wired to a backend filter yet"
              emptyMessage="No cost centres recorded for this company yet."
              newLabel="Add Cost Centre"
              initialForm={{ code: '', name: '', parentCostCenterId: '', businessUnitId: '', departmentId: '', responsibleUserId: '' }}
              requiredFields={['code', 'name']}
              columns={[
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
                { key: 'parent_cost_center_id', label: 'Parent' },
                { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
              ]}
              fields={[
                { name: 'code', label: 'Code', required: true },
                { name: 'name', label: 'Name', required: true },
                { name: 'parentCostCenterId', label: 'Parent cost centre ID', type: 'number' },
                { name: 'businessUnitId', label: 'Business unit ID', type: 'number' },
                { name: 'departmentId', label: 'Department ID', type: 'number' },
                { name: 'responsibleUserId', label: 'Responsible user ID (UUID)' },
              ]}
              stats={(items) => [
                { label: 'Cost centres', value: items.length },
                { label: 'Active', value: items.filter((i) => i.is_active).length },
              ]}
            />
          </Section>

          <Section title="Cost centre actuals"
            description="Sum of posted journal lines against the centre, signed by each account's normal balance.">
            <form onSubmit={loadActuals} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Cost centre" id="actuals-cc" hint="Newly added centres: use Refresh below">
                <select id="actuals-cc" value={selectedCostCenterId} onChange={(e) => setSelectedCostCenterId(e.target.value)} style={{ minWidth: 220 }}>
                  <option value="">— select —</option>
                  {costCenters.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </Field>
              <button type="button" onClick={loadCostCenters}>Refresh list</button>
              <Field label="Fiscal period ID" id="actuals-fp" hint="Optional — omit for all-time">
                <input id="actuals-fp" type="number" value={fiscalPeriodId} onChange={(e) => setFiscalPeriodId(e.target.value)} />
              </Field>
              <button type="submit" disabled={!selectedCostCenterId}>Load actuals</button>
            </form>
            {actuals?.error ? (
              <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 8 }}>{actuals.error}</p>
            ) : (
              <DataTable
                caption="Actuals by account type"
                emptyMessage="No actuals loaded yet."
                columns={[
                  { key: 'account_type', label: 'Account type' },
                  { key: 'amount', label: 'Amount', numeric: true, render: (r) => <Rupees value={r.amount} /> },
                ]}
                rows={Array.isArray(actuals) ? actuals : []}
                rowKey={(r) => r.account_type}
              />
            )}
          </Section>

          <Section title="Profit centres">
            <ResourceManager
              compact
              accent="teal"
              queryKey={`profit-centers-${companyId}`}
              idField="id"
              list={() => costControlAPI.getProfitCenters(companyId)}
              create={(data) => costControlAPI.createProfitCenter({
                ...data, companyId,
                parentProfitCenterId: data.parentProfitCenterId || undefined,
                businessUnitId: data.businessUnitId || undefined,
              })}
              searchPlaceholder="Search is not wired to a backend filter yet"
              emptyMessage="No profit centres recorded for this company yet."
              newLabel="Add Profit Centre"
              initialForm={{ code: '', name: '', parentProfitCenterId: '', businessUnitId: '', responsibleUserId: '' }}
              requiredFields={['code', 'name']}
              columns={[
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
                { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
              ]}
              fields={[
                { name: 'code', label: 'Code', required: true },
                { name: 'name', label: 'Name', required: true },
                { name: 'parentProfitCenterId', label: 'Parent profit centre ID', type: 'number' },
                { name: 'businessUnitId', label: 'Business unit ID', type: 'number' },
                { name: 'responsibleUserId', label: 'Responsible user ID (UUID)' },
              ]}
              stats={(items) => [
                { label: 'Profit centres', value: items.length },
                { label: 'Active', value: items.filter((i) => i.is_active).length },
              ]}
            />
          </Section>

          <Section title="Budgets">
            <ResourceManager
              compact
              accent="amber"
              queryKey={`budgets-${companyId}`}
              idField="id"
              list={() => costControlAPI.getBudgets(companyId)}
              create={(data) => costControlAPI.createBudget({ ...data, companyId, fiscalYearId: Number(data.fiscalYearId) })}
              searchPlaceholder="Search is not wired to a backend filter yet"
              emptyMessage="No budgets recorded for this company yet."
              newLabel="Add Budget"
              initialForm={{ fiscalYearId: '', code: '', name: '', budgetType: 'operating' }}
              requiredFields={['fiscalYearId', 'code', 'name']}
              columns={[
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
                { key: 'budget_type', label: 'Type' },
                { key: 'status', label: 'Status' },
              ]}
              fields={[
                {
                  name: 'fiscalYearId', label: 'Fiscal year', type: 'select', required: true,
                  options: [
                    { value: '', label: '— select a fiscal year —' },
                    ...fiscalYears.map((fy) => ({ value: fy.id, label: `${fy.code} (${String(fy.start_date).slice(0, 10)} – ${String(fy.end_date).slice(0, 10)})` })),
                  ],
                },
                { name: 'code', label: 'Code', required: true },
                { name: 'name', label: 'Name', required: true },
                { name: 'budgetType', label: 'Budget type', type: 'select', options: BUDGET_TYPES },
              ]}
              stats={(items) => [
                { label: 'Budgets', value: items.length },
                { label: 'Approved', value: items.filter((i) => i.status === 'approved').length },
              ]}
            />
          </Section>

          <Section title="Budget lines and budget-vs-actual"
            description="Actuals here are never stored — computed live from posted journal lines, so they can never drift from the ledger.">
            <Field label="Budget" id="budget-select" hint="Newly added budgets: use Refresh below">
              <select id="budget-select" value={selectedBudgetId} onChange={(e) => setSelectedBudgetId(e.target.value)} style={{ minWidth: 260 }}>
                <option value="">— select a budget —</option>
                {budgets.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.name} ({b.status})</option>)}
              </select>
            </Field>
            <button type="button" onClick={loadBudgets} style={{ marginLeft: 8 }}>Refresh list</button>

            {selectedBudgetId && (
              <>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button type="button" onClick={submitBudget}>Submit for approval</button>
                  <button type="button" onClick={() => approveBudget(true)}>Approve</button>
                  <button type="button" onClick={() => approveBudget(false)}>Reject</button>
                </div>
                {budgetActionMsg && <p role="status" style={{ fontSize: 13, marginTop: 6 }}>{budgetActionMsg}</p>}

                <form onSubmit={submitLine} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 16, padding: 12, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}>
                  <Field label="Account" id="line-account" hint="Postable accounts only">
                    <select id="line-account" value={lineForm.accountId} onChange={(e) => setLineForm((f) => ({ ...f, accountId: e.target.value }))} style={{ minWidth: 220 }}>
                      <option value="">— select —</option>
                      {chartOfAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
                    </select>
                  </Field>
                  <Field label="Cost centre ID" id="line-cc" hint="Optional"><input id="line-cc" type="number" value={lineForm.costCenterId} onChange={(e) => setLineForm((f) => ({ ...f, costCenterId: e.target.value }))} /></Field>
                  <Field label="Profit centre ID" id="line-pc" hint="Optional"><input id="line-pc" type="number" value={lineForm.profitCenterId} onChange={(e) => setLineForm((f) => ({ ...f, profitCenterId: e.target.value }))} /></Field>
                  <Field label="Fiscal period ID" id="line-fp" hint="Optional"><input id="line-fp" type="number" value={lineForm.fiscalPeriodId} onChange={(e) => setLineForm((f) => ({ ...f, fiscalPeriodId: e.target.value }))} /></Field>
                  <Field label="Budgeted amount (₹)" id="line-amt"><input id="line-amt" type="number" value={lineForm.budgetedAmount} onChange={(e) => setLineForm((f) => ({ ...f, budgetedAmount: e.target.value }))} /></Field>
                  <button type="submit" disabled={!lineForm.accountId || lineForm.budgetedAmount === ''}>Add line</button>
                </form>

                {budgetLines?.error ? (
                  <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 12 }}>{budgetLines.error}</p>
                ) : (
                  <DataTable
                    caption="Budget lines"
                    emptyMessage="No lines on this budget yet."
                    columns={[
                      { key: 'account_code', label: 'Account' },
                      { key: 'account_name', label: 'Account name' },
                      { key: 'cost_center_id', label: 'Cost centre' },
                      { key: 'budgeted_amount', label: 'Budgeted', numeric: true, render: (r) => <Rupees value={r.budgeted_amount} /> },
                    ]}
                    rows={budgetLines || []}
                    rowKey={(r) => r.id}
                  />
                )}

                {vsActual && (
                  <>
                    <p style={{ fontSize: 15, marginTop: 16 }}>
                      Budgeted <strong><Rupees value={vsActual.totalBudgeted} /></strong>
                      {' · '}Actual <strong><Rupees value={vsActual.totalActual} /></strong>
                      {' · '}
                      <strong style={{ color: vsActual.totalVariance > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--data-real))' }}>
                        variance <Rupees value={vsActual.totalVariance} />
                      </strong>
                    </p>
                    <DataTable
                      caption="Budget vs. actual, per line"
                      emptyMessage="No lines to compare."
                      columns={[
                        { key: 'account_code', label: 'Account' },
                        { key: 'account_name', label: 'Account name' },
                        { key: 'budgeted_amount', label: 'Budgeted', numeric: true, render: (r) => <Rupees value={r.budgeted_amount} /> },
                        { key: 'actual_amount', label: 'Actual', numeric: true, render: (r) => <Rupees value={r.actual_amount} /> },
                        { key: 'variance', label: 'Variance', numeric: true, render: (r) => <Rupees value={r.variance} /> },
                        { key: 'variance_pct', label: 'Variance %', numeric: true, render: (r) => (r.variance_pct === null ? '—' : `${r.variance_pct}%`) },
                      ]}
                      rows={vsActual.lines || []}
                      rowKey={(r) => r.budget_line_id}
                    />
                  </>
                )}
              </>
            )}
          </Section>
        </>
      )}
    </ModulePage>
  );
}
