# Performance Core Guidance

Performance methodology, metrics, and systematic optimization approach.

## Performance Metrics

### Key Performance Indicators (KPIs)

**Web Vitals**:

- **FCP** (First Contentful Paint) < 1.8s
- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1

**Bundle Metrics**:

- **Initial Load**: < 200KB gzipped
- **Chunk Size**: < 50KB per code split chunk
- **Total Size**: < 500KB

**Runtime Metrics**:

- **Time to Interactive**: < 3.5s
- **Frame Rate**: 60 FPS (30 FPS on mobile)
- **Memory Usage**: < 50MB for typical usage

### Performance Monitoring

```typescript
export class PerformanceMonitor {
  measureRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const duration = performance.now() - start;

    if (duration > 16) { // > 60 FPS threshold
      console.warn(`Slow render: ${componentName} took ${duration}ms`);
    }

    return duration;
  }

  trackAPI(operation: string) {
    const start = performance.now();

    return (result: unknown) => {
      const duration = performance.now() - start;

      logger.info('operation_complete', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
      });

      if (duration > 1000) {
        logger.warn('Slow API: ${operation} took ${duration}ms`);
      }

      return result;
    };
  }

  logMetric(name: string, data: Record<string, number>) {
    logger.info('performance_metric', { metric: name, data });
  }
}
```

## Performance Profiling

### React Profiler

```typescript
export function ProfiledComponent() {
  return (
    <Profiler
      id="ComponentName"
      onRender={(id, phase, actualDuration, baseDuration) => {
        console.log({
          id,
          phase,
          actualDuration,
          baseDuration,
          overhead: actualDuration - baseDuration,
        });
      }}
    >
      <ExpensiveComponent />
    </Profiler>
  );
}
```

### Performance API

```typescript
export function measurePerformance() {
  performance.mark('feature-start');

  // Do work...

  performance.mark('feature-end');
  performance.measure('feature', 'feature-start', 'feature-end');

  const measure = performance.getEntriesByName('feature')[0];

  console.log(`Feature took ${measure.duration}ms`);

  performance.clearMarks();
  performance.clearMeasures();
}
```

## Optimization Strategy

### 1. Measure First

Before optimizing anything:

1. Use Performance Monitor to track current metrics
2. Profile the application with React Profiler
3. Identify actual bottlenecks
4. Measure baseline performance

### 2. Profile to Find Bottlenecks

**Tools**:

- Chrome DevTools Performance tab
- React Profiler
- Performance Monitor logs
- Lighthouse CI

**Process**:

1. Record baseline metrics
2. Run load scenarios
3. Identify slow components
4. Find expensive operations
5. Measure impact of potential changes

### 3. Focus on Critical Path

**Prioritization**:

- Critical: User-facing, blocking operations
- High: Frequently used paths
- Medium: Less frequent paths
- Low: Rare paths

**Example**:

```typescript
// ✗ Bad - Optimize everything equally
optimizeAllComponents();

// ✅ Good - Focus on critical path
optimizeCriticalPath();
optimizeFrequentPaths();
```

### 4. Optimize Incrementally

**Process**:

1. Make one change at a time
2. Measure impact
3. Roll back if no improvement
4. Build performance history

**Example**:

```typescript
// Before: 2.5s Time to Interactive
const beforeTTI = 2500;

// After optimization: 2.1s
const afterTTI = 2100;
const improvement = ((beforeTTI - afterTTI) / beforeTTI) * 100).toFixed(1); // 16% improvement
```

## Performance Targets

### Target Metrics

| Metric  | Target        | Methodology     |
| ------- | ------------- | --------------- |
| FCP     | < 1.8s        | 95th percentile |
| LCP     | < 2.5s        | 75th percentile |
| FID     | < 100ms       | 75th percentile |
| CLS     | < 0.1         | 95th percentile |
| Bundle  | < 500KB total | Gzipped         |
| Runtime | < 3.5s TTI    | User perception |

### Validation

After each optimization:

- [ ] Measure baseline performance
- [ ] Apply optimization
- [ ] Measure new performance
- [ ] Calculate improvement
- [ ] Document results
- [ ] Roll back if no benefit

## Continuous Monitoring

### Metrics Dashboard

```typescript
interface PerformanceDashboard {
  // Current metrics
  metrics: {
    webVitals: WebVitalsData;
    bundleSize: BundleMetrics;
    runtime: RuntimeMetrics;
  };

  // History
  history: PerformanceSnapshot[];

  // Alerts
  alerts: PerformanceAlert[];
}

// Update dashboard with new measurements
function updateDashboard(
  metric: keyof PerformanceDashboard['metrics'],
  value: number,
) {
  dashboard.metrics[metric] = value;

  checkForAlerts(metric, value);

  return dashboard;
}
```

### Alert System

```typescript
// Define alert thresholds
const ALERT_THRESHOLDS = {
  fcpSlow: 2500, // 2.5s
  lcpSlow: 3000, // 3.0s
  fidSlow: 150, // 150ms
  memoryHigh: 50 * 1024 * 1024, // 50MB
};

// Check for performance regressions
function checkForRegressions() {
  const currentMetrics = getCurrentMetrics();
  const baseline = getBaselineMetrics();

  if (currentMetrics.tti > baseline.tti * 1.2) {
    sendAlert('Performance regression detected', currentMetrics);
  }
}
```

## Best Practices

### DO

```typescript
// ✅ Profile before optimizing
const beforeOptimizing = measureBaselinePerformance();

const optimization = applyOptimization();

const afterOptimizing = measureBaselinePerformance();

// ✅ Focus on critical path
const criticalPathOptimization = optimizeMostUsedRoutes();

// ✅ Measure after each change
validatePerformanceImpact();

// ✅ Document results
documentOptimizationResults();
```

### DON'T

```typescript
// ✗ Optimize without measuring
optimizeEverything(); // No baseline!

// ✗ Optimize theoretical bottlenecks
optimizeRarelyUsedPath(); // Wastes effort

// ✗ Make large changes at once
const massiveRefactor = refactorEntireModule(); // High risk, hard to debug

// ✗ Ignore performance impact
optimizeCodeWithoutCheckingImpact(); // Might slow things down!
```

---

Systematic performance optimization through measurement, profiling, and
incremental improvement.
