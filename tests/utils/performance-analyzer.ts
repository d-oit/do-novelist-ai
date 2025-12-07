/**
 * E2E Test Performance Analysis Script
 * Analyzes test execution patterns and provides optimization recommendations
 */

import { readFileSync } from 'fs';

interface TestResult {
  title: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  shard?: string;
}

interface PerformanceAnalysis {
  totalDuration: number;
  testCount: number;
  averageTestDuration: number;
  slowestTests: TestResult[];
  fastestTests: TestResult[];
  recommendations: string[];
}

/**
 * Analyze Playwright test results for performance insights
 */
export class PerformanceAnalyzer {
  /**
   * Parse Playwright test results and generate performance analysis
   */
  static analyzeResults(resultsPath: string): PerformanceAnalysis {
    try {
      const resultsData = JSON.parse(readFileSync(resultsPath, 'utf8'));
      const tests: TestResult[] = [];

      // Extract test information from results
      if (resultsData.suites) {
        this.extractTestsFromSuites(resultsData.suites, tests);
      } else if (resultsData.specs) {
        this.extractTestsFromSpecs(resultsData.specs, tests);
      }

      return this.generateAnalysis(tests);
    } catch (error) {
      console.error('Failed to analyze test results:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Extract test results from Playwright suite structure
   */
  private static extractTestsFromSuites(suites: any[], tests: TestResult[]): void {
    for (const suite of suites) {
      if (suite.tests) {
        for (const test of suite.tests) {
          tests.push({
            title: test.title,
            duration: test.duration || 0,
            status: test.status,
          });
        }
      }
      if (suite.suites) {
        this.extractTestsFromSuites(suite.suites, tests);
      }
    }
  }

  /**
   * Extract test results from Playwright spec structure
   */
  private static extractTestsFromSpecs(specs: any[], tests: TestResult[]): void {
    for (const spec of specs) {
      if (spec.tests) {
        for (const test of spec.tests) {
          tests.push({
            title: test.title,
            duration: test.duration || 0,
            status: test.status,
          });
        }
      }
    }
  }

  /**
   * Generate performance analysis from test results
   */
  private static generateAnalysis(tests: TestResult[]): PerformanceAnalysis {
    const passedTests = tests.filter(t => t.status === 'passed');
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
    const averageTestDuration = passedTests.length > 0 ? totalDuration / passedTests.length : 0;

    // Sort tests by duration
    const sortedByDuration = [...passedTests].sort((a, b) => b.duration - a.duration);
    const slowestTests = sortedByDuration.slice(0, 5);
    const fastestTests = sortedByDuration.slice(-5).reverse();

    const recommendations = this.generateRecommendations(tests, totalDuration);

    return {
      totalDuration,
      testCount: tests.length,
      averageTestDuration,
      slowestTests,
      fastestTests,
      recommendations,
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private static generateRecommendations(tests: TestResult[], totalDuration: number): string[] {
    const recommendations: string[] = [];

    // Check if total duration exceeds target
    if (totalDuration > 180000) {
      // 3 minutes
      recommendations.push(
        '🔴 CRITICAL: Total test duration exceeds 3-minute target',
        'Consider implementing parallel execution and sharding',
        'Review slowest tests for optimization opportunities',
      );
    } else if (totalDuration > 120000) {
      // 2 minutes
      recommendations.push(
        '🟡 WARNING: Test duration approaching limits',
        'Optimize slow-running tests',
        'Review test isolation and setup patterns',
      );
    } else {
      recommendations.push('✅ Performance targets met');
    }

    // Analyze individual test performance
    const slowTests = tests.filter(t => t.duration > 30000); // 30 seconds
    if (slowTests.length > 0) {
      recommendations.push(
        `⚠️ Found ${slowTests.length} tests taking >30s - consider optimization`,
      );
    }

    // Check for tests without proper timeouts
    const verySlowTests = tests.filter(t => t.duration > 60000); // 1 minute
    if (verySlowTests.length > 0) {
      recommendations.push(
        `🚨 Found ${verySlowTests.length} tests taking >1min - immediate optimization needed`,
      );
    }

    return recommendations;
  }

  /**
   * Get default analysis when parsing fails
   */
  private static getDefaultAnalysis(): PerformanceAnalysis {
    return {
      totalDuration: 0,
      testCount: 0,
      averageTestDuration: 0,
      slowestTests: [],
      fastestTests: [],
      recommendations: ['Unable to analyze test results - check file format'],
    };
  }

  /**
   * Format analysis results for display
   */
  static formatAnalysis(analysis: PerformanceAnalysis): string {
    const lines: string[] = [];

    lines.push('📊 E2E Test Performance Analysis');
    lines.push('================================');
    lines.push('');

    lines.push('📈 Overall Metrics:');
    lines.push(`  Total Duration: ${this.formatDuration(analysis.totalDuration)}`);
    lines.push(`  Test Count: ${analysis.testCount}`);
    lines.push(`  Average Test Duration: ${this.formatDuration(analysis.averageTestDuration)}`);
    lines.push('');

    if (analysis.slowestTests.length > 0) {
      lines.push('🐌 Slowest Tests:');
      analysis.slowestTests.forEach(test => {
        lines.push(`  ${test.title}: ${this.formatDuration(test.duration)}`);
      });
      lines.push('');
    }

    if (analysis.fastestTests.length > 0) {
      lines.push('⚡ Fastest Tests:');
      analysis.fastestTests.forEach(test => {
        lines.push(`  ${test.title}: ${this.formatDuration(test.duration)}`);
      });
      lines.push('');
    }

    lines.push('💡 Recommendations:');
    analysis.recommendations.forEach(rec => lines.push(`  ${rec}`));

    return lines.join('\n');
  }

  /**
   * Format duration in human-readable format
   */
  private static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}m`;
    }
  }
}

// CLI usage
if (require.main === module) {
  const resultsPath = process.argv[2] || 'test-results/results.json';
  const analysis = PerformanceAnalyzer.analyzeResults(resultsPath);
  console.log(PerformanceAnalyzer.formatAnalysis(analysis));
}
