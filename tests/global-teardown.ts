// CRITICAL: Import AI SDK logger patch for consistency
import '../src/lib/ai-sdk-logger-patch';

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function globalTeardown(_config: FullConfig): void {
  console.log('🧹 Cleaning up test environment...');

  // Stop MSW mock server

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
