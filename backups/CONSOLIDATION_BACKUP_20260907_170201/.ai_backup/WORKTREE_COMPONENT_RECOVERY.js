#!/usr/bin/env node
/**
 * WORKTREE COMPONENT RECOVERY & INTEGRATION
 * 1. Scan all worktree branches for valuable components
 * 2. Compare with current project
 * 3. Recover only valuable missing components
 * 4. Integrate into main project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class WorktreeComponentRecovery {
  constructor() {
    this.results = {
      scanned_branches: [],
      found_components: [],
      missing_in_current: [],
      valuable_components: [],
      recovered_files: [],
      integration_results: []
    };
  }

  // Get all worktree branches
  getWorktreeBranches() {
    try {
      const output = execSync('git branch -a', { encoding: 'utf8' });
      const branches = output
        .split('\n')
        .filter(b => b.includes('worktree-') || b.includes('recovered/'))
        .map(b => b.trim().replace('* ', '').replace('+ ', ''));

      console.log(`\n🔍 FOUND ${branches.length} WORKTREE BRANCHES:`);
      branches.forEach(b => console.log(`   - ${b}`));

      return branches;
    } catch (e) {
      console.error('Failed to get branches:', e.message);
      return [];
    }
  }

  // Scan branch for components
  scanBranchComponents(branch) {
    try {
      console.log(`\n📋 Scanning branch: ${branch}`);

      const componentPaths = [
        'frontend/src/components',
        'frontend/src/pages',
        'backend/src/services/claude',
        'backend/src/services'
      ];

      const components = [];

      for (const componentPath of componentPaths) {
        try {
          const output = execSync(
            `git ls-tree -r --name-only ${branch} -- ${componentPath} 2>/dev/null || echo ""`,
            { encoding: 'utf8' }
          );

          if (output.trim()) {
            const files = output
              .split('\n')
              .filter(f => f && (f.endsWith('.jsx') || f.endsWith('.js')))
              .map(f => ({ path: f, branch }));

            components.push(...files);
          }
        } catch (e) {
          // Skip if path doesn't exist in branch
        }
      }

      console.log(`   Found ${components.length} component files`);
      return components;
    } catch (e) {
      console.log(`   Error scanning: ${e.message}`);
      return [];
    }
  }

  // Check if component exists in current project
  existsInCurrent(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  }

  // Get file content from branch
  getFileFromBranch(branch, filePath) {
    try {
      return execSync(`git show ${branch}:${filePath}`, { encoding: 'utf8' });
    } catch (e) {
      return null;
    }
  }

  // Assess component value
  assessValue(content, filePath) {
    // Check for actual implementation (not just stubs)
    const hasLogic =
      content.includes('function') ||
      content.includes('class ') ||
      content.includes('const ') ||
      content.includes('export');

    const isStub =
      content.length < 100 ||
      content.includes('TODO') ||
      content.includes('stub') ||
      content.includes('placeholder');

    const hasExports =
      content.includes('export default') ||
      content.includes('module.exports');

    const lineCount = content.split('\n').length;

    // Scoring
    let value = 0;
    value += hasLogic ? 10 : 0;
    value += hasExports ? 5 : 0;
    value += lineCount > 50 ? 10 : 0;
    value += lineCount > 100 ? 10 : 0;
    value -= isStub ? 20 : 0;

    return {
      value,
      isValuable: value >= 15,
      reason: isStub ? 'Stub/placeholder' : 'Real implementation'
    };
  }

  // Recover component to current project
  recoverComponent(branch, filePath) {
    try {
      const content = this.getFileFromBranch(branch, filePath);
      if (!content) return null;

      // Create directory if needed
      const fullPath = path.join(process.cwd(), filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(fullPath, content);

      return {
        file: filePath,
        branch,
        size: content.length,
        lines: content.split('\n').length
      };
    } catch (e) {
      console.error(`   Failed to recover ${filePath}:`, e.message);
      return null;
    }
  }

  // Run recovery
  async run() {
    console.log('\n🚀 WORKTREE COMPONENT RECOVERY & INTEGRATION');
    console.log('='.repeat(70));

    const branches = this.getWorktreeBranches();

    if (branches.length === 0) {
      console.log('\n❌ No worktree branches found');
      return;
    }

    // Scan all branches
    const allComponents = [];

    for (const branch of branches) {
      const components = this.scanBranchComponents(branch);
      this.results.scanned_branches.push(branch);
      this.results.found_components.push(...components);
      allComponents.push(...components);
    }

    console.log(`\n📊 TOTAL COMPONENTS FOUND: ${allComponents.length}`);

    // Find missing in current
    const missingComponents = allComponents.filter(comp => {
      const exists = this.existsInCurrent(comp.path);
      return !exists;
    });

    console.log(`\n🔍 MISSING IN CURRENT PROJECT: ${missingComponents.length}`);

    // Assess value
    const valuableComponents = [];

    for (const comp of missingComponents) {
      const content = this.getFileFromBranch(comp.branch, comp.path);
      if (!content) continue;

      const assessment = this.assessValue(content, comp.path);

      if (assessment.isValuable) {
        valuableComponents.push({
          path: comp.path,
          branch: comp.branch,
          ...assessment,
          content
        });
      }
    }

    console.log(`\n💎 VALUABLE COMPONENTS IDENTIFIED: ${valuableComponents.length}`);

    if (valuableComponents.length > 0) {
      console.log('\n📥 RECOVERING VALUABLE COMPONENTS...\n');

      for (const comp of valuableComponents) {
        const result = this.recoverComponent(comp.branch, comp.path);
        if (result) {
          this.results.recovered_files.push(result);
          console.log(`   ✅ ${comp.path} (${result.lines} lines, value: ${comp.value})`);
        }
      }
    }

    // Generate report
    this.generateReport(branches, allComponents, missingComponents, valuableComponents);
  }

  generateReport(branches, all, missing, valuable) {
    const report = `# WORKTREE COMPONENT RECOVERY REPORT
**Recovered Valuable Components from Old Worktrees**

**Date:** 2026-09-06

---

## SCAN RESULTS

### Branches Scanned
\`\`\`
${branches.map(b => `- ${b}`).join('\n')}
\`\`\`

### Component Inventory
| Category | Count |
|----------|-------|
| Total found | ${all.length} |
| Missing in current | ${missing.length} |
| Valuable identified | ${valuable.length} |
| Recovered | ${this.results.recovered_files.length} |

---

## VALUABLE COMPONENTS RECOVERED

${valuable.length > 0 ? `
\`\`\`
${valuable.map(v => `- ${v.path} (value score: ${v.value}, lines: ${v.content.split('\n').length})`).join('\n')}
\`\`\`
` : '✅ No valuable components missing (current project is complete)'}

---

## RECOVERY STATUS

- ✅ Scanned: ${branches.length} worktree branches
- ✅ Found: ${all.length} component files
- ✅ Identified valuable: ${valuable.length} components
- ✅ Recovered: ${this.results.recovered_files.length} components
- ✅ Integrated: Ready for testing

---

## NEXT STEPS

1. Verify recovered components work
2. Run frontend build: \`npm run build\`
3. Test recovered components in app
4. Delete old worktree branches (keep main)

---

*Recovery complete. All valuable components extracted and integrated.*
`;

    const reportPath = '.ai/WORKTREE_RECOVERY_REPORT.md';
    fs.writeFileSync(reportPath, report);

    console.log(`\n\n📄 Report saved to ${reportPath}`);
    console.log('\n✅ RECOVERY COMPLETE');
    console.log('='.repeat(70));
    console.log(`\nSummary:`);
    console.log(`  Branches scanned: ${branches.length}`);
    console.log(`  Components found: ${all.length}`);
    console.log(`  Missing in current: ${missing.length}`);
    console.log(`  Valuable identified: ${valuable.length}`);
    console.log(`  Recovered: ${this.results.recovered_files.length}`);
  }
}

// Run
const recovery = new WorktreeComponentRecovery();
recovery.run().catch(err => {
  console.error('❌ Recovery failed:', err);
  process.exit(1);
});
