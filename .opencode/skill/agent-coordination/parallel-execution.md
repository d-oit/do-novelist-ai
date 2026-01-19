# Parallel Execution

Execute multiple independent tasks simultaneously to maximize speed and
efficiency.

## When to Use

- Tasks have no dependencies between them
- Multiple independent issues to fix
- Time-critical workflows
- Tasks that use different resources
- Exploratory analysis phase

## When NOT to Use

- Tasks have clear dependencies
- Quality gates required between steps
- Shared resources cause conflicts
- Results needed for next steps

## Implementation Pattern

### Basic Parallel Execution

```typescript
// Spawn multiple agents simultaneously
const [debuggerResult, e2eResult, uxResult] = await Promise.all([
  spawnAgent('debugger', {
    task: 'analyze-e2e-failures',
    files: ['tests/specs/ai-generation.spec.ts'],
  }),
  spawnAgent('e2e-test-optimizer', {
    task: 'analyze-timeout-issues',
  }),
  spawnAgent('ux-designer', {
    task: 'analyze-a11y-violations',
  }),
]);

console.log('All parallel agents completed');
```

### Parallel with Error Handling

```typescript
const results = await Promise.allSettled([
  spawnAgent('debugger', { task: 'analyze' }),
  spawnAgent('qa-engineer', { task: 'fix' }),
  spawnAgent('performance-engineer', { task: 'optimize' }),
]);

const successes = results.filter(r => r.status === 'fulfilled');
const failures = results.filter(r => r.status === 'rejected');

console.log(`Completed: ${successes.length}, Failed: ${failures.length}`);

if (failures.length > 0) {
  console.error('Failed agents:', failures);
}
```

### Parallel with Batching

```typescript
// Process tasks in batches to control concurrency
const tasks = [
  { agent: 'debugger', task: 'analyze-file-1' },
  { agent: 'debugger', task: 'analyze-file-2' },
  { agent: 'qa-engineer', task: 'fix-file-1' },
  { agent: 'qa-engineer', task: 'fix-file-2' },
  // ... more tasks
];

const BATCH_SIZE = 3;
const results = [];

for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
  const batch = tasks.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(
    batch.map(t => spawnAgent(t.agent, t.task)),
  );
  results.push(...batchResults);
}
```

## Coordination Strategies

### Strategy 1: Fire and Gather

Execute all tasks, wait for all to complete, then aggregate results.

```typescript
// Phase 1: Fire all agents
const analyses = await Promise.all([
  spawnAgent('debugger', { task: 'analyze-failures' }),
  spawnAgent('e2e-test-optimizer', { task: 'analyze-timeouts' }),
  spawnAgent('ux-designer', { task: 'analyze-a11y' }),
]);

// Phase 2: Gather and synthesize
const synthesis = await spawnAgent('goap-agent', {
  task: 'combine-analyses',
  inputs: analyses,
});
```

### Strategy 2: Race Condition

Execute multiple approaches, use first successful result.

```typescript
// Try multiple fixes, use first successful one
const fixes = await Promise.any([
  spawnAgent('debugger', { task: 'fix-approach-1' }),
  spawnAgent('debugger', { task: 'fix-approach-2' }),
  spawnAgent('debugger', { task: 'fix-approach-3' }),
]);

console.log('Successful fix found:', fixes);
```

### Strategy 3: Parallel Pipeline

Process data through multiple parallel stages.

```typescript
// Stage 1: Analysis (parallel)
const analyses = await Promise.all([
  spawnAgent('debugger', { task: 'analyze' }),
  spawnAgent('performance-engineer', { task: 'analyze' }),
]);

// Stage 2: Fix (parallel)
const fixes = await Promise.all([
  spawnAgent('qa-engineer', { task: 'fix', context: analyses[0] }),
  spawnAgent('performance-engineer', {
    task: 'optimize',
    context: analyses[1],
  }),
]);

// Stage 3: Verification (parallel)
const verifications = await Promise.all([
  runCommand('npm run test'),
  runCommand('npm run test:e2e'),
]);
```

## Resource Management

### Concurrent Agent Limit

Control the maximum number of parallel agents:

```typescript
async function executeParallel(
  tasks: any[],
  maxConcurrency = 3,
): Promise<any[]> {
  const results = [];
  const executing: Promise<any>[] = [];

  for (const task of tasks) {
    const promise = spawnAgent(task.agent, task.params).then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });

    results.push(promise);
    executing.push(promise);

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}
```

### Memory Management

```typescript
// Process large datasets in parallel chunks
const largeDataset = loadData(); // 1000 items

const chunks = chunkArray(largeDataset, 100); // 10 chunks of 100 items

for (const chunk of chunks) {
  // Process each chunk in parallel
  const results = await Promise.all(
    chunk.map(item => spawnAgent('agent', { task: item })),
  );

  // Clear chunk from memory before next
  saveResults(results);
}
```

## Error Handling

### Partial Failure Handling

Continue despite some agent failures:

```typescript
const results = await Promise.allSettled([
  spawnAgent('debugger', { task: 'analyze-1' }),
  spawnAgent('debugger', { task: 'analyze-2' }),
  spawnAgent('debugger', { task: 'analyze-3' }),
]);

// Group results
const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

console.log(`Success: ${successful.length}, Failed: ${failed.length}`);

// Proceed with successful results
const synthesis = await spawnAgent('agent', {
  task: 'process',
  data: successful,
});
```

### Retry Failed Parallel Tasks

```typescript
async function parallelWithRetry(tasks: any[], maxRetries = 3): Promise<any[]> {
  let results = await Promise.allSettled(
    tasks.map(t => spawnAgent(t.agent, t.task)),
  );

  let attempt = 0;
  while (attempt < maxRetries) {
    const failedIndices = results
      .map((r, i) => (r.status === 'rejected' ? i : -1))
      .filter(i => i !== -1);

    if (failedIndices.length === 0) break;

    console.log(
      `Retrying ${failedIndices.length} failed tasks (attempt ${attempt + 1})`,
    );

    const retryTasks = failedIndices.map(i => tasks[i]);
    const retryResults = await Promise.allSettled(
      retryTasks.map(t => spawnAgent(t.agent, t.task)),
    );

    // Update results
    retryResults.forEach((r, j) => {
      results[failedIndices[j]] = r;
    });

    attempt++;
  }

  return results;
}
```

## Performance Optimization

### Agent Pool

Reuse agent instances for better performance:

```typescript
class AgentPool {
  private pool: Map<string, any> = new Map();

  async getAgent(agentName: string): Promise<any> {
    if (!this.pool.has(agentName)) {
      this.pool.set(agentName, await spawnAgent(agentName, { init: true }));
    }
    return this.pool.get(agentName);
  }

  async cleanup() {
    for (const [name, agent] of this.pool) {
      await agent.cleanup();
      this.pool.delete(name);
    }
  }
}

// Use pool
const pool = new AgentPool();
const agent1 = await pool.getAgent('debugger');
const agent2 = await pool.getAgent('qa-engineer');

// ... execute tasks ...

await pool.cleanup();
```

### Load Balancing

Distribute work across similar agents:

```typescript
async function distributeTasks(agents: string[], tasks: any[]): Promise<any[]> {
  const agentQueues: Map<string, any[]> = new Map();

  // Initialize queues
  agents.forEach(a => agentQueues.set(a, []));

  // Distribute tasks round-robin
  tasks.forEach((task, i) => {
    const agent = agents[i % agents.length];
    agentQueues.get(agent)!.push(task);
  });

  // Execute each agent's queue
  const results = await Promise.all(
    agents.map(agent =>
      Promise.all(agentQueues.get(agent)!.map(task => spawnAgent(agent, task))),
    ),
  );

  return results.flat();
}

// Use with multiple qa-engineer agents
const results = await distributeTasks(
  ['qa-engineer', 'qa-engineer', 'qa-engineer'],
  tasks,
);
```

## Monitoring

### Parallel Progress

```typescript
async function withProgress(tasks: any[]): Promise<any[]> {
  const total = tasks.length;
  let completed = 0;

  const promises = tasks.map(task =>
    spawnAgent(task.agent, task.task).then(result => {
      completed++;
      console.log(
        `Progress: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`,
      );
      return result;
    }),
  );

  return Promise.all(promises);
}
```

### Timeout Handling

```typescript
async function parallelWithTimeout(
  tasks: any[],
  timeoutMs: number,
): Promise<any[]> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('Parallel execution timeout')),
      timeoutMs,
    ),
  );

  const tasksPromise = Promise.all(tasks.map(t => spawnAgent(t.agent, t.task)));

  return Promise.race([tasksPromise, timeoutPromise]);
}
```

## Best Practices

### ✅ Do

- Use Promise.all() for tasks that must all succeed
- Use Promise.allSettled() for tasks that can partially fail
- Limit concurrency to avoid resource exhaustion
- Provide clear context to each agent
- Handle errors gracefully
- Monitor progress
- Clean up resources

### ❌ Don't

- Run dependent tasks in parallel
- Exceed resource limits
- Ignore failed agents
- Forget to handle errors
- Run too many agents simultaneously
- Forget to monitor progress
- Overload shared resources

## Examples

### Example 1: Parallel Analysis of Test Failures

```typescript
// Analyze different test suites in parallel
const [e2eAnalysis, unitAnalysis, lintAnalysis] = await Promise.all([
  spawnAgent('debugger', {
    task: 'analyze-e2e-failures',
    files: ['tests/specs/ai-generation.spec.ts'],
  }),
  spawnAgent('debugger', {
    task: 'analyze-unit-failures',
    files: ['src/features/editor/hooks/__tests__'],
  }),
  spawnAgent('typescript-guardian', {
    task: 'analyze-lint-issues',
  }),
]);

// Synthesize findings
const summary = await spawnAgent('goap-agent', {
  task: 'combine-analyses',
  inputs: { e2eAnalysis, unitAnalysis, lintAnalysis },
});
```

### Example 2: Parallel Fixes for Independent Issues

```typescript
// Fix different types of issues in parallel
const [a11yFixes, perfFixes, testFixes] = await Promise.all([
  spawnAgent('ux-designer', {
    task: 'fix-a11y-violations',
    violations: ['aria-required-parent', 'landmark-banner-is-top-level'],
  }),
  spawnAgent('performance-engineer', {
    task: 'optimize-chunk-sizes',
    target: 500000,
  }),
  spawnAgent('qa-engineer', {
    task: 'fix-test-failures',
    tests: ['ai-generation.spec.ts', 'mock-validation.spec.ts'],
  }),
]);

// Verify all fixes
await runCommand('npm run lint');
await runCommand('npm run test');
await runCommand('npm run test:e2e');
```

### Example 3: Parallel Verification

```typescript
// Run all verification steps in parallel
const [lintResult, testResult, e2eResult, buildResult] = await Promise.all([
  runCommand('npm run lint'),
  runCommand('npm run test'),
  runCommand('npm run test:e2e'),
  runCommand('npm run build'),
]);

// Check all results
const allPassed = [lintResult, testResult, e2eResult, buildResult].every(
  r => r.exitCode === 0,
);

if (allPassed) {
  console.log('✅ All checks passed!');
} else {
  console.error('❌ Some checks failed');
}
```

## Performance Metrics

- **Speedup**: Near-linear with task count (up to resource limits)
- **Efficiency**: 60-80% of ideal speedup (due to overhead)
- **Overhead**: ~50-100ms per parallel spawn
- **Optimal concurrency**: 2-4 agents for most workflows

## Execute independent tasks simultaneously for maximum speed.
