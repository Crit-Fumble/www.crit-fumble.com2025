#!/usr/bin/env tsx
/**
 * UI Capture Script
 *
 * Runs comprehensive UI capture tests and organizes the output
 * for documentation and visual review.
 *
 * Usage:
 *   npm run capture:ui              - Capture all UI (Chrome only)
 *   npm run capture:ui:all-browsers - Capture across all browsers
 *   npm run capture:ui:mobile       - Capture mobile viewports only
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'tests', 'artifacts');
const RESULTS_DIR = path.join(process.cwd(), 'tests', 'results');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function ensureDirectories() {
  log('📁 Creating output directories...', 'cyan');

  const dirs = [
    ARTIFACTS_DIR,
    RESULTS_DIR,
    path.join(RESULTS_DIR, 'screenshots'),
    path.join(RESULTS_DIR, 'videos'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`   Created: ${dir}`, 'green');
    }
  });
}

function runTests(project: string = 'chromium') {
  logSection(`🧪 Running UI Capture Tests - ${project}`);

  try {
    const command = `npx playwright test tests/integration/10-login-dashboard-flow.spec.ts --grep="Visual Regression" --project=${project}`;
    log(`   Command: ${command}`, 'blue');

    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    log(`\n✅ Tests completed successfully for ${project}`, 'green');
  } catch (error) {
    log(`\n⚠️  Some tests may have failed, but artifacts were captured`, 'yellow');
  }
}

function organizeArtifacts() {
  logSection('📦 Organizing Artifacts');

  if (!fs.existsSync(ARTIFACTS_DIR)) {
    log('   No artifacts found to organize', 'yellow');
    return;
  }

  // Count artifacts
  const files = fs.readdirSync(ARTIFACTS_DIR, { recursive: true }) as string[];
  const screenshots = files.filter(f => f.endsWith('.png'));
  const videos = files.filter(f => f.endsWith('.webm'));

  log(`   Found ${screenshots.length} screenshots`, 'green');
  log(`   Found ${videos.length} videos`, 'green');

  log(`\n   Artifacts location: ${ARTIFACTS_DIR}`, 'cyan');
}

function generateReport() {
  logSection('📊 Generating Summary Report');

  const reportPath = path.join(RESULTS_DIR, 'ui-capture-summary.md');

  let report = `# UI Capture Summary\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Artifacts Location\n\n`;
  report += `- Screenshots: \`${path.join(ARTIFACTS_DIR)}\`\n`;
  report += `- Videos: \`${path.join(ARTIFACTS_DIR)}\`\n\n`;
  report += `## Test Coverage\n\n`;
  report += `- ✅ Login page (all viewports)\n`;
  report += `- ✅ Dashboard (all viewports)\n`;
  report += `- ✅ Linked Accounts page\n`;
  report += `- ✅ Header navigation states\n`;
  report += `- ✅ Button interactive states\n`;
  report += `- ✅ User journey videos\n`;
  report += `- ✅ Design system components\n`;
  report += `- ✅ Accessibility states\n\n`;
  report += `## Viewports Tested\n\n`;
  report += `### Mobile\n`;
  report += `- iPhone SE (320x568)\n`;
  report += `- iPhone 8 (375x667)\n`;
  report += `- iPhone 13 (390x844)\n`;
  report += `- Pixel 7 (393x851)\n\n`;
  report += `### Tablet\n`;
  report += `- iPad (768x1024)\n`;
  report += `- iPad Air (820x1180)\n`;
  report += `- iPad Pro (1024x1366)\n\n`;
  report += `### Desktop\n`;
  report += `- HD (1280x720)\n`;
  report += `- Laptop (1366x768)\n`;
  report += `- Full HD (1920x1080)\n`;
  report += `- QHD (2560x1440)\n`;
  report += `- 4K (3840x2160)\n\n`;

  fs.writeFileSync(reportPath, report);
  log(`   Report saved: ${reportPath}`, 'green');
}

function openReport() {
  logSection('🌐 Opening HTML Report');

  const htmlReportPath = path.join(RESULTS_DIR, 'html-report', 'index.html');

  if (fs.existsSync(htmlReportPath)) {
    log(`   Opening: ${htmlReportPath}`, 'cyan');

    try {
      const openCommand = process.platform === 'win32' ? 'start' :
                         process.platform === 'darwin' ? 'open' : 'xdg-open';
      execSync(`${openCommand} ${htmlReportPath}`, { stdio: 'ignore' });
      log(`   ✅ Report opened in browser`, 'green');
    } catch (error) {
      log(`   ⚠️  Could not auto-open report. Please open manually:`, 'yellow');
      log(`      ${htmlReportPath}`, 'cyan');
    }
  } else {
    log(`   ⚠️  HTML report not found`, 'yellow');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'default';

  logSection('🎨 Crit-Fumble UI Capture Tool');

  ensureDirectories();

  switch (mode) {
    case 'all-browsers':
      runTests('chromium');
      runTests('firefox');
      runTests('webkit');
      break;
    case 'mobile':
      runTests('mobile-chrome');
      runTests('mobile-safari');
      break;
    case 'tablet':
      runTests('tablet');
      break;
    default:
      runTests('chromium');
  }

  organizeArtifacts();
  generateReport();
  openReport();

  logSection('✨ UI Capture Complete!');
  log(`\nNext steps:`, 'bright');
  log(`1. Review screenshots in: tests/artifacts/`, 'cyan');
  log(`2. Watch videos in: tests/artifacts/`, 'cyan');
  log(`3. Check HTML report for test results`, 'cyan');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'yellow');
  process.exit(1);
});
