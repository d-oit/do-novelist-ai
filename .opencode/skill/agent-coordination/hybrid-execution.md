# Hybrid Execution

Combine multiple execution strategies (parallel, sequential, swarm, iterative)
for optimal workflow efficiency and quality.

## When to Use

- Complex multi-phase workflows
- Mixed dependency patterns
- Need to optimize for both speed and quality
- Large-scale refactoring or feature development
- Comprehensive system improvements

## When NOT to Use

- Simple, single-phase workflows
- Clear single strategy fits all
- Small, well-defined tasks

## Implementation Pattern

### Basic Hybrid

```typescript
async function hybridWorkflow(): Promise<void> {
  // Phase 1: Parallel analysis
  const [debugAnalysis, perfAnalysis, a11yAnalysis] = await Promise.all([
    spawnAgent('debugger', { task: 'analyze-issues' }),
    spawnAgent('performance-engineer', { task: 'analyze-bottlenecks' }),
    spawnAgent('ux-designer', { task: 'analyze-a11y' }),
  ]);

  // Phase 2: Sequential fixes
  const fixes = await spawnAgent('qa-engineer', {
    task: 'implement-fixes',
    context: { debugAnalysis, perfAnalysis, a11yAnalysis },
  });

  await runQualityGate('Lint', 'npm run lint');

  // Phase 3: Parallel verification
  const [unitTests, e2eTests] = await Promise.all([
    runCommand('npm run test'),
    runCommand('npm run test:e2e'),
  ]);

  // Phase 4: Sequential deployment
  await runCommand('git add .');
  await runCommand('git commit -m "fix: resolve all issues"');
  await runCommand('git push');

  await waitForSuccessfulGitHubActions();
}
```

### Hybrid with Dynamic Strategy Selection

```typescript
async function adaptiveHybrid(workflow: any): Promise<void> {
  // Analyze workflow structure
  const structure = await analyzeWorkflow(workflow);

  // Choose optimal strategy for each phase
  const phases = [];

  for (const phase of structure.phases) {
    if (phase.tasks.length === 1) {
      phases.push({ strategy: 'sequential', ...phase });
    } else if (phase.hasDependencies) {
      phases.push({ strategy: 'sequential', ...phase });
    } else if (phase.isExploratory) {
      phases.push({ strategy: 'swarm', ...phase });
    } else if (phase.needsQuality) {
      phases.push({ strategy: 'iterative', ...phase });
    } else {
      phases.push({ strategy: 'parallel', ...phase });
    }
  }

  // Execute each phase with optimal strategy
  for (const phase of phases) {
    console.log(`Executing ${phase.name} with ${phase.strategy} strategy`);
    await executePhase(phase);
  }
}
```

### Complex Multi-Phase Hybrid

```typescript
async function complexHybridWorkflow(): Promise<void> {
  // Phase 1: Swarm exploration
  const [archDesign, perfDesign, testDesign, securityDesign] =
    await Promise.all([
      spawnAgent('architecture-guardian', { task: 'explore-patterns' }),
      spawnAgent('performance-engineer', { task: 'explore-optimizations' }),
      spawnAgent('qa-engineer', { task: 'explore-strategies' }),
      spawnAgent('security-specialist', { task: 'explore-measures' }),
    ]);

  // Synthesize design
  const design = await spawnAgent('goap-agent', {
    task: 'synthesize-design',
    inputs: { archDesign, perfDesign, testDesign, securityDesign },
  });

  // Phase 2: Sequential implementation
  const implementation = await spawnAgent('qa-engineer', {
    task: 'implement',
    context: design,
  });

  await runQualityGate('Lint', 'npm run lint');
  await runQualityGate('Type Check', 'tsc --noEmit');

  // Phase 3: Iterative optimization
  let quality = false;
  let iterations = 0;
  const maxIterations = 5;

  while (!quality && iterations < maxIterations) {
    console.log(`Optimization iteration ${iterations + 1}/${maxIterations}`);

    const [perfOpt, a11yOpt, testOpt] = await Promise.all([
      spawnAgent('performance-engineer', { task: 'optimize' }),
      spawnAgent('ux-designer', { task: 'optimize-a11y' }),
      spawnAgent('qa-engineer', { task: 'optimize-tests' }),
    ]);

    const allResults = await Promise.all([
      runCommand('npm run lint'),
      runCommand('npm run test'),
      runCommand('npm run test:e2e'),
    ]);

    quality = allResults.every(r => r.exitCode === 0);
    iterations++;
  }

  // Phase 4: Parallel final verification
  const [buildResult, e2eResult, perfResult] = await Promise.all([
    runCommand('npm run build'),
    runCommand('npm run test:e2e'),
    runPerformanceAudit(),
  ]);

  // Phase 5: Sequential deployment
  await commitAndPushChanges();
  await waitForSuccessfulGitHubActions();
}
```

## Coordination Strategies

### Strategy 1: Parallel-Sequential-Parallel (PSP)

```typescript
// Phase 1: Parallel analysis
const analysis = await Promise.all([
  spawnAgent('debugger', { task: 'analyze' }),
  spawnAgent('e2e-test-optimizer', { task: 'analyze' }),
]);

// Phase 2: Sequential fixes
await spawnAgent('qa-engineer', { task: 'fix', context: analysis });
await runQualityGate('Lint', 'npm run lint');

// Phase 3: Parallel verification
await Promise.all([
  runCommand('npm run test'),
  runCommand('npm run test:e2e'),
  runCommand('npm run build'),
]);
```

### Strategy 2: Swarm-Iterative-Parallel (SIP)

```typescript
// Phase 1: Swarm design
const designs = await Promise.all([
  spawnAgent('architecture-guardian', { task: 'design' }),
  spawnAgent('performance-engineer', { task: 'design' }),
  spawnAgent('qa-engineer', { task: 'design' }),
]);

const finalDesign = await spawnAgent('goap-agent', {
  task: 'synthesize',
  inputs: designs,
});

// Phase 2: Iterative implementation
await iterateToQuality(
  'qa-engineer',
  { task: 'implement', context: finalDesign },
  { lint: true, test: true },
  (maxIterations = 5),
);

// Phase 3: Parallel final verification
await Promise.all([
  runCommand('npm run lint'),
  runCommand('npm run test'),
  runCommand('npm run test:e2e'),
  runCommand('npm run build'),
]);
```

### Strategy 3: Sequential-Parallel-Iterative (SPI)

```typescript
// Phase 1: Sequential analysis
const analysis = await spawnAgent('debugger', { task: 'analyze' });

// Phase 2: Parallel fixes
const [e2eFixes, a11yFixes, perfFixes] = await Promise.all([
  spawnAgent('qa-engineer', { task: 'fix-e2e', context: analysis }),
  spawnAgent('ux-designer', { task: 'fix-a11y' }),
  spawnAgent('performance-engineer', { task: 'optimize' }),
]);

// Phase 3: Iterative verification
let allPassed = false;
let iterations = 0;

while (!allPassed && iterations < 5) {
  const results = await Promise.all([
    runCommand('npm run lint'),
    runCommand('npm run test'),
    runCommand('npm run test:e2e'),
  ]);

  allPassed = results.every(r => r.exitCode === 0);

  if (!allPassed) {
    // Fix any remaining issues
    await spawnAgent('qa-engineer', { task: 'fix-remaining' });
  }

  iterations++;
}
```

## Phase Coordination

### Phase Transition Management

```typescript
interface Phase {
  name: string;
  strategy: 'parallel' | 'sequential' | 'swarm' | 'iterative';
  tasks: any[];
  gates?: string[];
}

async function executePhases(phases: Phase[]): Promise<void> {
  const phaseResults: Map<string, any> = new Map();

  for (const phase of phases) {
    console.log(`\n=== Phase: ${phase.name} (${phase.strategy}) ===\n`);

    let result: any;

    // Execute based on strategy
    switch (phase.strategy) {
      case 'parallel':
        result = await executeParallel(phase.tasks);
        break;
      case 'sequential':
        result = await executeSequential(phase.tasks);
        break;
      case 'swarm':
        result = await executeSwarm(phase.tasks);
        break;
      case 'iterative':
        result = await executeIterative(phase.tasks);
        break;
    }

    // Run quality gates
    if (phase.gates) {
      for (const gate of phase.gates) {
        await runQualityGate(gate, QUALITY_GATES[gate].command);
      }
    }

    // Store result for next phases
    phaseResults.set(phase.name, result);
  }

  return phaseResults;
}
```

### Data Flow Between Phases

```typescript
interface WorkflowContext {
  phase1?: any;
  phase2?: any;
  phase3?: any;
}

async function executeWithDataFlow(): Promise<void> {
  const context: WorkflowContext = {};

  // Phase 1: Parallel analysis
  context.phase1 = await Promise.all([
    spawnAgent('debugger', { task: 'analyze' }),
    spawnAgent('performance-engineer', { task: 'analyze' }),
  ]);

  // Phase 2: Sequential fixes (uses phase1 data)
  context.phase2 = await spawnAgent('qa-engineer', {
    task: 'fix',
    context: context.phase1,
  });

  await runQualityGate('Lint', 'npm run lint');

  // Phase 3: Parallel verification (uses phase2 data)
  context.phase3 = await Promise.all([
    runCommand('npm run test'),
    runCommand('npm run test:e2e'),
  ]);

  console.log('Workflow completed with data flow:', context);
}
```

## Error Handling

### Phase Rollback

```typescript
async function executeWithPhaseRollback(phases: Phase[]): Promise<void> {
  const completedPhases: number[] = [];

  try {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      await executePhase(phase);
      completedPhases.push(i);
    }
  } catch (error) {
    console.error('Workflow failed:', error);
    console.log('Rolling back completed phases...');

    // Rollback in reverse order
    for (const i of completedPhases.reverse()) {
      await rollbackPhase(phases[i]);
    }

    throw error;
  }
}
```

### Phase Retry

```typescript
async function executeWithPhaseRetry(
  phases: Phase[],
  maxRetries = 2,
): Promise<void> {
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    let attempts = 0;
    let success = false;

    while (!success && attempts <= maxRetries) {
      try {
        console.log(
          `Phase ${phase.name} attempt ${attempts + 1}/${maxRetries + 1}`,
        );

        await executePhase(phase);
        success = true;
      } catch (error) {
        attempts++;

        if (attempts > maxRetries) {
          console.error(
            `Phase ${phase.name} failed after ${maxRetries + 1} attempts`,
          );
          throw error;
        }

        console.error(`Phase ${phase.name} failed, retrying...`);
      }
    }
  }
}
```

## Examples

### Example 1: Full CI/CD Fix Workflow

```typescript
async function fullCIFixWorkflow(): Promise<void> {
  // Phase 1: Parallel analysis
  const [lintIssues, testFailures, e2eFailures] = await Promise.all([
    spawnAgent('typescript-guardian', { task: 'analyze-lint' }),
    spawnAgent('debugger', { task: 'analyze-unit-failures' }),
    spawnAgent('debugger', { task: 'analyze-e2e-failures' }),
  ]);

  // Phase 2: Sequential fixes
  await spawnAgent('qa-engineer', {
    task: 'fix-all',
    context: { lintIssues, testFailures, e2eFailures },
  });

  await runQualityGate('Lint', 'npm run lint');

  // Phase 3: Parallel verification
  const [unitTests, e2eTests, build] = await Promise.all([
    runCommand('npm run test'),
    runCommand('npm run test:e2e'),
    runCommand('npm run build'),
  ]);

  // Phase 4: Sequential deployment
  await runCommand('git add .');
  await runCommand('git commit -m "fix: resolve all CI failures"');
  await runCommand('git push');

  await waitForSuccessfulGitHubActions();
}
```

### Example 2: Feature Development Workflow

```typescript
async function featureDevWorkflow(feature: string): Promise<void> {
  // Phase 1: Swarm design
  const [archDesign, uxDesign, testStrategy] = await Promise.all([
    spawnAgent('architecture-guardian', { task: 'design', feature }),
    spawnAgent('ux-designer', { task: 'design', feature }),
    spawnAgent('qa-engineer', { task: 'design-tests', feature }),
  ]);

  // Synthesize design
  const design = await spawnAgent('goap-agent', {
    task: 'combine',
    inputs: { archDesign, uxDesign, testStrategy },
  });

  // Phase 2: Sequential implementation
  const implementation = await spawnAgent('qa-engineer', {
    task: 'implement',
    context: design,
  });

  await runQualityGate('Lint', 'npm run lint');
  await runQualityGate('Type Check', 'tsc --noEmit');

  // Phase 3: Iterative optimization
  let quality = false;
  let iterations = 0;

  while (!quality && iterations < 5) {
    console.log(`Optimization iteration ${iterations + 1}`);

    const [perfOpt, a11yOpt] = await Promise.all([
      spawnAgent('performance-engineer', { task: 'optimize' }),
      spawnAgent('ux-designer', { task: 'optimize-a11y' }),
    ]);

    const results = await Promise.all([
      runCommand('npm run test'),
      runCommand('npm run test:e2e'),
    ]);

    quality = results.every(r => r.exitCode === 0);
    iterations++;
  }

  // Phase 4: Parallel final verification
  await Promise.all([
    runCommand('npm run build'),
    runAccessibilityAudit(),
    runPerformanceAudit(),
  ]);

  // Phase 5: Deploy
  await commitAndPushChanges();
  await waitForSuccessfulGitHubActions();
}
```

### Example 3: Multi-Agent Bug Fix

```typescript
async function multiAgentBugFix(): Promise<void> {
  // Phase 1: Parallel diagnosis
  const [debugDiagnosis, perfDiagnosis, a11yDiagnosis] = await Promise.all([
    spawnAgent('debugger', { task: 'diagnose-bug' }),
    spawnAgent('performance-engineer', { task: 'diagnose-issue' }),
    spawnAgent('ux-designer', { task: 'diagnose-a11y' }),
  ]);

  // Phase 2: Sequential fix implementation
  const fix = await spawnAgent('qa-engineer', {
    task: 'implement-fix',
    context: { debugDiagnosis, perfDiagnosis, a11yDiagnosis },
  });

  await runQualityGate('Lint', 'npm run lint');

  // Phase 3: Iterative testing
  await testFixCycle('npm run test', 'qa-engineer', {
    task: 'refine-fix',
    context: fix,
  });

  // Phase 4: Parallel E2E and performance verification
  const [e2eResult, perfResult] = await Promise.all([
    runCommand('npm run test:e2e'),
    runPerformanceAudit(),
  ]);

  // Phase 5: Sequential GitHub Actions verification
  await commitAndPushChanges();
  await waitForSuccessfulGitHubActions();
}
```

## Best Practices

### ✅ Do

- Analyze workflow to choose optimal strategies
- Define clear phase boundaries
- Manage data flow between phases
- Implement phase-level error handling
- Use parallel phases where independent
- Use sequential phases where dependent
- Use swarm for exploration phases
- Use iterative for quality-critical phases

### ❌ Don't

- Use single strategy for everything
- Forget phase transitions
- Lose context between phases
- Skip quality gates between phases
- Overuse complex strategies
- Ignore data dependencies
- Mix strategies arbitrarily

## Performance Metrics

- **Efficiency**: 80-90% of optimal parallel execution
- **Quality**: High (all phases verified)
- **Flexibility**: Maximum (adapts to workflow needs)
- **Overhead**: Phase coordination (5-15% overhead)
- **Optimal phases**: 3-5 phases for most workflows

## Combine multiple strategies for optimal workflow efficiency and quality.
