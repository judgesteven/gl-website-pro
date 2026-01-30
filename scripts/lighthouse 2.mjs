#!/usr/bin/env node

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Default URL, can be overridden via process.env.URL
const url = process.env.URL || 'http://localhost:4321/';
const reportPath = join(projectRoot, 'lighthouse-report.html');

// Check if the preview server is running
async function checkServer(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runLighthouse() {
  console.log(`🔍 Checking if preview server is running at ${url}...`);
  
  const serverRunning = await checkServer(url);
  if (!serverRunning) {
    console.error('\n❌ Error: Performance server is not running!');
    console.error(`   Expected server at: ${url}`);
    console.error('\n   Run: npm run perf:run (build + compressed serve)');
    console.error('   Then in a second terminal run: npm run perf:lighthouse');
    process.exit(1);
  }

  console.log('✅ Performance server is running');
  console.log(`\n🚀 Starting Lighthouse audit of ${url}...\n`);

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });

  try {
    // Run Lighthouse
    const options = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: ['performance'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);

    // Save HTML report
    fs.writeFileSync(reportPath, runnerResult.report);
    console.log(`\n📊 Lighthouse report saved to: ${reportPath}`);

    // Extract and display performance score
    const lhr = runnerResult.lhr;
    const performanceScore = lhr.categories.performance.score;
    const scorePercentage = performanceScore ? Math.round(performanceScore * 100) : 0;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`   Performance Score: ${scorePercentage}/100`);
    console.log(`${'='.repeat(50)}\n`);

    // Display key metrics
    if (lhr.audits) {
      const metrics = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
        'speed-index'
      ];

      console.log('Key Metrics:');
      metrics.forEach(metricId => {
        const audit = lhr.audits[metricId];
        if (audit && audit.displayValue) {
          const title = audit.title || metricId;
          console.log(`  • ${title}: ${audit.displayValue}`);
        }
      });
      console.log('');
    }

    if (scorePercentage < 95) {
      console.log('⚠️  Performance score is below 95. Review the report for optimization opportunities.');
    } else {
      console.log('✅ Performance score meets target (95+)!');
    }

  } finally {
    // Close Chrome
    await chrome.kill();
  }
}

runLighthouse().catch(error => {
  console.error('\n❌ Lighthouse audit failed:');
  console.error(error.message);
  process.exit(1);
});

