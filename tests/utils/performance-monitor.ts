/**
 * Performance monitoring utility for E2E tests
 * Tracks test execution times and provides optimization insights
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measurements: Map<string, number> = new Map();
  private testStartTime: number = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring for a test suite
   */
  startTestSuite(name: string): void {
    this.testStartTime = performance.now();
    console.log(`🚀 Starting test suite: ${name}`);
  }

  /**
   * End performance monitoring for a test suite
   */
  endTestSuite(name: string): void {
    const duration = performance.now() - this.testStartTime;
    console.log(`✅ Test suite completed: ${name} (${this.formatDuration(duration)})`);

    // Report all measurements
    console.log('📊 Performance measurements:');
    for (const [key, value] of this.measurements) {
      console.log(`  ${key}: ${this.formatDuration(value)}`);
    }

    // Clear measurements for next test
    this.measurements.clear();
  }

  /**
   * Start timing a specific operation
   */
  startTimer(operationName: string): void {
    this.measurements.set(operationName, performance.now());
  }

  /**
   * End timing and record the duration
   */
  endTimer(operationName: string): void {
    const startTime = this.measurements.get(operationName);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.measurements.set(operationName, duration);
      console.log(`⏱️ ${operationName}: ${this.formatDuration(duration)}`);
    }
  }

  /**
   * Measure async operation with automatic timing
   */
  async measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(operationName);
    try {
      const result = await operation();
      this.endTimer(operationName);
      return result;
    } catch (error) {
      this.endTimer(operationName);
      throw error;
    }
  }

  /**
   * Measure sync operation with automatic timing
   */
  measureSync<T>(operationName: string, operation: () => T): T {
    this.startTimer(operationName);
    try {
      const result = operation();
      this.endTimer(operationName);
      return result;
    } catch (error) {
      this.endTimer(operationName);
      throw error;
    }
  }

  /**
   * Report current performance metrics
   */
  reportMetrics(): void {
    const totalTime = performance.now() - this.testStartTime;
    console.log('📈 Performance Report:');
    console.log(`  Total test suite time: ${this.formatDuration(totalTime)}`);
    console.log(`  Individual measurements:`);

    for (const [key, value] of this.measurements) {
      const percentage = ((value / totalTime) * 100).toFixed(1);
      console.log(`    ${key}: ${this.formatDuration(value)} (${percentage}%)`);
    }
  }

  /**
   * Check if test execution is within performance targets
   */
  validatePerformanceTargets(): { passed: boolean; metrics: Record<string, boolean> } {
    const targets = {
      'Page Load': 3000, // 3 seconds
      Navigation: 2000, // 2 seconds
      'Element Wait': 1000, // 1 second
      'Mock Setup': 500, // 0.5 seconds
    };

    const results: Record<string, boolean> = {};
    let allPassed = true;

    for (const [operation, target] of Object.entries(targets)) {
      const actualTime = this.measurements.get(operation);
      const passed = actualTime ? actualTime <= target : true;
      results[operation] = passed;

      if (!passed) {
        allPassed = false;
        console.warn(
          `⚠️ Performance target missed: ${operation} took ${this.formatDuration(actualTime || 0)}, target: ${this.formatDuration(target)}`,
        );
      }
    }

    return { passed: allPassed, metrics: results };
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}m`;
    }
  }
}

// Global instance for use in tests
export const performanceMonitor = PerformanceMonitor.getInstance();
