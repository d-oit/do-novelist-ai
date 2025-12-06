import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface ConfigWithTimeout extends FullConfig {
  timeout?: number;
}

function globalTeardown(config: FullConfig): void {
  console.log('🧹 Cleaning up test environment...');

  const isCI = process.env.CI === 'true';
  const endTime = new Date();

  try {
    // Generate basic test summary
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const reportPath = path.join(testResultsDir, 'test-summary.json');

    const analysisData = {
      timestamp: endTime.toISOString(),
      environment: isCI ? 'ci' : 'local',
      testRun: 'completed',
      configuration: {
        workers: config.workers,
        timeout: (config as ConfigWithTimeout).timeout || 30000,
        projects: config.projects?.map((p: { name: string }) => p.name) || [],
      },
    };

    // Ensure test-results directory exists
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    // Write summary report
    fs.writeFileSync(reportPath, JSON.stringify(analysisData, null, 2));
    console.log(`📋 Test summary generated: ${reportPath}`);

    if (isCI) {
      console.log('✅ CI test environment cleanup completed successfully');
    } else {
      console.log('✅ Local test environment cleanup completed successfully');
    }
  } catch (error) {
    console.error('❌ Error during global teardown:', error);

    // Generate error report for CI
    if (isCI) {
      try {
        const testResultsDir = path.join(process.cwd(), 'test-results');
        const errorPath = path.join(testResultsDir, 'teardown-error.json');

        if (!fs.existsSync(testResultsDir)) {
          fs.mkdirSync(testResultsDir, { recursive: true });
        }

        const errorReport = {
          timestamp: endTime.toISOString(),
          error: error instanceof Error ? error.message : String(error),
          environment: 'ci',
          phase: 'teardown',
        };

        fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
        console.error(`📋 Teardown error report saved to: ${errorPath}`);
      } catch (reportError) {
        console.error('Failed to write teardown error report:', reportError);
      }
    }
  }
}

export default globalTeardown;
