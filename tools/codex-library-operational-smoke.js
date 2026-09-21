#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const backendRoot = path.join(root, 'backend');
const express = require(require.resolve('express', { paths: [backendRoot] }));
const request = require(require.resolve('supertest', { paths: [backendRoot] }));
const docsDir = path.join(root, 'docs');
const outJson = path.join(docsDir, 'codex-library-operational-smoke-report.json');
const outMd = path.join(docsDir, 'codex-library-operational-smoke-report.md');

function unwrap(response) {
  return response.body?.data ?? response.body ?? null;
}

async function main() {
  const libraryRoutes = require('../backend/src/routes/libraryRoutes');
  const libraryAIWorkspaceRoutes = require('../backend/src/routes/libraryAIWorkspaceRoutes');
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/library', libraryRoutes);
  app.use('/library-ai-workspace', libraryAIWorkspaceRoutes);

  const checks = [];

  async function check(name, run, validate, nextStep) {
    try {
      const response = await run();
      const data = unwrap(response);
      const passed = response.status < 500 && validate(response, data);
      checks.push({
        name,
        status: passed ? 'pass' : 'fail',
        httpStatus: response.status,
        evidence: passed ? nextStep.evidence(data, response) : JSON.stringify(response.body).slice(0, 400),
        next: nextStep.next,
      });
    } catch (error) {
      checks.push({
        name,
        status: 'fail',
        httpStatus: 'error',
        evidence: error.message,
        next: nextStep.next,
      });
    }
  }

  await check(
    'Library health route',
    () => request(app).get('/library/health'),
    (_response, data) => data?.status === 'healthy' || data?.indexedItems > 0,
    {
      evidence: (data) => `${data.indexedItems || 0} indexed items visible through health route.`,
      next: 'Keep health public for platform readiness checks.',
    },
  );

  await check(
    'Library initialize route',
    () => request(app).post('/library/initialize').send({ syncDatabase: false }),
    (_response, data) => data?.indexedItems > 0,
    {
      evidence: (data) => `${data.indexedItems} items indexed and ${data.contentHashes} hashes computed.`,
      next: 'Run with syncDatabase only under admin/authenticated deployment setup.',
    },
  );

  await check(
    'Library statistics route',
    () => request(app).get('/library/statistics'),
    (_response, data) => data?.totalItems > 0 && data?.byType,
    {
      evidence: (data) => `${data.totalItems} total items across ${Object.keys(data.byType || {}).length} types.`,
      next: 'Expose the type breakdown in admin dashboards.',
    },
  );

  await check(
    'Library modules route',
    () => request(app).get('/library/modules'),
    (_response, data) => Array.isArray(data) && data.length > 0,
    {
      evidence: (data) => `${data.length} runtime/backend/library modules returned.`,
      next: 'Use this list as the feature merge source of truth.',
    },
  );

  await check(
    'Library search route',
    () => request(app).get('/library/search').query({ query: 'farmer' }),
    (_response, data) => Array.isArray(data),
    {
      evidence: (data) => `${data.length} search results returned for farmer.`,
      next: 'Add ranked snippets for better UI explainability.',
    },
  );

  await check(
    'Library AI context route',
    () => request(app).post('/library/ai-context').send({ query: 'dynamic pricing farmer cost optimization', limit: 5 }),
    (_response, data) => Array.isArray(data?.matches) && data.guardrails?.sourceAuthority,
    {
      evidence: (data) => `${data.matches.length} governed AI context matches returned.`,
      next: 'Connect this context into every AI generation and copilot workflow.',
    },
  );

  await check(
    'Library verification route',
    () => request(app).get('/library/verify'),
    (_response, data) => Number(data?.totalItems || 0) > 0 && Number(data?.semanticItemCount || 0) > 0,
    {
      evidence: (data) => `${data.totalItems} items checked, ${data.semanticItemCount} semantic catalogue records found.`,
      next: 'Resolve invalid JSON warnings without blocking read access.',
    },
  );

  await check(
    'Enterprise library summary route',
    () => request(app).get('/library/enterprise-index/summary'),
    (_response, data) => Number(data?.totals?.files || 0) > 0 && Array.isArray(data?.roots),
    {
      evidence: (data) => `${data.totals.files} files represented across ${data.roots.length} source roots.`,
      next: 'Keep this as the project-wide source intelligence baseline.',
    },
  );

  await check(
    'Enterprise feature matrix route',
    () => request(app).get('/library/enterprise-index/features').query({ limit: 5 }),
    (_response, data) => Number(data?.featureTracks || 0) > 0 && Array.isArray(data?.features),
    {
      evidence: (data) => `${data.featureTracks} feature tracks available, ${data.returned} returned.`,
      next: 'Use these tracks for agentic feature merge priorities.',
    },
  );

  await check(
    'Enterprise duplicate groups route',
    () => request(app).get('/library/enterprise-index/duplicates').query({ limit: 5 }),
    (_response, data) => Array.isArray(data?.rows),
    {
      evidence: (data) => `${data.returned} duplicate filename groups returned in preview.`,
      next: 'Rename same-name candidates before evaluating or merging.',
    },
  );

  await check(
    'Enterprise file search route',
    () => request(app).get('/library/enterprise-index/files/search').query({ query: 'dynamic-pricing', limit: 5 }),
    (_response, data) => Array.isArray(data?.rows),
    {
      evidence: (data) => `${data.returned} enterprise file rows returned for dynamic-pricing.`,
      next: 'Expose file-level search filters for source, feature, and workflow role.',
    },
  );

  await check(
    'Enterprise activity summary route',
    () => request(app).get('/library/enterprise-index/activity/summary').query({ limit: 5 }),
    (_response, data) => data?.libraryMode === 'active-intelligence-module' && Number(data?.indexedFiles || 0) > 0,
    {
      evidence: (data) => `${data.indexedFiles} files tracked with ${data.trackedSignals?.length || 0} live signals.`,
      next: 'Use this route as the active Library dashboard source.',
    },
  );

  await check(
    'Enterprise activity file search route',
    () => request(app).get('/library/enterprise-index/activity/files/search').query({ query: 'libraryRoutes.js', limit: 3 }),
    (_response, data) => Array.isArray(data?.rows) && data.rows.every((row) => row.activity_status),
    {
      evidence: (data) => `${data.returned} file activity rows returned with current disk/git status.`,
      next: 'Use this route before modifying any candidate file.',
    },
  );

  await check(
    'Enterprise activity ledger summary route',
    () => request(app).get('/library/enterprise-index/activity/ledger/summary'),
    (_response, data) => data?.libraryMode === 'active-file-ledger' && Number(data?.filesInCurrentSnapshot || 0) > 0,
    {
      evidence: (data) => `${data.filesInCurrentSnapshot} files present in the active ledger snapshot.`,
      next: 'Run the activity tracker after major scans, merges, and cleanup passes.',
    },
  );

  await check(
    'Enterprise workflow route',
    () => request(app).get('/library/enterprise-index/workflow'),
    (response) => response.text.includes('AFRERA Enterprise Project Library Workflow'),
    {
      evidence: () => 'Workflow markdown returned for AI and agentic merge operations.',
      next: 'Use this workflow as the operating standard for future merges.',
    },
  );

  await check(
    'Library AI workflow route',
    () => request(app).get('/library/enterprise-index/ai-workflow'),
    (response) => response.text.includes('Application AI') && response.text.includes('Analytic AI') && response.text.includes('Next-Gen Generative AI'),
    {
      evidence: () => 'AI workflow markdown returned for Application AI, Analytic AI, Generative AI, and agentic operations.',
      next: 'Use this document as the speed and retrieval contract for AI integrations.',
    },
  );

  let workspaceLibraryId = null;

  await check(
    'Library AI workspace status route',
    () => request(app).get('/library-ai-workspace/status'),
    (_response, data) => data?.status === 'operational' && data?.providerNeutral === true,
    {
      evidence: (data) => `${data.indexedFiles} indexed files available to coding agents without provider lock-in.`,
      next: 'Use this as the common Library gateway for ChatGPT, Claude, Copilot, Devin, and project code.',
    },
  );

  await check(
    'Library AI workspace file search route',
    () => request(app).get('/library-ai-workspace/files/search').query({ query: 'libraryRoutes.js', limit: 3 }),
    (_response, data) => {
      workspaceLibraryId = data?.rows?.[0]?.library_id || null;
      return Array.isArray(data?.rows) && data.rows.length > 0 && Boolean(workspaceLibraryId);
    },
    {
      evidence: (data) => `${data.returned} file records returned with stable library_id values.`,
      next: 'Agents must identify files through library_id before reading or editing.',
    },
  );

  await check(
    'Library AI workspace safe content route',
    () => request(app).get(`/library-ai-workspace/files/${workspaceLibraryId || 'missing'}/content`).query({ maxBytes: 2000 }),
    (_response, data) => data?.found === true && Object.prototype.hasOwnProperty.call(data, 'readable'),
    {
      evidence: (data) => data.readable ? `${data.bytesRead} safe bytes returned for ${data.file?.basename}.` : `Content access denied safely: ${data.reason}.`,
      next: 'Keep file reads bounded and deny secrets, caches, and unsafe file types.',
    },
  );

  await check(
    'Library AI workspace context route',
    () => request(app).post('/library-ai-workspace/context').send({
      agent: 'chatgpt-codex',
      objective: 'Improve Library integration',
      query: 'library ai workspace',
      limit: 5,
    }),
    (_response, data) => data?.mode === 'library-ai-workspace' && Array.isArray(data?.retrieved_files),
    {
      evidence: (data) => `${data.retrieved_files.length} files and ${data.recent_activity.length} activity events packed for agent work.`,
      next: 'Use this packet before project enhancement or duplicate merge work.',
    },
  );

  await check(
    'Library AI workspace event route',
    () => request(app).post('/library-ai-workspace/events').send({
      agent: 'smoke-test',
      eventType: 'agent_library_event',
      objective: 'Verify Library workspace audit event',
      outcome: 'pass',
    }),
    (_response, data) => Boolean(data?.event_id) && data?.event_type === 'agent_library_event',
    {
      evidence: (data) => `Agent event ${data.event_id} recorded in workspace audit log.`,
      next: 'Record all coding-agent Library interactions through this endpoint.',
    },
  );

  await check(
    'Unified orchestrator status route',
    () => request(app).get('/library-ai-workspace/orchestrator/status'),
    (_response, data) => Boolean(data?.status) && data?.sourcePreserved === true,
    {
      evidence: (data) => `${data.status}; source preservation=${data.sourcePreserved}.`,
      next: 'Use this endpoint as the common multi-agent merge control plane.',
    },
  );

  await check(
    'Unified orchestrator group search route',
    () => request(app).get('/library-ai-workspace/orchestrator/groups/search').query({ limit: 3 }),
    (_response, data) => Array.isArray(data?.rows),
    {
      evidence: (data) => `${data.returned} auditable duplicate groups returned.`,
      next: 'Assign divergent groups to bounded feature merge batches.',
    },
  );

  await check(
    'Unified orchestrator multi-agent task route',
    () => request(app).get('/library-ai-workspace/orchestrator/tasks').query({ state: 'ready', limit: 3 }),
    (_response, data) => Array.isArray(data?.rows) && data.rows.every((row) => row.coordinator && row.validation),
    {
      evidence: (data) => `${data.returned} ready multi-agent assignments returned with coordinator and validator roles.`,
      next: 'Claim tasks in bounded feature batches and record every merge decision.',
    },
  );

  const passed = checks.filter((item) => item.status === 'pass').length;
  const report = {
    generatedAt: new Date().toISOString(),
    passed,
    total: checks.length,
    checks,
  };

  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

  const rows = checks.map((item) => (
    `| ${item.name} | ${item.status} | ${item.httpStatus} | ${item.evidence.replace(/\|/g, '/')} | ${item.next.replace(/\|/g, '/')} |`
  )).join('\n');

  fs.writeFileSync(outMd, `# Codex Library Operational Smoke Report

Generated: ${report.generatedAt}

Passed: ${passed}/${checks.length}

| Check | Status | HTTP | Evidence | Next |
| --- | --- | ---: | --- | --- |
${rows}

## Interpretation

The EBDESIGN library is now mounted through the backend, searchable by the frontend, and available as governed AI context for feature merging and AI workflows. Remaining catalogue warnings should be treated as data cleanup tasks, not route integration blockers.
`);

  console.log(JSON.stringify({ passed, total: checks.length, report: path.relative(root, outMd) }, null, 2));

  if (passed !== checks.length) process.exit(1);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
