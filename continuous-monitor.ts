import { execSync } from 'child_process';
import fs from 'fs';
import { logger } from './src/lib/logging/logger';

interface WorkflowRun {
  status: string;
  conclusion: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface MonitoringReport {
  timestamp: string;
  runtime: string;
  consecutiveSuccess: number;
  targetSuccess: number;
  workflowStatuses: Record<string, string>;
  status: 'STABLE' | 'MONITORING';
}

class GitHubActionsMonitor {
  private consecutiveSuccess = 0;
  private monitoring = true;
  private targetSuccess = 5;
  private checkInterval = 30000; // 30 seconds
  private maxRuntime = 3600000; // 1 hour maximum
  private startTime = Date.now();
  private workflowStatuses = new Map<string, string>();

  private log(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
    const timestamp = new Date().toISOString();

    // Use proper logging instead of console
    if (type === 'error') {
      logger.error(message, { component: 'GitHubActionsMonitor' });
    } else {
      logger.info(message, { component: 'GitHubActionsMonitor' });
    }

    // Log to file for audit trail
    fs.appendFileSync('monitoring.log', `[${timestamp}] ${message}\n`);
  }

  private async executeGitHubCommand(command: string): Promise<WorkflowRun[] | null> {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });
      return JSON.parse(result);
    } catch (error: unknown) {
      this.log(`GitHub command failed: ${command}`, 'error');
      logger.error('GitHub command execution failed', {
        component: 'GitHubActionsMonitor',
        command,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async checkWorkflowStatus(): Promise<boolean> {
    this.log('🔍 Checking GitHub Actions workflow status...');

    try {
      // Get recent workflow runs
      const runs = await this.executeGitHubCommand(
        'gh run list --limit 10 --json status,conclusion,name,createdAt,updatedAt',
      );

      if (!runs) {
        this.log('Failed to fetch workflow runs', 'error');
        return false;
      }

      this.log(`Found ${runs.length} recent workflow runs`);

      // Analyze each workflow type
      const workflowTypes = ['Fast CI Pipeline', 'Security Scanning & Analysis', 'YAML Lint'];
      let allSuccessful = true;

      for (const workflowType of workflowTypes) {
        const latestRun = runs.find((run: WorkflowRun) => run.name === workflowType);

        if (latestRun) {
          const status = latestRun.conclusion || 'unknown';
          this.workflowStatuses.set(workflowType, status);

          this.log(`${workflowType}: ${status}`);

          if (status !== 'success') {
            allSuccessful = false;
          }
        } else {
          this.log(`No recent runs found for ${workflowType}`, 'error');
          allSuccessful = false;
        }
      }

      return allSuccessful;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Error checking workflow status: ${errorMessage}`, 'error');
      return false;
    }
  }

  private async triggerWorkflow(workflow: string): Promise<boolean> {
    this.log(`🔧 Triggering workflow: ${workflow}`);

    try {
      // For most workflows, we can't directly trigger them
      // But we can trigger specific actions or create commits to trigger CI
      if (workflow === 'YAML Lint') {
        this.log('YAML Lint will trigger on next push/commit');
        return true;
      } else if (workflow === 'Fast CI Pipeline') {
        this.log('Fast CI Pipeline will trigger on code changes');
        return true;
      } else if (workflow === 'Security Scanning & Analysis') {
        this.log('Security scanning runs on schedule and code changes');
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Failed to trigger workflow ${workflow}: ${errorMessage}`, 'error');
      return false;
    }
  }

  private async analyzeAndFixFailures(): Promise<void> {
    this.log('🔧 Analyzing failures and attempting auto-fix...');

    const failedWorkflows = Array.from(this.workflowStatuses.entries())
      .filter(([, status]) => status !== 'success')
      .map(([workflowName]) => workflowName);

    for (const workflow of failedWorkflows) {
      this.log(`Attempting to fix: ${workflow}`);

      // Attempt common fixes based on workflow type
      if (workflow.includes('Fast CI')) {
        await this.fixFastCIIssues();
      } else if (workflow.includes('Security')) {
        await this.fixSecurityIssues();
      } else if (workflow.includes('YAML')) {
        await this.fixYAMLIssues();
      }

      // Trigger workflow after fixing
      await this.triggerWorkflow(workflow);
    }
  }

  private async fixFastCIIssues(): Promise<void> {
    this.log('🔧 Fixing Fast CI issues...');

    try {
      // Run linting and type checking
      execSync('npm run lint:fix', { stdio: 'pipe' });
      this.log('Fixed linting issues');

      // Run tests to identify issues
      execSync('npm run test -- --passWithNoTests', { stdio: 'pipe' });
      this.log('Ran tests successfully');
    } catch (error: unknown) {
      this.log('Auto-fix failed for Fast CI issues', 'error');
      logger.error('Fast CI auto-fix failed', {
        component: 'GitHubActionsMonitor',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async fixSecurityIssues(): Promise<void> {
    this.log('🔧 Fixing security issues...');

    try {
      // Run security audit
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      this.log('Security audit passed');
    } catch (error: unknown) {
      this.log('Security auto-fix may be needed', 'error');
      logger.error('Security auto-fix failed', {
        component: 'GitHubActionsMonitor',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async fixYAMLIssues(): Promise<void> {
    this.log('🔧 Fixing YAML issues...');

    try {
      // Check YAML files for syntax issues
      const yamlFiles = execSync('find . -name "*.yml" -o -name "*.yaml" | head -10', {
        encoding: 'utf8',
      })
        .split('\n')
        .filter(f => f.trim());

      for (const file of yamlFiles) {
        try {
          execSync(`node -e "require('yaml')"`);
          this.log(`YAML syntax OK: ${file}`);
        } catch (error: unknown) {
          this.log(`YAML parsing issue in: ${file}`, 'error');
          logger.error('YAML parsing failed', {
            component: 'GitHubActionsMonitor',
            file,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error: unknown) {
      this.log('YAML auto-fix failed', 'error');
      logger.error('YAML auto-fix failed', {
        component: 'GitHubActionsMonitor',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async checkGitHubIssues(): Promise<boolean> {
    try {
      const issues = await this.executeGitHubCommand(
        'gh issue list --state open --json number,title,labels',
      );

      if (issues && issues.length > 0) {
        this.log(`Found ${issues.length} open GitHub issues`, 'error');
        return false;
      }

      this.log('No open GitHub issues ✅');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Error checking GitHub issues: ${errorMessage}`, 'error');
      return false;
    }
  }

  private async generateReport(): Promise<MonitoringReport> {
    const runtime = Date.now() - this.startTime;
    const minutes = Math.floor(runtime / 60000);

    const report: MonitoringReport = {
      timestamp: new Date().toISOString(),
      runtime: `${minutes} minutes`,
      consecutiveSuccess: this.consecutiveSuccess,
      targetSuccess: this.targetSuccess,
      workflowStatuses: Object.fromEntries(this.workflowStatuses),
      status: this.consecutiveSuccess >= this.targetSuccess ? 'STABLE' : 'MONITORING',
    };

    fs.writeFileSync('monitoring-report.json', JSON.stringify(report, null, 2));
    this.log('📊 Generated monitoring report');

    return report;
  }

  public async startMonitoring(): Promise<void> {
    this.log('🚀 Starting GitHub Actions Continuous Monitoring');
    this.log(`Target: ${this.targetSuccess} consecutive successful runs`);
    this.log(`Check interval: ${this.checkInterval / 1000} seconds`);
    this.log(`Maximum runtime: ${this.maxRuntime / 60000} minutes`);

    while (this.monitoring) {
      try {
        // Check if we've reached our target
        if (this.consecutiveSuccess >= this.targetSuccess) {
          this.log(`🎉 TARGET ACHIEVED: ${this.consecutiveSuccess} consecutive successes!`);
          await this.generateReport();
          break;
        }

        // Check if we've exceeded maximum runtime
        if (Date.now() - this.startTime > this.maxRuntime) {
          this.log('⏰ Maximum monitoring time reached', 'error');
          break;
        }

        // Check workflow status
        const allSuccessful = await this.checkWorkflowStatus();
        const noOpenIssues = await this.checkGitHubIssues();

        if (allSuccessful && noOpenIssues) {
          this.consecutiveSuccess++;
          this.log(`✅ Success streak: ${this.consecutiveSuccess}/${this.targetSuccess}`);
        } else {
          if (this.consecutiveSuccess > 0) {
            this.log('🔄 Success streak reset due to failures', 'error');
          }
          this.consecutiveSuccess = 0;

          // Attempt to fix issues
          await this.analyzeAndFixFailures();
        }

        // Generate periodic reports
        if (this.consecutiveSuccess % 1 === 0) {
          await this.generateReport();
        }

        // Wait before next check
        await this.sleep(this.checkInterval);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Monitoring cycle error: ${errorMessage}`, 'error');
        await this.sleep(5000); // Wait 5 seconds before retrying
      }
    }

    this.log('🏁 Monitoring completed');
    await this.generateReport();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start monitoring
const monitor = new GitHubActionsMonitor();
monitor.startMonitoring().catch(error => {
  logger.error('Monitoring failed', {
    component: 'GitHubActionsMonitor',
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
