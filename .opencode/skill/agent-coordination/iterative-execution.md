# Iterative Execution

Execute tasks repeatedly, refining results through feedback loops until quality
criteria are met.

## When to Use

- Quality-critical work
- Tasks with inherent feedback loops
- Test-fix cycles
- Performance optimization
- Complex problem solving
- Need to converge on optimal solution

## When NOT to Use

- Tasks with clear single solution
- Time is critical
- Simple, straightforward problems
- No feedback mechanism available

## Implementation Pattern

### Basic Iteration

```typescript
let quality = false;
let iteration = 0;
const maxIterations = 5;

while (!quality && iteration < maxIterations) {
  console.log(`Iteration ${iteration + 1}/${maxIterations}`);

  const result = await spawnAgent('debugger', {
    task: 'fix',
    context: iteration === 0 ? undefined : previousResult,
  });

  // Check quality
  quality = await checkQuality(result);

  if (!quality) {
    console.log('Quality criteria not met, refining...');
    previousResult = result;
  }

  iteration++;
}

if (quality) {
  console.log(`✅ Quality achieved in ${iteration} iterations`);
} else {
  console.warn(`⚠️ Max iterations reached without quality`);
}
```

### Iteration with Metrics

```typescript
interface IterationResult {
  result: any;
  metrics: {
    qualityScore: number;
    testPassRate: number;
    performanceScore: number;
  };
}

async function iterateToQuality(
  task: any,
  agent: string,
  targetQuality: number,
  maxIterations = 5,
): Promise<IterationResult> {
  let bestResult: IterationResult | null = null;
  let currentResult: any = undefined;

  for (let i = 0; i < maxIterations; i++) {
    console.log(`Iteration ${i + 1}/${maxIterations}`);

    // Execute task
    currentResult = await spawnAgent(agent, {
      task,
      context: i === 0 ? undefined : currentResult,
    });

    // Measure quality
    const metrics = await measureQuality(currentResult);
    const iterationResult: IterationResult = {
      result: currentResult,
      metrics,
    };

    // Track best result
    if (!bestResult || metrics.qualityScore > bestResult.metrics.qualityScore) {
      bestResult = iterationResult;
    }

    console.log('Quality metrics:', metrics);

    // Check if target achieved
    if (metrics.qualityScore >= targetQuality) {
      console.log('✅ Target quality achieved!');
      return iterationResult;
    }
  }

  console.warn(`⚠️ Max iterations reached, returning best result`);
  return bestResult!;
}
```

### Iteration with Quality Gates

```typescript
async function iterateWithGates(
  steps: WorkflowStep[],
  maxIterations = 3,
): Promise<void> {
  let iteration = 0;

  while (iteration < maxIterations) {
    console.log(`\n=== Iteration ${iteration + 1}/${maxIterations} ===\n`);

    try {
      // Execute all steps
      for (const step of steps) {
        console.log(`Step: ${step.name}`);

        const result = await spawnAgent(step.agent, step.task);

        // Run quality gates
        if (step.gates) {
          for (const gate of step.gates) {
            await runQualityGate(gate.name, gate.command);
          }
        }
      }

      // If all gates passed, we're done
      console.log('✅ All quality gates passed');
      return;
    } catch (error) {
      console.error(`❌ Iteration ${iteration + 1} failed:`, error);

      // Refine based on error
      steps = refineStepsBasedOnError(steps, error);
    }

    iteration++;
  }

  throw new Error(
    `Failed to pass all quality gates after ${maxIterations} iterations`,
  );
}
```

## Coordination Strategies

### Strategy 1: Test-Fix Cycle

```typescript
async function testFixCycle(
  testCommand: string,
  agent: string,
  task: any,
  maxCycles = 5,
): Promise<void> {
  let cycles = 0;

  while (cycles < maxCycles) {
    cycles++;
    console.log(`Test-fix cycle ${cycles}/${maxCycles}`);

    // Run tests
    const testResult = await runCommand(testCommand);

    if (testResult.exitCode === 0) {
      console.log('✅ All tests passing');
      return;
    }

    // Analyze failures
    const analysis = await spawnAgent('debugger', {
      task: 'analyze-test-failures',
      output: testResult.stderr,
    });

    // Fix failures
    await spawnAgent(agent, {
      ...task,
      context: analysis,
    });

    // Run quality gate
    await runQualityGate('Lint', 'npm run lint');
  }

  throw new Error(`Tests still failing after ${maxCycles} cycles`);
}
```

### Strategy 2: Progressive Refinement

```typescript
async function progressiveRefinement(
  agent: string,
  task: any,
  refinementCriteria: string[],
  maxIterations = 5,
): Promise<any> {
  let currentResult: any = undefined;
  let currentQuality: Record<string, number> = {};

  for (let i = 0; i < maxIterations; i++) {
    console.log(`Refinement iteration ${i + 1}/${maxIterations}`);

    // Execute with previous result as context
    const result = await spawnAgent(agent, {
      task: {
        ...task,
        context: currentResult,
        refinementTarget: currentQuality,
      },
    });

    // Measure quality against criteria
    const quality = await measureRefinement(result, refinementCriteria);
    console.log('Quality metrics:', quality);

    // Check if converged
    const converged = checkConvergence(currentQuality, quality);
    if (converged) {
      console.log('✅ Quality converged');
      return result;
    }

    currentResult = result;
    currentQuality = quality;
  }

  console.warn('⚠️ Max iterations reached, returning current result');
  return currentResult;
}
```

### Strategy 3: Binary Search

```typescript
async function binarySearchIteration(
  agent: string,
  task: any,
  targetMetric: string,
  targetValue: number,
  tolerance = 0.01,
  maxIterations = 10,
): Promise<any> {
  let low = 0;
  let high = 100; // Assuming scale 0-100
  let bestResult: any = undefined;
  let bestValue = Infinity;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;

    console.log(`Binary search iteration ${i + 1}: ${mid.toFixed(2)}`);

    // Execute with parameter
    const result = await spawnAgent(agent, {
      task: {
        ...task,
        parameters: { [targetMetric]: mid },
      },
    });

    // Measure target
    const actualValue = await measureMetric(result, targetMetric);
    console.log(`${targetMetric}: ${actualValue.toFixed(4)}`);

    // Track best
    const distance = Math.abs(actualValue - targetValue);
    if (distance < Math.abs(bestValue - targetValue)) {
      bestResult = result;
      bestValue = actualValue;
    }

    // Check convergence
    if (distance <= tolerance) {
      console.log('✅ Target value achieved');
      return result;
    }

    // Adjust bounds
    if (actualValue < targetValue) {
      low = mid;
    } else {
      high = mid;
    }
  }

  console.warn(`⚠️ Closest value: ${bestValue.toFixed(4)}`);
  return bestResult;
}
```

## Convergence Detection

### Metric-Based Convergence

```typescript
function checkConvergence(
  previous: Record<string, number>,
  current: Record<string, number>,
  threshold = 0.01,
): boolean {
  for (const [metric, value] of Object.entries(current)) {
    const previousValue = previous[metric] || 0;
    const delta = Math.abs(value - previousValue);
    const relativeDelta = delta / (previousValue || 1);

    if (relativeDelta > threshold) {
      console.log(`Metric ${metric} still improving: ${delta.toFixed(4)}`);
      return false;
    }
  }

  return true;
}
```

### Plateau Detection

```typescript
interface MetricHistory {
  metric: string;
  values: number[];
}

function detectPlateau(
  history: MetricHistory[],
  windowSize = 3,
  threshold = 0.005,
): boolean {
  for (const { metric, values } of history) {
    if (values.length < windowSize) continue;

    const recentValues = values.slice(-windowSize);
    const min = Math.min(...recentValues);
    const max = Math.max(...recentValues);
    const range = max - min;

    if (range < threshold) {
      console.log(`Metric ${metric} has plateaued`);
      return true;
    }
  }

  return false;
}
```

### Divergence Detection

```typescript
function detectDivergence(history: MetricHistory[]): boolean {
  for (const { metric, values } of history) {
    if (values.length < 3) continue;

    const recent = values.slice(-3);

    // Check if getting worse
    const trend = recent[2] - recent[0];
    if (Math.abs(trend) > Math.abs(recent[1] - recent[0]) * 2) {
      console.warn(`⚠️ Metric ${metric} is diverging!`);
      return true;
    }
  }

  return false;
}
```

## Error Recovery

### Adaptive Step Size

```typescript
async function adaptiveIteration(
  agent: string,
  task: any,
  metric: string,
  target: number,
  maxIterations = 10,
): Promise<any> {
  let stepSize = 10; // Start with large steps
  let currentValue = 50; // Starting point
  let bestValue = Infinity;
  let bestResult: any;

  for (let i = 0; i < maxIterations; i++) {
    console.log(
      `Iteration ${i + 1}: step size ${stepSize}, value ${currentValue}`,
    );

    try {
      const result = await spawnAgent(agent, {
        task: {
          ...task,
          parameters: { [metric]: currentValue },
        },
      });

      const actualValue = await measureMetric(result, metric);
      const distance = Math.abs(actualValue - target);

      // Track best
      if (distance < Math.abs(bestValue - target)) {
        bestValue = actualValue;
        bestResult = result;
      }

      // Check convergence
      if (distance < 0.01) {
        console.log('✅ Converged');
        return result;
      }

      // Adjust step size
      if (actualValue > target) {
        currentValue -= stepSize;
      } else {
        currentValue += stepSize;
      }

      // Reduce step size
      stepSize *= 0.7;
    } catch (error) {
      console.error('Iteration failed:', error);
      // Reduce step size and try again
      stepSize *= 0.5;
    }
  }

  console.warn('⚠️ Returning best result');
  return bestResult;
}
```

### Fallback on Stagnation

```typescript
async function iterateWithFallback(
  primaryAgent: string,
  fallbackAgent: string,
  task: any,
  maxIterations = 5,
): Promise<any> {
  let iterationsWithoutImprovement = 0;
  const maxStagnation = 3;
  let bestQuality = 0;
  let bestResult: any;

  for (let i = 0; i < maxIterations; i++) {
    console.log(`Iteration ${i + 1}/${maxIterations}`);

    const agent =
      iterationsWithoutImprovement >= maxStagnation
        ? fallbackAgent
        : primaryAgent;

    if (agent === fallbackAgent) {
      console.log('⚠️ Using fallback agent due to stagnation');
    }

    const result = await spawnAgent(agent, task);
    const quality = await measureQuality(result);

    if (quality > bestQuality) {
      bestQuality = quality;
      bestResult = result;
      iterationsWithoutImprovement = 0;
    } else {
      iterationsWithoutImprovement++;
    }

    // Check convergence
    if (quality >= 0.95) {
      console.log('✅ Quality threshold reached');
      return result;
    }
  }

  return bestResult;
}
```

## Examples

### Example 1: E2E Test Optimization

```typescript
async function optimizeE2ETests(): Promise<void> {
  let iteration = 0;
  const maxIterations = 5;

  while (iteration < maxIterations) {
    console.log(
      `\nE2E optimization iteration ${iteration + 1}/${maxIterations}\n`,
    );

    // Step 1: Run E2E tests
    const e2eResult = await runCommand('npm run test:e2e');

    if (e2eResult.exitCode === 0) {
      console.log('✅ All E2E tests passing');
      return;
    }

    // Step 2: Analyze failures
    const analysis = await spawnAgent('debugger', {
      task: 'analyze-e2e-failures',
      output: e2eResult.stderr,
    });

    // Step 3: Implement fixes
    await spawnAgent('qa-engineer', {
      task: 'fix-e2e-issues',
      context: analysis,
    });

    // Step 4: Quality gate
    await runQualityGate('Lint', 'npm run lint');

    iteration++;
  }

  throw new Error('Failed to optimize E2E tests within max iterations');
}
```

### Example 2: Performance Tuning

```typescript
async function tunePerformance(
  targetMetric: 'bundle-size' | 'load-time',
  targetValue: number,
): Promise<void> {
  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    console.log(
      `Performance tuning iteration ${iteration + 1}/${maxIterations}`,
    );

    // Measure current performance
    const currentSize = await measureBundleSize();

    if (currentSize <= targetValue) {
      console.log('✅ Performance target achieved');
      return;
    }

    // Analyze opportunities
    const analysis = await spawnAgent('performance-engineer', {
      task: 'analyze-bundle',
      targetSize: targetValue,
    });

    // Implement optimizations
    await spawnAgent('performance-engineer', {
      task: 'optimize',
      context: analysis,
    });

    // Quality gates
    await runQualityGate('Lint', 'npm run lint');
    await runQualityGate('Build', 'npm run build');

    iteration++;
  }

  const finalSize = await measureBundleSize();
  console.warn(`⚠️ Closest size: ${finalSize} (target: ${targetValue})`);
}
```

### Example 3: Accessibility Refinement

```typescript
async function refineAccessibility(): Promise<void> {
  let iteration = 0;
  const maxIterations = 5;

  while (iteration < maxIterations) {
    console.log(
      `\nA11y refinement iteration ${iteration + 1}/${maxIterations}\n`,
    );

    // Run accessibility audit
    const a11yResult = await runA11yAudit();

    if (a11yResult.violations.length === 0) {
      console.log('✅ No accessibility violations');
      return;
    }

    console.log(`Found ${a11yResult.violations.length} violations`);

    // Fix violations
    await spawnAgent('ux-designer', {
      task: 'fix-a11y-violations',
      violations: a11yResult.violations,
    });

    // Quality gates
    await runQualityGate('Lint', 'npm run lint');
    await runCommand('npm run test'); // Ensure no regressions

    iteration++;
  }

  const finalA11y = await runA11yAudit();
  console.warn(`⚠️ Remaining violations: ${finalA11y.violations.length}`);
}
```

## Best Practices

### ✅ Do

- Define clear quality criteria
- Set maximum iteration limits
- Track quality metrics over time
- Implement convergence detection
- Adjust strategy based on results
- Handle stagnation gracefully
- Document each iteration

### ❌ Don't

- Iterate indefinitely (set limits)
- Ignore convergence signals
- Forget to track metrics
- Use fixed step sizes (adapt them)
- Skip quality gates
- Over-refine (diminishing returns)
- Lose context between iterations

## Performance Metrics

- **Convergence rate**: 70-90% within 5 iterations
- **Quality improvement**: 20-40% over iterations
- **Time per iteration**: Variable (1-5 min)
- **Total time**: 3-10x single iteration
- **Overhead**: Minimal (measurement + decision)

## Iterate to achieve quality through refinement and feedback.
