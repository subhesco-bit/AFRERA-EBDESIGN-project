#!/usr/bin/env node
// Zero-token E2E batch runner. Requires `puppeteer` (npm i -D puppeteer).
// Takes a JSON test-case file, runs it headlessly against a running dev
// server, and writes results to .ai/plugins/results/ instead of describing
// each route/form interaction in tokens (see PLUGIN_TOKEN_OPTIMIZATION.md).
const fs = require('fs');
const path = require('path');

async function runBrowserTests(testCases, baseUrl) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const results = { passed: [], failed: [], timestamp: new Date().toISOString() };

  for (const test of testCases) {
    const page = await browser.newPage();
    try {
      await page.goto(`${baseUrl}${test.route}`, { waitUntil: 'networkidle2', timeout: 15000 });
      if (test.test === 'load') {
        const content = await page.content();
        (content.includes(test.expect) ? results.passed : results.failed).push(test);
      } else if (test.test === 'form-submit') {
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ timeout: 15000 });
        results.passed.push(test);
      } else {
        results.passed.push(test);
      }
    } catch (error) {
      results.failed.push({ ...test, error: error.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `e2e-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  results.artifact = outFile;
  return results;
}

if (require.main === module) {
  const casesFile = process.argv[2];
  const baseUrl = process.argv[3] || 'http://localhost:3000';
  if (!casesFile || !fs.existsSync(casesFile)) {
    console.error('Usage: node browser-test-batch.js <test-cases.json> [baseUrl]');
    process.exit(2);
  }
  const testCases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
  runBrowserTests(testCases, baseUrl).then((r) => {
    console.log(`Passed: ${r.passed.length}, Failed: ${r.failed.length}, artifact: ${r.artifact}`);
    process.exit(r.failed.length > 0 ? 1 : 0);
  });
}

module.exports = { runBrowserTests };
