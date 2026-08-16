<#
.SYNOPSIS
  Staged, validated dependency modernization for AFRERA (backend + frontend).

.DESCRIPTION
  This deliberately does NOT do `npm install everything@latest` in one shot.
  Each -Stage is a separate, increasing-risk group. Run them one at a time,
  in order, and actually look at the output before moving to the next one.
  Every stage that changes package.json validates the backend still parses
  and the frontend still builds before it lets you commit.

  Background: this repo already went through a full boot/build recovery
  this session after an unrelated concurrent-edit corruption. The dependency
  debt below (47 packages needing a major-version bump, plus real security
  advisories) is genuine and was measured with `npm outdated` / `npm audit`,
  not estimated. See docs/registry/ROUTE_RECONCILIATION.md and the session's
  commit history for the recovery this sits on top of.

.PARAMETER Stage
  Status               - read-only: prints outdated + audit reports for both projects.
  SecurityPatches      - `npm audit fix` (no --force) on both. Safe, non-breaking.
  MinorUpdates         - `npm update` on both. Stays within each package's declared
                          semver range in package.json, so it cannot cross a major
                          version on its own. Safe.
  MajorGroup1-Testing  - Upgrades dev/test tooling only (jest, vitest, eslint,
                          testing-library, etc.) to latest major. Lowest risk of the
                          major-version groups: none of this ships to production, so
                          a regression here can't break the live app. Still requires
                          you to actually run the test suites afterward.
  MajorGroup2-BuildTools - Vite 5->8 and its SWC plugin. Real breaking migration
                          (config shape + plugin API + Rollup version all change).
                          Installs only; read the Vite migration guide before your
                          next build.
  MajorGroup3-Framework  - Prints guidance only. React 19 / Express 5 / React Router 7
                          are each a separate, real migration. This script will not
                          silently do all three in one pass - it tells you the
                          install command for one and stops.

.EXAMPLE
  powershell -File scripts\dependency-modernization.ps1 -Stage Status
  powershell -File scripts\dependency-modernization.ps1 -Stage SecurityPatches
#>

param(
  [ValidateSet('Status', 'SecurityPatches', 'MinorUpdates', 'MajorGroup1-Testing', 'MajorGroup2-BuildTools', 'MajorGroup3-Framework')]
  [string]$Stage = 'Status'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

function Assert-CleanGit {
  Set-Location $root
  $status = git status --porcelain
  if ($status) {
    Write-Warning "Working tree is not clean. Commit or stash changes before running a dependency stage, so a bad upgrade is easy to `git reset --hard` away from."
    Write-Host $status
    exit 1
  }
}

function Test-BackendSyntax {
  Write-Host "`nChecking every backend .js file still parses..." -ForegroundColor Cyan
  Set-Location $backend
  $failed = $false
  Get-ChildItem -Recurse -Filter *.js -Path (Join-Path $backend 'src') |
    Where-Object { $_.FullName -notmatch 'node_modules' } |
    ForEach-Object {
      node --check $_.FullName
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "Syntax error: $($_.FullName)"
        $failed = $true
      }
    }
  if ($failed) { throw "Backend has syntax errors after this stage. Do not commit - fix or roll back first." }
  Write-Host "Backend syntax OK." -ForegroundColor Green
}

function Test-FrontendBuilds {
  Write-Host "`nRunning a real frontend build..." -ForegroundColor Cyan
  Set-Location $frontend
  npx vite build --logLevel error
  if ($LASTEXITCODE -ne 0) { throw "Frontend build failed after this stage. Do not commit - fix or roll back first." }
  Write-Host "Frontend build OK." -ForegroundColor Green
}

function New-Checkpoint([string]$Message) {
  Set-Location $root
  git add backend/package.json backend/package-lock.json frontend/package.json frontend/package-lock.json
  git commit -m $Message
  Write-Host "`nCommitted checkpoint: $Message" -ForegroundColor Green
}

switch ($Stage) {

  'Status' {
    Write-Host "=== Backend: npm outdated ===" -ForegroundColor Yellow
    Set-Location $backend
    npm outdated
    Write-Host "`n=== Frontend: npm outdated ===" -ForegroundColor Yellow
    Set-Location $frontend
    npm outdated
    Write-Host "`n=== Backend: npm audit ===" -ForegroundColor Yellow
    Set-Location $backend
    npm audit
    Write-Host "`n=== Frontend: npm audit ===" -ForegroundColor Yellow
    Set-Location $frontend
    npm audit
  }

  'SecurityPatches' {
    Assert-CleanGit
    Write-Host "`nApplying non-breaking security fixes (no --force)..." -ForegroundColor Cyan
    Set-Location $backend
    npm audit fix
    Set-Location $frontend
    npm audit fix
    Test-BackendSyntax
    Test-FrontendBuilds
    New-Checkpoint "Apply safe non-breaking security patches (npm audit fix)"
  }

  'MinorUpdates' {
    Assert-CleanGit
    Write-Host "`nApplying patch/minor updates within each package's declared semver range..." -ForegroundColor Cyan
    Set-Location $backend
    npm update
    Set-Location $frontend
    npm update
    Test-BackendSyntax
    Test-FrontendBuilds
    New-Checkpoint "Apply safe patch/minor dependency updates (npm update)"
  }

  'MajorGroup1-Testing' {
    Assert-CleanGit
    Write-Host "`nUpgrading dev/test tooling to latest major (does not ship to production)..." -ForegroundColor Cyan
    Set-Location $backend
    npm install --save-dev jest@latest @types/jest@latest supertest@latest eslint@latest
    Set-Location $frontend
    npm install --save-dev vitest@latest '@vitest/ui@latest' '@testing-library/react@latest' '@testing-library/jest-dom@latest' jsdom@latest c8@latest eslint@latest eslint-plugin-react-hooks@latest
    Test-BackendSyntax
    Test-FrontendBuilds
    Write-Host "`nBuild/syntax is clean, but that does NOT mean the test suites still pass." -ForegroundColor Yellow
    Write-Host "Run 'npm test' in backend/ and frontend/ by hand now, fix whatever the new" -ForegroundColor Yellow
    Write-Host "major versions broke (Jest 30, Vitest 4, and Testing Library all changed" -ForegroundColor Yellow
    Write-Host "config/matcher behavior), THEN commit yourself - not auto-committed here." -ForegroundColor Yellow
  }

  'MajorGroup2-BuildTools' {
    Assert-CleanGit
    Write-Host "`nInstalling Vite 8 and its SWC plugin..." -ForegroundColor Cyan
    Set-Location $frontend
    npm install --save-dev vite@latest '@vitejs/plugin-react-swc@latest'
    Write-Host "`nDo not expect this to build yet." -ForegroundColor Red
    Write-Host "Read https://vite.dev/guide/migration.html - vite.config.js's plugin" -ForegroundColor Red
    Write-Host "options and the manualChunks logic almost certainly need hand edits" -ForegroundColor Red
    Write-Host "for Vite 5 -> 8 (three major versions). Fix, then:" -ForegroundColor Red
    Write-Host "  npx vite build --logLevel error" -ForegroundColor Yellow
    Write-Host "before committing." -ForegroundColor Red
  }

  'MajorGroup3-Framework' {
    Write-Host "Framework upgrades are the highest-risk group and are intentionally" -ForegroundColor Red
    Write-Host "NOT scripted past a single install command. React 19, Express 5, and" -ForegroundColor Red
    Write-Host "React Router 7 are each a real, separate migration with their own" -ForegroundColor Red
    Write-Host "breaking-change guide. Do ONE at a time, in its own commit, validated" -ForegroundColor Red
    Write-Host "with a real build/boot before starting the next." -ForegroundColor Red
    Write-Host ""
    Write-Host "React 19 (frontend) - read https://react.dev/blog/2024/04/25/react-19-upgrade-guide first:" -ForegroundColor Yellow
    Write-Host "  cd frontend"
    Write-Host "  npm install react@latest react-dom@latest @types/react@latest @types/react-dom@latest"
    Write-Host ""
    Write-Host "Express 5 (backend) - read https://expressjs.com/en/guide/migrating-5.html first:" -ForegroundColor Yellow
    Write-Host "  cd backend"
    Write-Host "  npm install express@latest"
    Write-Host ""
    Write-Host "React Router 7 (frontend, do AFTER React 19 is stable) - read" -ForegroundColor Yellow
    Write-Host "https://reactrouter.com/upgrading/v6 first:" -ForegroundColor Yellow
    Write-Host "  cd frontend"
    Write-Host "  npm install react-router-dom@latest"
  }
}
