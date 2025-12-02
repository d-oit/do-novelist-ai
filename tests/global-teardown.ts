import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

function globalTeardown(_config: FullConfig): void {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Generate test summary report
    const reportData = {
      timestamp: new Date().toISOString(),
      testRun: 'completed',
      directories: {
        screenshots: 'test-results/screenshots',
        visualBaseline: 'test-results/visual-baseline',
        accessibilityReports: 'test-results/accessibility-reports',
        cleanupReports: 'test-results/cleanup-reports',
        videos: 'test-results/videos',
      },
    };

    const reportPath = path.join(process.cwd(), 'test-results', 'test-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log('📊 Test summary report generated');
    console.log('✅ Test environment teardown complete');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }

  return;
}

export default globalTeardown;
