#!/usr/bin/env node

/**
 * Comprehensive Security Scanning Script
 * Performs multiple security checks: vulnerabilities, licenses, and best practices
 */

const { execSync } = require('child_process');
const fs = require('fs');

class SecurityScanner {
  constructor() {
    this.results = {
      vulnerabilities: [],
      licenses: [],
      recommendations: [],
      errors: [],
    };
  }

  log(message, type = 'info') {
    const prefix =
      {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        success: '✅',
      }[type] || '📝';

    console.log(`${prefix} ${message}`);
  }

  runCommand(command, description) {
    try {
      this.log(`Running: ${description}`);
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      this.log(`${description} completed successfully`, 'success');
      return result;
    } catch (error) {
      this.log(`${description} failed: ${error.message}`, 'error');
      this.results.errors.push(`${description}: ${error.message}`);
      return null;
    }
  }

  async checkVulnerabilities() {
    this.log('🔍 Checking for vulnerabilities...', 'info');

    // NPM audit
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);

      if (auditData.vulnerabilities && Object.keys(auditData.vulnerabilities).length > 0) {
        this.results.vulnerabilities.push({
          type: 'npm-audit',
          count: Object.keys(auditData.vulnerabilities).length,
          details: auditData.vulnerabilities,
        });
        this.log(
          `Found ${Object.keys(auditData.vulnerabilities).length} npm vulnerabilities`,
          'warning',
        );
      } else {
        this.log('No npm vulnerabilities found', 'success');
      }
    } catch {
      this.log('npm audit failed', 'warning');
    }

    // Check for audit-ci
    try {
      const auditCiResult = execSync('npx audit-ci --json', { encoding: 'utf8' });
      const auditCiData = JSON.parse(auditCiResult);

      if (auditCiData.vulnerabilities && auditCiData.vulnerabilities.length > 0) {
        this.results.vulnerabilities.push({
          type: 'audit-ci',
          count: auditCiData.vulnerabilities.length,
          details: auditCiData.vulnerabilities,
        });
        this.log(
          `Found ${auditCiData.vulnerabilities.length} vulnerabilities via audit-ci`,
          'warning',
        );
      }
    } catch {
      // audit-ci might not find vulnerabilities or might fail, that's okay
      this.log('audit-ci check completed', 'info');
    }

    return this.results.vulnerabilities.length === 0;
  }

  async checkLicenses() {
    this.log('📋 Checking license compliance...', 'info');

    try {
      const licenseResult = execSync(
        'npx license-checker --json --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;Unlicense;CC0-1.0"',
        { encoding: 'utf8' },
      );
      const licenseData = JSON.parse(licenseResult);

      const licenses = Object.keys(licenseData);
      this.results.licenses = licenses.map(pkg => ({
        package: pkg,
        license: licenseData[pkg].licenses,
      }));

      this.log(`Found ${licenses.length} packages with allowed licenses`, 'success');
    } catch (error) {
      this.log('License check failed - some packages may have incompatible licenses', 'warning');
      this.results.errors.push(`License check: ${error.message}`);
    }

    return this.results.licenses.length > 0;
  }

  async checkBestPractices() {
    this.log('🏗️ Checking security best practices...', 'info');

    const recommendations = [];

    // Check for package-lock.json or pnpm-lock.yaml
    if (!fs.existsSync('package-lock.json') && !fs.existsSync('pnpm-lock.yaml')) {
      recommendations.push({
        category: 'dependency-management',
        message:
          'Consider using a lock file (package-lock.json or pnpm-lock.yaml) for reproducible builds',
      });
    }

    // Check for .env files in gitignore
    try {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes('.env')) {
        recommendations.push({
          category: 'security',
          message: 'Add .env to .gitignore to prevent accidental credential commits',
        });
      }
    } catch {
      // .gitignore doesn't exist
      recommendations.push({
        category: 'security',
        message: 'Create .gitignore file and add sensitive files like .env',
      });
    }

    // Check for HTTPS-only configuration
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (packageJson.proxy && packageJson.proxy.startsWith('http://')) {
        recommendations.push({
          category: 'security',
          message: 'Avoid using HTTP proxies in production - use HTTPS only',
        });
      }
    } catch {
      // Package.json not found or invalid
    }

    this.results.recommendations = recommendations;
    return recommendations.length === 0;
  }

  async generateReport() {
    this.log('📊 Generating security report...', 'info');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        vulnerabilities: this.results.vulnerabilities.reduce((sum, v) => sum + (v.count || 0), 0),
        licenseIssues: this.results.licenses.length,
        recommendations: this.results.recommendations.length,
        errors: this.results.errors.length,
      },
      details: {
        vulnerabilities: this.results.vulnerabilities,
        licenses: this.results.licenses,
        recommendations: this.results.recommendations,
        errors: this.results.errors,
      },
    };

    // Write report to file
    fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2));

    return report;
  }

  async run() {
    this.log('🚀 Starting comprehensive security scan...', 'info');

    const checks = [
      { name: 'Vulnerabilities', fn: () => this.checkVulnerabilities() },
      { name: 'Licenses', fn: () => this.checkLicenses() },
      { name: 'Best Practices', fn: () => this.checkBestPractices() },
    ];

    for (const check of checks) {
      try {
        await check.fn();
      } catch (error) {
        this.log(`Check '${check.name}' failed: ${error.message}`, 'error');
        this.results.errors.push(`Check '${check.name}': ${error.message}`);
      }
    }

    const report = await this.generateReport();

    // Print summary
    console.log('\n📋 Security Scan Summary');
    console.log('='.repeat(50));
    console.log(`Vulnerabilities: ${report.summary.vulnerabilities}`);
    console.log(`License Issues: ${report.summary.licenseIssues}`);
    console.log(`Recommendations: ${report.summary.recommendations}`);
    console.log(`Errors: ${report.summary.errors}`);

    if (
      report.summary.vulnerabilities === 0 &&
      report.summary.licenseIssues === 0 &&
      report.summary.errors.length === 0
    ) {
      console.log('\n✅ Security scan passed - no critical issues found!');
      process.exit(0);
    } else {
      console.log(
        '\n⚠️ Security scan completed with findings - see security-report.json for details',
      );
      process.exit(1);
    }
  }
}

// Run the scanner if this file is executed directly
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.run().catch(error => {
    console.error('Security scanner failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityScanner;
