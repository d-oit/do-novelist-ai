#!/usr/bin/env node

/**
 * Security Monitoring and Alerting Script
 * Monitors security metrics and sends alerts for critical issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityMonitor {
  constructor() {
    this.alerts = [];
    this.metrics = {};
  }

  log(message, type = 'info') {
    const prefix =
      {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        success: '✅',
        alert: '🚨',
      }[type] || '📝';

    console.log(`${prefix} ${message}`);
  }

  async checkVulnerabilityMetrics() {
    this.log('📊 Checking vulnerability metrics...', 'info');

    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);

      const vulnerabilityCounts = {
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
      };

      if (auditData.vulnerabilities) {
        Object.values(auditData.vulnerabilities).forEach(vuln => {
          vulnerabilityCounts[vuln.severity] = (vulnerabilityCounts[vuln.severity] || 0) + 1;
        });
      }

      this.metrics.vulnerabilities = vulnerabilityCounts;

      // Check for critical alerts
      if (vulnerabilityCounts.critical > 0) {
        this.alerts.push({
          level: 'critical',
          type: 'vulnerability',
          message: `Critical vulnerabilities found: ${vulnerabilityCounts.critical}`,
          count: vulnerabilityCounts.critical,
        });
      }

      if (vulnerabilityCounts.high > 10) {
        this.alerts.push({
          level: 'high',
          type: 'vulnerability',
          message: `High vulnerabilities exceed threshold: ${vulnerabilityCounts.high}`,
          count: vulnerabilityCounts.high,
        });
      }
    } catch (error) {
      this.log('Vulnerability check failed', 'warning');
    }
  }

  async checkDependencyAges() {
    this.log('📅 Checking dependency freshness...', 'info');

    try {
      const outdatedResult = execSync('npx npm-check-updates --json', { encoding: 'utf8' });
      const outdatedData = JSON.parse(outdatedResult);

      const outdatedCount = Object.keys(outdatedData).length;
      this.metrics.outdatedDependencies = outdatedCount;

      if (outdatedCount > 20) {
        this.alerts.push({
          level: 'moderate',
          type: 'dependency',
          message: `Many outdated dependencies: ${outdatedCount}`,
          count: outdatedCount,
        });
      }

      // Check for major version updates
      const majorUpdates = Object.entries(outdatedData).filter(([pkg, info]) => {
        return info.latest.startsWith(
          info.current.replace(/^\d+\.\d+\.\d+/, '').split('.')[0] + '.0.0',
        );
      });

      if (majorUpdates.length > 5) {
        this.alerts.push({
          level: 'high',
          type: 'dependency',
          message: `Major version updates available: ${majorUpdates.length}`,
          count: majorUpdates.length,
        });
      }
    } catch (error) {
      this.log('Dependency age check failed', 'warning');
    }
  }

  async checkSecurityAdvisories() {
    this.log('🛡️ Checking security advisories...', 'info');

    try {
      // Check for recent security advisories
      const advisoriesResult = execSync('npm audit --json', { encoding: 'utf8' });
      const advisoriesData = JSON.parse(advisoriesResult);

      const recentAdvisories = [];
      if (advisoriesData.advisories) {
        Object.values(advisoriesData.advisories).forEach(advisory => {
          const advisoryDate = new Date(advisory.found_at);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          if (advisoryDate > thirtyDaysAgo) {
            recentAdvisories.push({
              title: advisory.title,
              severity: advisory.severity,
              found_at: advisory.found_at,
              url: advisory.url,
            });
          }
        });
      }

      this.metrics.recentAdvisories = recentAdvisories.length;

      if (recentAdvisories.length > 0) {
        this.alerts.push({
          level: 'high',
          type: 'advisory',
          message: `Recent security advisories: ${recentAdvisories.length}`,
          count: recentAdvisories.length,
          details: recentAdvisories,
        });
      }
    } catch (error) {
      this.log('Security advisory check failed', 'warning');
    }
  }

  async checkLicenseCompliance() {
    this.log('📋 Checking license compliance...', 'info');

    try {
      const licenseResult = execSync('npx license-checker --json', { encoding: 'utf8' });
      const licenseData = JSON.parse(licenseResult);

      const problematicLicenses = [];
      const allowedLicenses = [
        'MIT',
        'Apache-2.0',
        'BSD-2-Clause',
        'BSD-3-Clause',
        'ISC',
        'Unlicense',
        'CC0-1.0',
      ];

      Object.entries(licenseData).forEach(([pkg, info]) => {
        const licenses = info.licenses.split(',').map(l => l.trim());
        const hasDisallowed = licenses.some(
          license => !allowedLicenses.includes(license) && !license.includes('UNLICENSED'),
        );

        if (hasDisallowed) {
          problematicLicenses.push({
            package: pkg,
            licenses: info.licenses,
          });
        }
      });

      this.metrics.licenseIssues = problematicLicenses.length;

      if (problematicLicenses.length > 0) {
        this.alerts.push({
          level: 'moderate',
          type: 'license',
          message: `License compliance issues: ${problematicLicenses.length}`,
          count: problematicLicenses.length,
          details: problematicLicenses,
        });
      }
    } catch (error) {
      this.log('License compliance check failed', 'warning');
    }
  }

  async generateAlerts() {
    this.log('🚨 Generating security alerts...', 'alert');

    const alertReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAlerts: this.alerts.length,
        critical: this.alerts.filter(a => a.level === 'critical').length,
        high: this.alerts.filter(a => a.level === 'high').length,
        moderate: this.alerts.filter(a => a.level === 'moderate').length,
      },
      alerts: this.alerts,
      metrics: this.metrics,
    };

    // Write alerts to file
    fs.writeFileSync('security-alerts.json', JSON.stringify(alertReport, null, 2));

    // Print alerts summary
    console.log('\n🚨 Security Alerts Summary');
    console.log('='.repeat(50));
    console.log(`Total Alerts: ${alertReport.summary.totalAlerts}`);
    console.log(`Critical: ${alertReport.summary.critical}`);
    console.log(`High: ${alertReport.summary.high}`);
    console.log(`Moderate: ${alertReport.summary.moderate}`);

    if (this.alerts.length > 0) {
      console.log('\n📋 Alert Details:');
      this.alerts.forEach((alert, index) => {
        console.log(`${index + 1}. [${alert.level.toUpperCase()}] ${alert.message}`);
      });
    }

    return alertReport;
  }

  async sendNotifications(alertReport) {
    // In a real implementation, you would send notifications here
    // For example, to Slack, email, or other monitoring systems

    this.log('📧 Sending notifications...', 'info');

    if (alertReport.summary.critical > 0) {
      console.log('🚨 CRITICAL SECURITY ALERTS DETECTED - Immediate action required!');
    } else if (alertReport.summary.high > 0) {
      console.log('⚠️ High severity security alerts detected - Review required!');
    } else if (alertReport.summary.moderate > 0) {
      console.log('ℹ️ Moderate security alerts detected - Monitoring recommended!');
    } else {
      console.log('✅ No security alerts detected - All clear!');
    }
  }

  async run() {
    this.log('🚀 Starting security monitoring...', 'info');

    const checks = [
      { name: 'Vulnerability Metrics', fn: () => this.checkVulnerabilityMetrics() },
      { name: 'Dependency Ages', fn: () => this.checkDependencyAges() },
      { name: 'Security Advisories', fn: () => this.checkSecurityAdvisories() },
      { name: 'License Compliance', fn: () => this.checkLicenseCompliance() },
    ];

    for (const check of checks) {
      try {
        await check.fn();
      } catch (error) {
        this.log(`Check '${check.name}' failed: ${error.message}`, 'error');
      }
    }

    const alertReport = await this.generateAlerts();
    await this.sendNotifications(alertReport);

    // Exit with appropriate code
    if (alertReport.summary.critical > 0 || alertReport.summary.high > 5) {
      process.exit(2); // Critical or many high alerts
    } else if (alertReport.summary.high > 0) {
      process.exit(1); // Some high alerts
    } else {
      process.exit(0); // No critical issues
    }
  }
}

// Run the monitor if this file is executed directly
if (require.main === module) {
  const monitor = new SecurityMonitor();
  monitor.run().catch(error => {
    console.error('Security monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityMonitor;
