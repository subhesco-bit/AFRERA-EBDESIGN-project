/**
 * Project Systems — AF-PS (9996_project_systems_schema).
 *
 * Projects, work breakdown structure (self-referencing hierarchy), milestones
 * and live actuals computed from posted journal_lines. See
 * backend/src/services/projectSystemsService.js — three tables sized for a
 * rural-economy infrastructure build (packhouse, cold storage, FPO facility
 * setup), not a general contractor's PS module: no resource/capacity
 * planning, no network scheduling, no change orders, because this schema
 * carries no data to support any of that honestly.
 *
 * COMPANY ID — picked from a real, DB-backed dropdown (GET
 * /api/v1/companies — migration 996's `companies` table, seeded by
 * 9999_erp_foundation_seed.sql), not typed as a raw numeric ID. See the same
 * note on AssetAccountingPage.jsx for why the dropdown will usually list
 * exactly one company on this single-org platform.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { projectSystemsAPI, companyAPI } from '../services/api';
import { ModulePage, Section, Field, Rupees, Value, DataTable } from '../components/common/DataPrimitives';
import ResourceManager from '../components/common/ResourceManager';

const PROJECT_TYPES = ['infrastructure', 'equipment', 'capacity_building', 'other'];
const PROJECT_STATUSES = ['planned', 'active', 'on_hold', 'completed', 'cancelled'];
const WBS_STATUSES = ['planned', 'active', 'on_hold', 'completed', 'cancelled'];

/** Renders a WBS rollup node and its children, indented one level per depth. */
function WbsNode({ node, depth = 0 }) {
  return (
    <>
      <tr>
        <td style={{ paddingLeft: 8 + depth * 20, borderBottom: '1px solid hsl(var(--border))', padding: '6px 8px' }}>
          {node.wbs_code} — {node.wbs_name}
        </td>
        <td style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', padding: '6px 8px' }}>{node.status}</td>
        <td style={{ textAlign: 'right', borderBottom: '1px solid hsl(var(--border))', padding: '6px 8px' }}><Rupees value={node.rollupPlanned} /></td>
        <td style={{ textAlign: 'right', borderBottom: '1px solid hsl(var(--border))', padding: '6px 8px' }}><Rupees value={node.rollupActual} /></td>
        <td style={{ textAlign: 'right', borderBottom: '1px solid hsl(var(--border))', padding: '6px 8px', color: node.variance > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--data-real))' }}>
          <Rupees value={node.variance} />
        </td>
      </tr>
      {(node.children || []).map((child) => <WbsNode key={child.id} node={child} depth={depth + 1} />)}
    </>
  );
}

export default function ProjectSystemsPage() {
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [companiesError, setCompaniesError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [wbsList, setWbsList] = useState([]);
  const [rollup, setRollup] = useState(null);
  const [wbsMsg, setWbsMsg] = useState(null);
  const [wbsForm, setWbsForm] = useState({ parentId: '', wbsCode: '', wbsName: '', sequenceNumber: 0, plannedStartDate: '', plannedEndDate: '', plannedCost: '' });

  const [milestones, setMilestones] = useState(null);
  const [milestoneSummary, setMilestoneSummary] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ wbsId: '', milestoneName: '', targetDate: '', notes: '' });
  const [milestoneMsg, setMilestoneMsg] = useState(null);

  const [budgetVsActual, setBudgetVsActual] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'active' });
  const [statusMsg, setStatusMsg] = useState(null);

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

  const loadProjects = useCallback(async () => {
    if (!companyId) { setProjects([]); return; }
    try {
      const res = await projectSystemsAPI.getProjects(companyId);
      setProjects(res.data?.data || []);
    } catch { setProjects([]); }
  }, [companyId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadWbs = useCallback(async (projectId) => {
    if (!projectId) { setWbsList([]); setRollup(null); return; }
    try {
      const [wbsRes, rollupRes] = await Promise.all([
        projectSystemsAPI.getProjectWbs(projectId),
        projectSystemsAPI.getWbsCostRollup(projectId),
      ]);
      setWbsList(wbsRes.data?.data || []);
      setRollup(rollupRes.data?.data || []);
    } catch (err) {
      setRollup({ error: err.response?.data?.error || err.message });
    }
  }, []);

  const loadMilestones = useCallback(async (projectId) => {
    if (!projectId) { setMilestones(null); setMilestoneSummary(null); return; }
    try {
      const [msRes, sumRes] = await Promise.all([
        projectSystemsAPI.getProjectMilestones(projectId),
        projectSystemsAPI.getMilestoneStatusSummary(projectId),
      ]);
      setMilestones(msRes.data?.data || []);
      setMilestoneSummary(sumRes.data?.data || null);
    } catch (err) {
      setMilestones({ error: err.response?.data?.error || err.message });
    }
  }, []);

  const loadBudgetVsActual = useCallback(async (projectId) => {
    if (!projectId) { setBudgetVsActual(null); return; }
    try {
      let res = await projectSystemsAPI.getProjectBudgetVsActual(projectId);
      setBudgetVsActual(res.data?.data || null);
    } catch (err) {
      setBudgetVsActual({ error: err.response?.data?.error || err.message });
    }
  }, []);

  useEffect(() => {
    loadWbs(selectedProjectId);
    loadMilestones(selectedProjectId);
    loadBudgetVsActual(selectedProjectId);
  }, [selectedProjectId, loadWbs, loadMilestones, loadBudgetVsActual]);

  const submitWbs = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !wbsForm.wbsCode || !wbsForm.wbsName) return;
    setWbsMsg(null);
    try {
      await projectSystemsAPI.createWbsElement(selectedProjectId, {
        parentId: wbsForm.parentId || undefined,
        wbsCode: wbsForm.wbsCode,
        wbsName: wbsForm.wbsName,
        sequenceNumber: Number(wbsForm.sequenceNumber) || 0,
        plannedStartDate: wbsForm.plannedStartDate || undefined,
        plannedEndDate: wbsForm.plannedEndDate || undefined,
        plannedCost: wbsForm.plannedCost === '' ? 0 : Number(wbsForm.plannedCost),
      });
      setWbsForm({ parentId: '', wbsCode: '', wbsName: '', sequenceNumber: 0, plannedStartDate: '', plannedEndDate: '', plannedCost: '' });
      loadWbs(selectedProjectId);
    } catch (err) {
      setWbsMsg(err.response?.data?.error || err.message);
    }
  };

  const changeWbsStatus = async (wbsId, status) => {
    try {
      await projectSystemsAPI.updateWbsStatus(wbsId, status);
      loadWbs(selectedProjectId);
    } catch (err) {
      setWbsMsg(err.response?.data?.error || err.message);
    }
  };

  const submitMilestone = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !milestoneForm.milestoneName || !milestoneForm.targetDate) return;
    setMilestoneMsg(null);
    try {
      await projectSystemsAPI.createMilestone(selectedProjectId, {
        wbsId: milestoneForm.wbsId || undefined,
        milestoneName: milestoneForm.milestoneName,
        targetDate: milestoneForm.targetDate,
        notes: milestoneForm.notes || undefined,
      });
      setMilestoneForm({ wbsId: '', milestoneName: '', targetDate: '', notes: '' });
      loadMilestones(selectedProjectId);
    } catch (err) {
      setMilestoneMsg(err.response?.data?.error || err.message);
    }
  };

  const completeMilestone = async (milestoneId) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await projectSystemsAPI.completeMilestone(milestoneId, today);
      loadMilestones(selectedProjectId);
    } catch (err) {
      setMilestoneMsg(err.response?.data?.error || err.message);
    }
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setStatusMsg(null);
    try {
      await projectSystemsAPI.updateProjectStatus(selectedProjectId, statusForm.status);
      setStatusMsg(`Project status set to ${statusForm.status}.`);
      loadProjects();
    } catch (err) {
      setStatusMsg(err.response?.data?.error || err.message);
    }
  };

  const rollupError = rollup && !Array.isArray(rollup) ? rollup.error : null;
  const milestonesError = milestones && !Array.isArray(milestones) ? milestones.error : null;

  return (
    <ModulePage
      title="Project systems"
      subtitle="Work breakdown structure, milestones and budget-vs-actual for infrastructure builds, computed live from the posted general ledger."
      migration="9996"
    >
      <Section title="Company" description="Every call below is scoped by company.">
        <Field label="Company" id="ps-company-id">
          <select id="ps-company-id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">— select a company —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </Field>
        {companiesError && (
          <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 13, marginTop: 8 }}>{companiesError}</p>
        )}
      </Section>

      {!companyId ? (
        <Section title="Projects">
          <p role="status" style={{ color: 'var(--muted,#888)' }}>Select a company above to load projects.</p>
        </Section>
      ) : (
        <>
          <Section title="Projects">
            <ResourceManager
              compact
              accent="rose"
              queryKey={`projects-${companyId}`}
              idField="id"
              list={() => projectSystemsAPI.getProjects(companyId)}
              create={(data) => projectSystemsAPI.createProject({
                ...data, companyId,
                budgetAmount: data.budgetAmount === '' ? 0 : Number(data.budgetAmount),
              })}
              searchPlaceholder="Search is not wired to a backend filter yet"
              emptyMessage="No projects recorded for this company yet."
              newLabel="Add Project"
              initialForm={{ projectCode: '', projectName: '', reuId: '', projectType: 'infrastructure', plannedStartDate: '', plannedEndDate: '', budgetAmount: '', currency: 'INR', description: '' }}
              requiredFields={['projectCode', 'projectName']}
              columns={[
                { key: 'project_code', label: 'Code' },
                { key: 'project_name', label: 'Name' },
                { key: 'project_type', label: 'Type' },
                { key: 'budget_amount', label: 'Budget', render: (r) => <Rupees value={r.budget_amount} /> },
                { key: 'status', label: 'Status' },
              ]}
              fields={[
                { name: 'projectCode', label: 'Project code', required: true },
                { name: 'projectName', label: 'Project name', required: true },
                { name: 'reuId', label: 'REU ID', hint: 'Rural economic unit' },
                { name: 'projectType', label: 'Project type', type: 'select', options: PROJECT_TYPES },
                { name: 'plannedStartDate', label: 'Planned start', type: 'date' },
                { name: 'plannedEndDate', label: 'Planned end', type: 'date' },
                { name: 'budgetAmount', label: 'Budget amount (₹)', type: 'number' },
                { name: 'currency', label: 'Currency' },
                { name: 'description', label: 'Description', type: 'textarea', span: 2 },
              ]}
              stats={(items) => [
                { label: 'Projects', value: items.length },
                { label: 'Active', value: items.filter((i) => i.status === 'active').length },
                { label: 'Total budget', value: items.reduce((s, i) => s + (Number(i.budget_amount) || 0), 0).toLocaleString('en-IN') },
              ]}
            />
          </Section>

          <Section title="Selected project">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Project" id="project-select" hint="Newly added projects: use Refresh">
                <select id="project-select" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={{ minWidth: 260 }}>
                  <option value="">— select a project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.project_code} — {p.project_name} ({p.status})</option>)}
                </select>
              </Field>
              <button type="button" onClick={loadProjects}>Refresh list</button>
            </div>

            {selectedProjectId && (
              <form onSubmit={submitStatus} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 12 }}>
                <Field label="Set status" id="project-status">
                  <select id="project-status" value={statusForm.status} onChange={(e) => setStatusForm({ status: e.target.value })}>
                    {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <button type="submit">Update status</button>
                {statusMsg && <span role="status" style={{ fontSize: 13 }}>{statusMsg}</span>}
              </form>
            )}
          </Section>

          {selectedProjectId && (
            <>
              <Section title="Work breakdown structure"
                description="Self-referencing hierarchy. Actual cost is direct ledger postings to an element plus the recursive rollup of its children.">
                <form onSubmit={submitWbs} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', padding: 12, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}>
                  <Field label="Parent WBS ID" id="wbs-parent" hint="Optional — omit for a root element">
                    <select id="wbs-parent" value={wbsForm.parentId} onChange={(e) => setWbsForm((f) => ({ ...f, parentId: e.target.value }))}>
                      <option value="">— none (root) —</option>
                      {wbsList.map((w) => <option key={w.id} value={w.id}>{w.wbs_code} — {w.wbs_name}</option>)}
                    </select>
                  </Field>
                  <Field label="WBS code" id="wbs-code"><input id="wbs-code" value={wbsForm.wbsCode} onChange={(e) => setWbsForm((f) => ({ ...f, wbsCode: e.target.value }))} /></Field>
                  <Field label="WBS name" id="wbs-name"><input id="wbs-name" value={wbsForm.wbsName} onChange={(e) => setWbsForm((f) => ({ ...f, wbsName: e.target.value }))} /></Field>
                  <Field label="Sequence" id="wbs-seq"><input id="wbs-seq" type="number" value={wbsForm.sequenceNumber} onChange={(e) => setWbsForm((f) => ({ ...f, sequenceNumber: e.target.value }))} style={{ width: 70 }} /></Field>
                  <Field label="Planned cost (₹)" id="wbs-cost"><input id="wbs-cost" type="number" value={wbsForm.plannedCost} onChange={(e) => setWbsForm((f) => ({ ...f, plannedCost: e.target.value }))} /></Field>
                  <Field label="Planned start" id="wbs-start"><input id="wbs-start" type="date" value={wbsForm.plannedStartDate} onChange={(e) => setWbsForm((f) => ({ ...f, plannedStartDate: e.target.value }))} /></Field>
                  <Field label="Planned end" id="wbs-end"><input id="wbs-end" type="date" value={wbsForm.plannedEndDate} onChange={(e) => setWbsForm((f) => ({ ...f, plannedEndDate: e.target.value }))} /></Field>
                  <button type="submit" disabled={!wbsForm.wbsCode || !wbsForm.wbsName}>Add WBS element</button>
                </form>
                {wbsMsg && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 13, marginTop: 8 }}>{wbsMsg}</p>}

                {rollupError ? (
                  <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 12 }}>{rollupError}</p>
                ) : (
                  <div className="overflow-x-auto" style={{ marginTop: 12 }}>
                    {Array.isArray(rollup) && rollup.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <caption style={{ textAlign: 'left', fontWeight: 600, padding: '6px 0' }}>WBS cost rollup</caption>
                        <thead>
                          <tr>
                            <th scope="col" style={{ textAlign: 'left', borderBottom: '2px solid hsl(var(--border))', padding: '6px 8px' }}>Element</th>
                            <th scope="col" style={{ textAlign: 'left', borderBottom: '2px solid hsl(var(--border))', padding: '6px 8px' }}>Status</th>
                            <th scope="col" style={{ textAlign: 'right', borderBottom: '2px solid hsl(var(--border))', padding: '6px 8px' }}>Planned (rollup)</th>
                            <th scope="col" style={{ textAlign: 'right', borderBottom: '2px solid hsl(var(--border))', padding: '6px 8px' }}>Actual (rollup)</th>
                            <th scope="col" style={{ textAlign: 'right', borderBottom: '2px solid hsl(var(--border))', padding: '6px 8px' }}>Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rollup.map((root) => <WbsNode key={root.id} node={root} />)}
                        </tbody>
                      </table>
                    ) : (
                      <p role="status" style={{ color: 'var(--muted,#888)' }}>No WBS elements for this project yet.</p>
                    )}
                  </div>
                )}

                {wbsList.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {wbsList.map((w) => (
                      <span key={w.id} style={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '2px 6px' }}>
                        {w.wbs_code}:
                        <select value={w.status} onChange={(e) => changeWbsStatus(w.id, e.target.value)} style={{ marginLeft: 4, fontSize: 12 }}>
                          {WBS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Milestones">
                {milestoneSummary && (
                  <p style={{ fontSize: 14 }}>
                    Upcoming <Value value={milestoneSummary.counts.upcoming} decimals={0} />
                    {' · '}Overdue <strong style={{ color: milestoneSummary.counts.overdue > 0 ? 'hsl(var(--destructive))' : undefined }}>
                      <Value value={milestoneSummary.counts.overdue} decimals={0} />
                    </strong>
                    {' · '}Completed <Value value={milestoneSummary.counts.completed} decimals={0} />
                    {' · '}Cancelled <Value value={milestoneSummary.counts.cancelled} decimals={0} />
                    {' '}(as of {milestoneSummary.asOfDate})
                  </p>
                )}

                <form onSubmit={submitMilestone} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', padding: 12, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}>
                  <Field label="WBS element" id="ms-wbs" hint="Optional">
                    <select id="ms-wbs" value={milestoneForm.wbsId} onChange={(e) => setMilestoneForm((f) => ({ ...f, wbsId: e.target.value }))}>
                      <option value="">— none —</option>
                      {wbsList.map((w) => <option key={w.id} value={w.id}>{w.wbs_code}</option>)}
                    </select>
                  </Field>
                  <Field label="Milestone name" id="ms-name"><input id="ms-name" value={milestoneForm.milestoneName} onChange={(e) => setMilestoneForm((f) => ({ ...f, milestoneName: e.target.value }))} /></Field>
                  <Field label="Target date" id="ms-date"><input id="ms-date" type="date" value={milestoneForm.targetDate} onChange={(e) => setMilestoneForm((f) => ({ ...f, targetDate: e.target.value }))} /></Field>
                  <Field label="Notes" id="ms-notes" hint="Optional"><input id="ms-notes" value={milestoneForm.notes} onChange={(e) => setMilestoneForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
                  <button type="submit" disabled={!milestoneForm.milestoneName || !milestoneForm.targetDate}>Add milestone</button>
                </form>
                {milestoneMsg && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 13, marginTop: 8 }}>{milestoneMsg}</p>}

                {milestonesError ? (
                  <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 12 }}>{milestonesError}</p>
                ) : (
                  <DataTable
                    caption="Milestones"
                    emptyMessage="No milestones recorded for this project yet."
                    columns={[
                      { key: 'milestone_name', label: 'Milestone' },
                      { key: 'target_date', label: 'Target', render: (r) => String(r.target_date).slice(0, 10) },
                      { key: 'status', label: 'Status' },
                      { key: 'actual_completion_date', label: 'Completed', render: (r) => (r.actual_completion_date ? String(r.actual_completion_date).slice(0, 10) : '—') },
                      {
                        key: 'actions', label: 'Actions',
                        render: (r) => (r.status === 'completed' || r.status === 'cancelled' ?
                          '—' :
                          <button type="button" onClick={() => completeMilestone(r.id)}>Mark complete</button>),
                      },
                    ]}
                    rows={Array.isArray(milestones) ? milestones : []}
                    rowKey={(r) => r.id}
                  />
                )}
              </Section>

              <Section title="Project budget vs. actual"
                description="Actual is the live sum of posted journal lines tagged with this project (WBS-tagged or not) — never stored.">
                {budgetVsActual?.error ? (
                  <p role="alert" style={{ color: 'hsl(var(--destructive))' }}>{budgetVsActual.error}</p>
                ) : budgetVsActual ? (
                  <p style={{ fontSize: 15 }}>
                    Budget <strong><Rupees value={budgetVsActual.budgetAmount} /></strong>
                    {' · '}Actual <strong><Rupees value={budgetVsActual.actualAmount} /></strong>
                    {' · '}
                    <strong style={{ color: budgetVsActual.variance > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--data-real))' }}>
                      variance <Rupees value={budgetVsActual.variance} />
                      {budgetVsActual.variancePct !== null && ` (${budgetVsActual.variancePct}%)`}
                    </strong>
                  </p>
                ) : (
                  <p role="status" style={{ color: 'var(--muted,#888)' }}>No data.</p>
                )}
              </Section>
            </>
          )}
        </>
      )}
    </ModulePage>
  );
}
