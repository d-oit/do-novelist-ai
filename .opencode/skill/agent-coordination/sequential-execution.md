# Sequential Execution

Execute tasks in a specific order based on dependencies and quality gates.

## When to Use

- Tasks have clear dependencies
- Quality gates required between steps
- Output of one task is input to another
- Critical path optimization needed
- Need to verify before proceeding

## When NOT to Use

- Tasks are independent
- Time is critical
- Resources are underutilized

## Implementation Pattern

### Basic Sequential Execution

```typescript
// Execute tasks in order, waiting for each to complete
const analysis = await spawnAgent('debugger', {
  task: 'analyze-test-failures',
});

console.log('Analysis complete:', analysis);

const fixes = await spawnAgent('qa-engineer', {
  task: 'implement-fixes',
  context: analysis,
});

console.log('Fixes complete:', fixes);

const verification = await spawnAgent('qa-engineer', {
  task: 'verify-fixes',
  context: fixes,
});

console.log('Verification complete:', verification);
```

### Sequential with Error Handling

```typescript
try {
  const analysis = await spawnAgent('debugger', { task: 'analyze' });

  try {
    const fixes = await spawnAgent('qa-engineer', {
      task: 'fix',
      context: analysis,
    });

    try {
      await spawnAgent('qa-engineer', {
        task: 'verify',
        context: fixes,
      });

      console.log('✅ Workflow completed successfully');
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Fix implementation failed:', error);
    throw error;
  }
} catch (error) {
  console.error('Analysis failed:', error);
  throw error;
}
```

### Sequential with Retry

```typescript
async function sequentialWithRetry(
  steps: Array<{ agent: string; task: any; maxRetries?: number }>,
): Promise<any[]> {
  const results = [];

  for (const step of steps) {
    let attempts = 0;
    const maxRetries = step.maxRetries || 3;

    while (attempts < maxRetries) {
      try {
        const result = await spawnAgent(step.agent, step.task);
        results.push(result);
        break;
      } catch (error) {
        attempts++;
        console.error(
          `Step ${steps.indexOf(step) + 1} failed (attempt ${attempts})`,
          error,
        );

        if (attempts >= maxRetries) {
          throw new Error(
            `Step ${steps.indexOf(step) + 1} failed after ${maxRetries} attempts`,
          );
        }
      }
    }
  }

  return results;
}

// Use
const results = await sequentialWithRetry([
  { agent: 'debugger', task: { action: 'analyze' }, maxRetries: 2 },
  { agent: 'qa-engineer', task: { action: 'fix' }, maxRetries: 3 },
  { agent: 'qa-engineer', task: { action: 'verify' }, maxRetries: 3 },
]);
```

## Quality Gates

### Gate Implementation

```typescript
async function runQualityGate(name: string, command: string): Promise<void> {
  console.log(`Running quality gate: ${name}`);

  const result = await runCommand(command);

  if (result.exitCode !== 0) {
    console.error(`❌ Quality gate ${name} failed!`);
    console.error('Output:', result.stderr);
    throw new Error(`Quality gate ${name} failed`);
  }

  console.log(`✅ Quality gate ${name} passed`);
}

// Sequential execution with quality gates
async function sequentialWithGates(workflow: WorkflowStep[]): Promise<void> {
  for (const step of workflow) {
    console.log(`Executing step: ${step.name}`);

    // Execute step
    const result = await spawnAgent(step.agent, step.task);

    // Run quality gates
    if (step.gates) {
      for (const gate of step.gates) {
        await runQualityGate(gate.name, gate.command);
      }
    }

    console.log(`✅ Step ${step.name} completed`);
  }
}
```

### Common Quality Gates

```typescript
const QUALITY_GATES = {
  lint: {
    name: 'Lint',
    command: 'npm run lint',
    description: 'ESLint + TypeScript checking',
  },
  test: {
    name: 'Unit Tests',
    command: 'npm run test',
    description: 'Vitest unit tests',
  },
  'test:e2e': {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    description: 'Playwright E2E tests',
  },
  build: {
    name: 'Build',
    command: 'npm run build',
    description: 'Production build',
  },
};

// Usage
await runQualityGate(QUALITY_GATES.lint.name, QUALITY_GATES.lint.command);
```

## Coordination Strategies

### Strategy 1: Waterfall

Each task depends on the previous one's completion.

```typescript
// Waterfall pattern: A → B → C → D
const analysis = await spawnAgent('debugger', { task: 'analyze' });
const design = await spawnAgent('architecture-guardian', {
  task: 'design',
  context: analysis,
});
const implementation = await spawnAgent('qa-engineer', {
  task: 'implement',
  context: design,
});
const verification = await spawnAgent('qa-engineer', {
  task: 'verify',
  context: implementation,
});
```

### Strategy 2: Sequential Parallel

Run parallel steps in sequence.

```typescript
// Phase 1: Parallel analysis
const [analysis1, analysis2] = await Promise.all([
  spawnAgent('debugger', { task: 'analyze-e2e' }),
  spawnAgent('debugger', { task: 'analyze-unit' }),
]);

// Phase 2: Sequential fixes (depends on analysis)
const fix1 = await spawnAgent('qa-engineer', {
  task: 'fix-e2e',
  context: analysis1,
});

await runQualityGate('Lint', 'npm run lint');

const fix2 = await spawnAgent('qa-engineer', {
  task: 'fix-unit',
  context: analysis2,
});

// Phase 3: Parallel verification
await Promise.all([runCommand('npm run test'), runCommand('npm run test:e2e')]);
```

### Strategy 3: Gate Chain

Each step has multiple quality gates.

```typescript
const workflow = [
  {
    name: 'Analysis',
    agent: 'debugger',
    task: { action: 'analyze' },
    gates: [], // No gates for analysis
  },
  {
    name: 'Fix Implementation',
    agent: 'qa-engineer',
    task: { action: 'fix' },
    gates: [
      { name: 'Lint', command: 'npm run lint' },
      { name: 'Type Check', command: 'tsc --noEmit' },
    ],
  },
  {
    name: 'Verification',
    agent: 'qa-engineer',
    task: { action: 'verify' },
    gates: [
      { name: 'Unit Tests', command: 'npm run test' },
      { name: 'E2E Tests', command: 'npm run test:e2e' },
      { name: 'Build', command: 'npm run build' },
    ],
  },
];

await sequentialWithGates(workflow);
```

## State Management

### Context Passing

Pass state between sequential steps:

```typescript
interface WorkflowState {
  analysis?: any;
  design?: any;
  implementation?: any;
  verification?: any;
}

async function executeWorkflow(): Promise<WorkflowState> {
  const state: WorkflowState = {};

  // Step 1: Analysis
  state.analysis = await spawnAgent('debugger', { task: 'analyze' });
  console.log('State after analysis:', state);

  // Step 2: Design (uses analysis)
  state.design = await spawnAgent('architecture-guardian', {
    task: 'design',
    context: state.analysis,
  });
  console.log('State after design:', state);

  // Step 3: Implementation (uses design)
  state.implementation = await spawnAgent('qa-engineer', {
    task: 'implement',
    context: state.design,
  });
  console.log('State after implementation:', state);

  // Step 4: Verification (uses implementation)
  state.verification = await spawnAgent('qa-engineer', {
    task: 'verify',
    context: state.implementation,
  });
  console.log('State after verification:', state);

  return state;
}
```

### Checkpoint/Resume

Save state for resume capability:

```typescript
interface Checkpoint {
  step: number;
  state: WorkflowState;
  timestamp: number;
}

async function executeWithResume(): Promise<void> {
  let state: WorkflowState = {};
  let startStep = 0;

  // Check for existing checkpoint
  const checkpoint = await loadCheckpoint();

  if (checkpoint) {
    console.log(`Resuming from step ${checkpoint.step}`);
    state = checkpoint.state;
    startStep = checkpoint.step + 1;
  }

  const steps = [
    { agent: 'debugger', task: 'analyze' },
    { agent: 'qa-engineer', task: 'fix' },
    { agent: 'qa-engineer', task: 'verify' },
  ];

  for (let i = startStep; i < steps.length; i++) {
    const step = steps[i];
    console.log(`Executing step ${i + 1}/${steps.length}`);

    state[`step${i + 1}`] = await spawnAgent(step.agent, step.task);

    // Save checkpoint
    await saveCheckpoint({
      step: i,
      state,
      timestamp: Date.now(),
    });
  }

  // Clean up checkpoint on success
  await removeCheckpoint();
}
```

## Progress Tracking

### Progress Callbacks

```typescript
interface ProgressCallback {
  (current: number, total: number, step: string): void;
}

async function sequentialWithProgress(
  steps: WorkflowStep[],
  onProgress?: ProgressCallback,
): Promise<any[]> {
  const results = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    console.log(`Step ${i + 1}/${steps.length}: ${step.name}`);

    if (onProgress) {
      onProgress(i + 1, steps.length, step.name);
    }

    const result = await spawnAgent(step.agent, step.task);
    results.push(result);

    console.log(`✅ Step ${step.name} completed`);
  }

  return results;
}

// Usage
await sequentialWithProgress(workflow, (current, total, step) => {
  console.log(
    `Progress: ${current}/${total} (${Math.round((current / total) * 100)}%) - ${step}`,
  );
});
```

### Estimated Time Remaining

```typescript
interface TimedStep {
  name: string;
  agent: string;
  task: any;
  estimatedMs: number;
}

async function sequentialWithETR(steps: TimedStep[]): Promise<void> {
  const startTime = Date.now();
  let estimatedRemaining = steps.reduce((sum, s) => sum + s.estimatedMs, 0);

  console.log(`Estimated total time: ${estimatedRemaining / 1000}s`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepStart = Date.now();

    console.log(`Step ${i + 1}/${steps.length}: ${step.name}`);
    console.log(`Estimated remaining: ${estimatedRemaining / 1000}s`);

    await spawnAgent(step.agent, step.task);

    const stepDuration = Date.now() - stepStart;
    estimatedRemaining -= step.estimatedMs;

    console.log(`✅ Step completed in ${stepDuration / 1000}s`);
  }

  const totalDuration = Date.now() - startTime;
  console.log(`Total duration: ${totalDuration / 1000}s`);
}
```

## Error Recovery

### Rollback on Failure

```typescript
async function sequentialWithRollback(
  steps: Array<{
    agent: string;
    task: any;
    rollback?: (result: any) => Promise<void>;
  }>,
): Promise<void> {
  const results: any[] = [];
  const completedIndices: number[] = [];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const result = await spawnAgent(step.agent, step.task);
      results.push(result);
      completedIndices.push(i);
    }
  } catch (error) {
    console.error('Workflow failed:', error);
    console.log('Rolling back completed steps...');

    // Roll back in reverse order
    for (const i of completedIndices.reverse()) {
      const step = steps[i];
      if (step.rollback) {
        console.log(`Rolling back step ${i + 1}: ${step.agent}`);
        await step.rollback(results[i]);
      }
    }

    throw error;
  }
}
```

### Skip on Warning

```typescript
async function sequentialWithSkip(
  steps: Array<{
    name: string;
    agent: string;
    task: any;
    skipOnWarning?: boolean;
  }>,
): Promise<any[]> {
  const results = [];
  const skipped: number[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    try {
      const result = await spawnAgent(step.agent, step.task);
      results.push({ status: 'success', result });
    } catch (error: any) {
      if (step.skipOnWarning && error.level === 'warning') {
        console.warn(`⚠️ Skipping step ${step.name}:`, error.message);
        skipped.push(i);
        results.push({ status: 'skipped', error });
      } else {
        console.error(`❌ Step ${step.name} failed:`, error);
        throw error;
      }
    }
  }

  if (skipped.length > 0) {
    console.warn(`⚠️ Skipped ${skipped.length} steps with warnings`);
  }

  return results;
}
```

## Examples

### Example 1: Debug → Fix → Verify

```typescript
// Step 1: Analyze failures
const analysis = await spawnAgent('debugger', {
  task: 'analyze-e2e-failures',
  files: [
    'tests/specs/ai-generation.spec.ts',
    'tests/specs/mock-validation.spec.ts',
  ],
});

console.log('Analysis results:', analysis.findings);

// Step 2: Implement fixes
const fixes = await spawnAgent('qa-engineer', {
  task: 'implement-fixes',
  context: {
    testFailures: analysis.testFailures,
    rootCauses: analysis.rootCauses,
  },
  constraints: {
    mustPassLint: true,
    maintainAccessibility: true,
  },
});

console.log('Fixes implemented:', fixes.changes);

// Step 3: Verify fixes
const verification = await spawnAgent('qa-engineer', {
  task: 'verify-fixes',
  context: fixes,
});

console.log('Verification:', verification);
```

### Example 2: Multi-Stage with Quality Gates

```typescript
const workflow = [
  {
    name: 'Analyze Issues',
    agent: 'debugger',
    task: { action: 'analyze-issues' },
  },
  {
    name: 'Fix E2E Tests',
    agent: 'qa-engineer',
    task: { action: 'fix-e2e' },
    gates: ['lint', 'type-check'],
  },
  {
    name: 'Fix Accessibility',
    agent: 'ux-designer',
    task: { action: 'fix-a11y' },
    gates: ['lint'],
  },
  {
    name: 'Optimize Performance',
    agent: 'performance-engineer',
    task: { action: 'optimize-chunks' },
    gates: ['lint', 'build'],
  },
  {
    name: 'Final Verification',
    agent: 'qa-engineer',
    task: { action: 'verify-all' },
    gates: ['lint', 'test', 'test:e2e', 'build'],
  },
];

await executeWorkflowWithGates(workflow);
```

### Example 3: GitHub Actions Integration

```typescript
// Sequential workflow with GitHub Actions monitoring
async function fixAndVerify(): Promise<void> {
  // Step 1: Implement fixes
  const fixes = await spawnAgent('qa-engineer', {
    task: 'implement-all-fixes',
  });

  // Step 2: Run quality gates
  await runQualityGate('Lint', 'npm run lint');
  await runQualityGate('Unit Tests', 'npm run test');
  await runQualityGate('E2E Tests', 'npm run test:e2e');
  await runQualityGate('Build', 'npm run build');

  // Step 3: Commit and push
  await runCommand('git add .');
  await runCommand(
    'git commit -m "fix: resolve all test and accessibility issues"',
  );
  await runCommand('git push');

  // Step 4: Monitor GitHub Actions until success
  await waitForSuccessfulGitHubActions();
}
```

## Best Practices

### ✅ Do

- Run quality gates between steps
- Pass context explicitly
- Track progress and ETR
- Implement error recovery
- Document each step
- Verify before proceeding
- Use checkpoints for long workflows

### ❌ Don't

- Skip quality gates
- Forget to pass context
- Run dependent steps in parallel
- Ignore errors
- Proceed without verification
- Forget to track progress
- Lose state between steps

## Performance Metrics

- **Sequential overhead**: Minimal (just agent spawn time)
- **Total time**: Sum of all step times + gate times
- **Predictability**: High (exact time known)
- **Quality assurance**: Maximum (every step verified)

## Execute tasks in dependency order with quality gates.
