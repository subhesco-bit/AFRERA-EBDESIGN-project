const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const outCsv = path.join(docsDir, 'codex-file-map.csv');
const outJson = path.join(docsDir, 'codex-project-map.json');
const outMd = path.join(docsDir, 'codex-project-map.md');

const SKIP_DIRS = new Set(['.git']);

function toRel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function csv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function readJsonIfExists(relPath) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath, files);
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      files.push({
        path: toRel(fullPath),
        ext: path.extname(entry.name).toLowerCase(),
        bytes: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  }
  return files;
}

function classify(file) {
  const p = file.path;
  const lower = p.toLowerCase();
  const name = path.basename(lower);

  if (lower.includes('/node_modules/')) return ['dependency_cache', 'Installed package dependency; regenerate with npm install.'];
  if (lower.includes('/dist/') || lower.startsWith('frontend/dist/')) return ['build_output', 'Generated web build output.'];
  if (lower.startsWith('backups/') || lower.includes('/backup')) return ['backup_or_archive', 'Historical backup/archive; inspect only for recovery.'];
  if (lower.includes('/.claude/') || lower.includes('/.devin/') || lower.includes('/.vibecheck/') || lower.startsWith('.ai/') || lower.startsWith('.audit/')) {
    return ['agent_workspace_noise', 'AI/tooling workspace output, not core runtime.'];
  }
  if (lower.endsWith('.log') || lower.includes('audit-run-output') || lower.includes('boot') || lower.includes('lint-current')) {
    return ['log_or_report_output', 'Generated logs or one-off tool output.'];
  }
  if (lower.startsWith('frontend/src/')) {
    if (lower.includes('/__tests__/') || lower.includes('/test/')) return ['frontend_tests', 'Frontend test coverage.'];
    if (lower.includes('/pages/')) return ['frontend_page', 'User-facing React page.'];
    if (lower.includes('/components/')) return ['frontend_component', 'Reusable React UI component.'];
    if (lower.includes('/services/')) return ['frontend_api_client', 'Frontend service/API integration.'];
    if (lower.includes('/store') || lower.includes('/stores/')) return ['frontend_state', 'Frontend state management.'];
    if (lower.includes('/config/') || lower.includes('/router/')) return ['frontend_routing_config', 'Frontend route/config layer.'];
    return ['frontend_runtime', 'React/Vite runtime source.'];
  }
  if (lower.startsWith('frontend/android/')) return ['mobile_android_wrapper', 'Capacitor Android app wrapper.'];
  if (lower.startsWith('frontend/src-tauri/')) return ['desktop_tauri_wrapper', 'Tauri desktop app wrapper.'];
  if (lower.startsWith('backend/src/')) {
    if (lower.includes('/__tests__/') || lower.includes('/tests/') || lower.includes('/test/')) return ['backend_tests', 'Backend test coverage.'];
    if (lower.includes('/modules/')) return ['backend_module', 'Backend numbered/business module.'];
    if (lower.includes('/routes/')) return ['backend_route', 'Express route registration.'];
    if (lower.includes('/services/')) return ['backend_service', 'Backend business service.'];
    if (lower.includes('/database/')) return ['backend_database', 'Backend database connection, migrations, or schema code.'];
    if (lower.includes('/middleware/')) return ['backend_middleware', 'Backend Express middleware.'];
    return ['backend_runtime', 'Backend runtime source.'];
  }
  if (lower.startsWith('database/')) return ['database_asset', 'Canonical database migrations, inventory, and registry.'];
  if (lower.startsWith('infra/') || lower.startsWith('.github/') || name.startsWith('docker') || name === 'dockerfile' || lower.endsWith('.yml') || lower.endsWith('.yaml') || lower === 'nginx.conf' || lower === 'render.yaml') {
    return ['infra_deployment', 'Deployment, CI/CD, Docker, Kubernetes, Terraform, or hosting asset.'];
  }
  if (lower.startsWith('docs/registry/')) return ['registry_documentation', 'Generated or curated engineering registry.'];
  if (lower.startsWith('docs/') || lower.startsWith('documentation/') || lower.endsWith('.md')) {
    const generatedWords = ['complete', 'final', 'audit', 'status', 'report', 'summary', 'resolution', 'roadmap', 'checklist'];
    const isGenerated = generatedWords.some(word => name.includes(word));
    return [isGenerated ? 'historical_report' : 'project_documentation', isGenerated ? 'Historical audit/status/report; evidence but not runtime.' : 'Product, architecture, or implementation documentation.'];
  }
  if (lower.startsWith('tools/') || lower.startsWith('scripts/') || lower.endsWith('.ps1') || lower.endsWith('.bat') || lower.endsWith('.sh') || lower.endsWith('.js')) {
    return ['automation_tooling', 'Local repair, audit, generation, or workflow tooling.'];
  }
  if (lower.startsWith('config/') || lower.startsWith('shared/') || lower.startsWith('modules/') || lower.startsWith('manifests/')) {
    return ['shared_config_or_manifest', 'Cross-platform configuration, manifests, or shared module assets.'];
  }
  if (lower.endsWith('.csv') || lower.endsWith('.json') || lower.endsWith('.sql')) return ['data_or_registry', 'Structured data, registry, or SQL evidence.'];
  return ['uncategorized', 'Requires manual review.'];
}

function summarize(files) {
  const summary = {
    generatedAt: new Date().toISOString(),
    root,
    counts: {
      totalFiles: files.length,
      totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
    },
    byCategory: {},
    byTopLevel: {},
    coreRuntime: {},
    packages: {
      frontend: readJsonIfExists('frontend/package.json'),
      backend: readJsonIfExists('backend/package.json'),
    },
    platformTargets: {
      web: fs.existsSync(path.join(root, 'frontend/index.html')) && fs.existsSync(path.join(root, 'frontend/src/App.jsx')),
      mobileAndroid: fs.existsSync(path.join(root, 'frontend/capacitor.config.json')) && fs.existsSync(path.join(root, 'frontend/android')),
      desktopTauri: fs.existsSync(path.join(root, 'frontend/src-tauri/tauri.conf.json')),
      backendApi: fs.existsSync(path.join(root, 'backend/src/index.js')),
      database: fs.existsSync(path.join(root, 'database/registry/DATABASE_ARCHITECTURE_REGISTRY.json')),
    },
  };

  for (const file of files) {
    summary.byCategory[file.category] = (summary.byCategory[file.category] || 0) + 1;
    const top = file.path.split('/')[0] || '.';
    summary.byTopLevel[top] = (summary.byTopLevel[top] || 0) + 1;
  }

  const frontendSrc = files.filter(f => f.path.startsWith('frontend/src/'));
  const backendSrc = files.filter(f => f.path.startsWith('backend/src/'));
  summary.coreRuntime = {
    frontendPages: frontendSrc.filter(f => f.category === 'frontend_page').length,
    frontendComponents: frontendSrc.filter(f => f.category === 'frontend_component').length,
    frontendServices: frontendSrc.filter(f => f.category === 'frontend_api_client').length,
    backendRoutes: backendSrc.filter(f => f.category === 'backend_route').length,
    backendServices: backendSrc.filter(f => f.category === 'backend_service').length,
    backendModules: backendSrc.filter(f => f.category === 'backend_module').length,
    databaseAssets: files.filter(f => f.category === 'database_asset').length,
    infraDeploymentAssets: files.filter(f => f.category === 'infra_deployment').length,
    mobileAndroidFiles: files.filter(f => f.category === 'mobile_android_wrapper').length,
    desktopTauriFiles: files.filter(f => f.category === 'desktop_tauri_wrapper').length,
  };

  return summary;
}

function markdown(summary) {
  const categoryRows = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  const topRows = Object.entries(summary.byTopLevel)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  return `# Codex Project Rescue Map

Generated: ${summary.generatedAt}

## Executive Read

AFRERA is a real multi-target platform, but the repository is mixed with generated reports, dependency caches, build outputs, backups, and agent/tooling workspaces. The useful product core is:

- Web app: React 18 + Vite in \`frontend/src\`
- Mobile app: Capacitor Android wrapper in \`frontend/android\`
- Desktop app: Tauri wrapper in \`frontend/src-tauri\`
- API platform: Node/Express backend in \`backend/src\`
- Database: PostgreSQL-first canonical assets in \`database\`
- Infra: Docker, Render, GitHub Actions, Kubernetes, Terraform, and nginx assets
- Architecture registry: \`docs/registry\` and \`database/registry\`

## Verified Platform Targets

| Target | Present |
|---|---:|
| Web | ${summary.platformTargets.web ? 'yes' : 'no'} |
| Mobile Android | ${summary.platformTargets.mobileAndroid ? 'yes' : 'no'} |
| Desktop Tauri | ${summary.platformTargets.desktopTauri ? 'yes' : 'no'} |
| Backend API | ${summary.platformTargets.backendApi ? 'yes' : 'no'} |
| Database assets | ${summary.platformTargets.database ? 'yes' : 'no'} |

## Core Runtime Counts

| Area | Count |
|---|---:|
| Frontend pages | ${summary.coreRuntime.frontendPages} |
| Frontend components | ${summary.coreRuntime.frontendComponents} |
| Frontend services | ${summary.coreRuntime.frontendServices} |
| Backend routes | ${summary.coreRuntime.backendRoutes} |
| Backend services | ${summary.coreRuntime.backendServices} |
| Backend module files | ${summary.coreRuntime.backendModules} |
| Database assets | ${summary.coreRuntime.databaseAssets} |
| Infra/deployment assets | ${summary.coreRuntime.infraDeploymentAssets} |
| Android wrapper files | ${summary.coreRuntime.mobileAndroidFiles} |
| Tauri wrapper files | ${summary.coreRuntime.desktopTauriFiles} |

## Category Inventory

| Category | Files |
|---|---:|
${categoryRows}

## Largest Top-Level Buckets

| Path | Files |
|---|---:|
${topRows}

## Keep / Use

- \`frontend/src/pages\`, \`frontend/src/components\`, \`frontend/src/services\`, \`frontend/src/config/routes.js\`
- \`backend/src/index.js\`, \`backend/src/routes\`, \`backend/src/services\`, \`backend/src/modules\`, \`backend/src/database\`
- \`database/migrations/canonical\`, \`database/registry\`, \`database/docs\`
- \`frontend/capacitor.config.json\`, \`frontend/android\`, \`frontend/src-tauri\`
- \`docker-compose*.yml\`, \`Dockerfile\`, \`.github/workflows\`, \`infra\`, \`render.yaml\`, \`nginx.conf\`
- \`docs/registry\`, \`docs/API_DOCUMENTATION.md\`, \`docs/DESIGN_SYSTEM.md\`, \`docs/architecture\`

## Treat As Junk Or Evidence

- \`node_modules\`: dependency cache, never source of truth
- \`frontend/dist\`: generated output, rebuild from source
- \`backups\`: recovery-only
- Root \`*_REPORT.md\`, \`*_STATUS.md\`, \`*_SUMMARY.md\`, \`*_CHECKLIST.md\`: evidence/planning, not runtime
- \`.claude\`, \`.devin\`, \`.ai\`, \`.audit\`, \`.vibecheck\`: agent workspace output
- One-off fixer/generator scripts in root: use only after reading and verifying

## Build Notes

- Frontend build currently succeeds with \`npm run build\` from \`frontend\`.
- Backend entry files pass \`node --check\`, but runtime API health still depends on service loading and configured databases.
- The mobile and desktop apps are wrappers around the same Vite web build, so hardening the web runtime improves all three targets.

Full file-level inventory: \`docs/codex-file-map.csv\`
Machine-readable summary: \`docs/codex-project-map.json\`
`;
}

fs.mkdirSync(docsDir, { recursive: true });
const files = walk(root).map(file => {
  const [category, note] = classify(file);
  return { ...file, category, note };
});
const summary = summarize(files);

fs.writeFileSync(
  outCsv,
  ['path,category,extension,bytes,modified,note']
    .concat(files.map(file => [file.path, file.category, file.ext, file.bytes, file.modified, file.note].map(csv).join(',')))
    .join('\n'),
);
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));
fs.writeFileSync(outMd, markdown(summary));

console.log(JSON.stringify({
  csv: toRel(outCsv),
  json: toRel(outJson),
  markdown: toRel(outMd),
  totalFiles: summary.counts.totalFiles,
  coreRuntime: summary.coreRuntime,
}, null, 2));
