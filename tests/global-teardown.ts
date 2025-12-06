// CRITICAL: Import AI SDK logger patch for consistency
import '../src/lib/ai-sdk-logger-patch';

import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ConfigWithRetries extends FullConfig {
  retries?: number;
  timeout?: number;
}

function globalTeardown(config: FullConfig): void {
  console.log('🧹 Cleaning up enhanced test environment...');

  const isCI = process.env.CI === 'true';
  const endTime = new Date();

  try {
    // Enhanced system diagnostics after test execution
    if (isCI) {
      console.log('🔍 Running post-test system diagnostics...');

      try {
        // Check final memory usage
        const memoryUsage = process.memoryUsage();
        console.log(`🧠 Final memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);

        // Check disk usage for test results
        const testResultsPath = path.join(process.cwd(), 'test-results');
        if (fs.existsSync(testResultsPath)) {
          const diskUsage = execSync(`du -sh ${testResultsPath}`).toString().trim();
          console.log(`💽 Test results size: ${diskUsage}`);
        }

        // Check for any remaining browser processes
        try {
          const browserProcesses = execSync(
            'ps aux | grep -E "(chromium|firefox|webkit)" | grep -v grep || echo "No browsers found"',
          )
            .toString()
            .trim();
          console.log(`🌐 Browser processes: ${browserProcesses}`);
        } catch {
          console.log('🌐 Browser processes: Unable to check');
        }
      } catch (diagnosticsError) {
        console.warn('⚠️ Could not run post-test diagnostics:', diagnosticsError);
      }
    }

    // Enhanced test results analysis
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const analysisData = {
      timestamp: endTime.toISOString(),
      environment: isCI ? 'ci' : 'local',
      testRun: 'completed',
      configuration: {
        workers: config.workers,
        retries: (config as ConfigWithRetries).retries,
        timeout: (config as ConfigWithRetries).timeout,
        projects: config.projects?.map((p: { name: string }) => p.name) || [],
      },
      directories: {
        screenshots: 'test-results/screenshots',
        visualBaseline: 'test-results/visual-baseline',
        accessibilityReports: 'test-results/accessibility-reports',
        cleanupReports: 'test-results/cleanup-reports',
        videos: 'test-results/videos',
        traces: 'test-results/traces',
        artifacts: 'test-results/artifacts',
        fixtures: 'test-results/fixtures',
      } as Record<
        string,
        string | { screenshots: number; videos: number; traces: number; total: number }
      >,
      system: {
        memory: process.memoryUsage(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
    };

    // Count generated files
    if (fs.existsSync(testResultsDir)) {
      const countFiles = (dir: string): number => {
        try {
          const files = fs.readdirSync(dir, { withFileTypes: true });
          return files.reduce((count: number, file: fs.Dirent) => {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
              return count + countFiles(fullPath);
            }
            return count + 1;
          }, 0);
        } catch {
          return 0;
        }
      };

      const fileCounts = {
        screenshots: countFiles(path.join(testResultsDir, 'screenshots')),
        videos: countFiles(path.join(testResultsDir, 'videos')),
        traces: countFiles(path.join(testResultsDir, 'traces')),
        total: countFiles(testResultsDir),
      };

      analysisData.directories = {
        ...analysisData.directories,
        fileCounts,
      };
    }

    // Generate comprehensive test summary report
    const reportPath = path.join(testResultsDir, 'test-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysisData, null, 2));

    // Generate CI-specific artifact manifest
    if (isCI) {
      const manifestPath = path.join(testResultsDir, 'ci-artifact-manifest.json');
      const artifactManifest = {
        buildInfo: {
          timestamp: endTime.toISOString(),
          commit: process.env.GITHUB_SHA,
          branch: process.env.GITHUB_REF_NAME,
          workflow: process.env.GITHUB_WORKFLOW,
          job: process.env.GITHUB_JOB,
          actor: process.env.GITHUB_ACTOR,
        },
        testArtifacts: [
          'playwright-report/',
          'test-results/',
          'test-results/screenshots/',
          'test-results/videos/',
          'test-results/traces/',
        ],
        summary: {
          configuration: analysisData.configuration,
          systemInfo: analysisData.system,
          fileCounts: (analysisData.directories as Record<string, unknown>).fileCounts,
        },
      };

      fs.writeFileSync(manifestPath, JSON.stringify(artifactManifest, null, 2));
      console.log(`📋 CI artifact manifest generated: ${manifestPath}`);
    }

    // Enhanced cleanup validation
    console.log('📊 Enhanced test summary generated');
    console.log(`📁 Test results location: ${testResultsDir}`);

    const directoriesWithCounts = analysisData.directories as Record<
      string,
      string | { screenshots: number; videos: number; traces: number; total: number }
    >;
    if (directoriesWithCounts.fileCounts && typeof directoriesWithCounts.fileCounts === 'object') {
      const fileCounts = directoriesWithCounts.fileCounts as {
        screenshots: number;
        videos: number;
        traces: number;
        total: number;
      };
      console.log(`📸 Screenshots: ${fileCounts.screenshots}`);
      console.log(`🎥 Videos: ${fileCounts.videos}`);
      console.log(`🔍 Traces: ${fileCounts.traces}`);
      console.log(`📄 Total files: ${fileCounts.total}`);
    }

    if (isCI) {
      console.log('✅ CI test environment cleanup completed successfully');
      console.log('🔄 Enhanced monitoring and artifact collection enabled');
    } else {
      console.log('✅ Local test environment cleanup completed successfully');
    }
  } catch (error) {
    console.error('❌ Error during enhanced global teardown:', error);

    // Generate error report for CI
    if (isCI) {
      try {
        const errorReport = {
          timestamp: endTime.toISOString(),
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          environment: 'ci',
          phase: 'teardown',
          configuration: {
            workers: config.workers,
            retries: (config as ConfigWithRetries).retries,
            timeout: (config as ConfigWithRetries).timeout,
          },
        };

        const errorPath = path.join(process.cwd(), 'test-results', 'teardown-error.json');
        fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
        console.error(`📋 Teardown error report saved to: ${errorPath}`);
      } catch (reportError) {
        console.error('Failed to write teardown error report:', reportError);
      }
    }
  }

  return;
}

export default globalTeardown;
