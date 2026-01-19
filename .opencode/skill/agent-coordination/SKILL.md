---
name: agent-coordination
description:
  Coordinate multiple specialized agents through systematic planning, dependency
  mapping, and quality gate enforcement for complex multi-domain tasks.
---

# Agent Coordination

Enable efficient orchestration of multiple specialized agents to achieve complex
goals through systematic planning, dependency mapping, handoff management, and
quality gate enforcement.

## Quick Reference

- **[Parallel Execution](parallel-execution.md)** - Run independent tasks
  simultaneously
- **[Sequential Execution](sequential-execution.md)** - Execute tasks in
  dependency order
- **[Swarm Execution](swarm-execution.md)** - Multiple agents on related aspects
- **[Iterative Execution](iterative-execution.md)** - Refine through feedback
  loops
- **[Hybrid Execution](hybrid-execution.md)** - Combine multiple strategies
- **[Handoff Management](handoff-management.md)** - Smooth agent transitions
- **[Quality Gates](quality-gates.md)** - Verification checkpoints
- **[Progress Tracking](progress-tracking.md)** - Monitor workflow status

## When to Use

Use this skill when:

- Coordinating multiple specialized agents (2-7 agents)
- Managing complex multi-step workflows
- Handling cross-domain problems
- Optimizing for speed and quality
- Implementing quality gates and handoffs
- Integrating with GitHub Actions CI/CD
- Running parallel/sequential/swarm workflows

## Core Methodology

Systematic agent coordination focusing on four pillars: **Planning**,
**Execution**, **Quality**, and **Verification**.

### Key Principles

1. **Clear Objectives** - Each agent knows exactly what to accomplish
2. **Dependency Mapping** - Identify and respect task dependencies
3. **Quality Gates** - Never skip verification steps
4. **Progress Tracking** - Monitor and report status continuously
5. **Adaptive Planning** - Adjust strategy based on results
6. **Efficient Handoffs** - Complete context transfer between agents
7. **Parallel Execution** - Use parallelism where safe and beneficial
8. **Error Recovery** - Handle agent failures gracefully

### Coordination Hierarchy

```
1. Analyze Goals → Understand requirements and constraints
   ↓
2. Decompose Tasks → Break into agent-assignable units
   ↓
3. Map Dependencies → Identify execution order
   ↓
4. Choose Strategy → Parallel, Sequential, Swarm, Iterative, Hybrid
   ↓
5. Execute & Monitor → Run agents with quality gates
   ↓
6. Verify & Synthesize → Aggregate and validate results
```

## Agent Inventory

### Available Agents

| Agent                     | Specialty          | Use For                          |
| ------------------------- | ------------------ | -------------------------------- |
| **architecture-guardian** | Clean architecture | Layering, boundaries, interfaces |
| **debugger**              | Debugging          | Runtime errors, bugs, failures   |
| **e2e-test-optimizer**    | E2E optimization   | Timeouts, smart waits, sharding  |
| **general**               | Flexible tasks     | Multi-faceted, broad problems    |
| **goap-agent**            | Complex planning   | Multi-step, dependency mapping   |
| **novel-development**     | Novel features     | Plot, characters, world-building |
| **publishing**            | Publishing         | EPUB, covers, platforms          |
| **qa-engineer**           | Quality assurance  | Tests, mocking, coverage         |
| **writing-assistant**     | Writing assistance | Grammar, style, analytics        |

### Available Skills

| Skill                    | Specialty          | Use For               |
| ------------------------ | ------------------ | --------------------- |
| **agent-coordination**   | Orchestration      | This skill            |
| **parallel-execution**   | Parallel workflows | Independent tasks     |
| **goap-agent**           | GOAP planning      | Complex decomposition |
| **e2e-test-optimizer**   | E2E optimization   | Test reliability      |
| **ux-designer**          | UX/UI              | Accessibility, design |
| **performance-engineer** | Performance        | Speed, bundle size    |
| **qa-engineer**          | Testing            | Test quality          |
| **typescript-guardian**  | TypeScript         | Type safety, linting  |

## Execution Strategies

### Strategy Selection Guide

Choose strategy based on:

| Scenario            | Strategy   | Why                   |
| ------------------- | ---------- | --------------------- |
| Independent tasks   | Parallel   | Maximum speed         |
| Clear dependencies  | Sequential | Quality assurance     |
| Complex exploration | Swarm      | Multiple perspectives |
| Quality-critical    | Iterative  | Refine to perfection  |
| Mixed patterns      | Hybrid     | Optimal balance       |

### Strategy Quick Reference

**Parallel**: Fast, independent tasks

```
[Agent 1] + [Agent 2] + [Agent 3] → Results
```

**Sequential**: Dependent tasks, quality gates

```
[Agent 1] → [Gate] → [Agent 2] → [Gate] → [Agent 3]
```

**Swarm**: Exploration, multiple perspectives

```
[Agent 1] ┐
[Agent 2] ├→ Synthesis → Result
[Agent 3] ┘
```

**Iterative**: Quality refinement

```
[Agent] → [Gate] → [Refine] → [Gate] → [Refine] → ...
```

**Hybrid**: Mixed strategies

```
[Agent 1] + [Agent 2] → [Agent 3] → [Agent 4] + [Agent 5]
```

## Quality Gates

### Required Gates

- **Lint Gate**: `npm run lint` - Code quality
- **Type Check Gate**: `tsc --noEmit` - Type safety
- **Unit Test Gate**: `npm run test` - Functionality
- **E2E Test Gate**: `npm run test:e2e` - Integration
- **Build Gate**: `npm run build` - Production readiness

### Enforcement Rule

**NEVER SKIP LINT** - All code changes must pass ESLint before proceeding.

## Handoff Management

### Handoff Components

Each handoff must include:

1. **Context** - Background and context
2. **Objective** - What needs to be done
3. **Artifacts** - Files, data, outputs
4. **Constraints** - Limitations and requirements
5. **Success Criteria** - How to verify completion

### Handoff Flow

```
[Agent A] → Document Results → Quality Gate → [Agent B] → Confirm Understanding
```

## Common Patterns

### Pattern 1: Debug → Fix → Verify

```
Debugger (analyze) → QA Engineer (fix) → QA Engineer (verify)
```

**Use for**: Bug fixes, test failures, runtime errors

### Pattern 2: Design → Implement → Optimize → Test

```
Architecture Guardian (design) → QA Engineer (implement) →
Performance Engineer (optimize) → QA Engineer (test)
```

**Use for**: New features, major refactoring

### Pattern 3: Parallel Analysis → Sequential Implementation

```
[Debugger, E2E-Test-Optimizer, UX Designer] (parallel analysis) →
QA Engineer (implementation)
```

**Use for**: Multi-issue fixes, comprehensive improvements

### Pattern 4: Iterate Until Quality

```
[Agent] (fix) → Quality Gate → [Agent] (refine) → Quality Gate → ...
```

**Use for**: Quality-critical work, complex problems

## GitHub Actions Integration

### Workflow Monitoring

```bash
# List recent runs
gh run list --limit 10

# Get run status
gh run view <run-id>

# Watch until completion
gh run watch

# Loop until success
while ! gh run view --json conclusion --jq '.conclusion | test("success")'; do
  sleep 10
done
```

### Automated Verification

```bash
# Push and monitor
git add . && git commit -m "Fix: description" && git push

# Get run ID
RUN_ID=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

# Watch workflow
gh run watch $RUN_ID

# Check conclusion
CONCLUSION=$(gh run view $RUN_ID --json conclusion --jq '.conclusion')

if [ "$CONCLUSION" == "success" ]; then
  echo "✅ All workflows passed!"
else
  echo "❌ Workflow failed"
  exit 1
fi
```

## Best Practices

### ✅ Do

- Run lint before proceeding with any task
- Verify test coverage for new code
- Use web search for best practices when needed
- Document all handoffs and decisions
- Monitor GitHub Actions for CI/CD status
- Optimize for both speed and quality
- Handle errors gracefully with retries
- Provide clear context to each agent

### ❌ Don't

- Skip quality gates to save time
- Run agents without clear objectives
- Ignore agent failures without analysis
- Proceed without verification
- Make assumptions about agent capabilities
- Forget to document decisions
- Overcommit to parallel execution
- Hand off without full context

## Performance Targets

### Coordination Metrics

- **Agent spawn time**: < 5 seconds per agent
- **Handoff latency**: < 10 seconds between agents
- **Quality gate time**: Lint: < 30s, Tests: < 2m, Build: < 1m
- **Overall workflow**: Optimize for minimal total time
- **Parallel efficiency**: Aim for 60-80% speedup vs sequential

### Quality Metrics

- **Success rate**: > 95% of workflows complete successfully
- **Retry rate**: < 5% of agents need retries
- **Gate pass rate**: 100% (never skip gates)
- **Time to quality**: Minimize iterations

## Error Handling

### When Agent Fails

1. **Analyze**: Why did it fail?
2. **Recover**: Can it be fixed or needs new agent?
3. **Adjust**: Update workflow based on failure
4. **Document**: Record what happened
5. **Continue**: Proceed with remaining tasks

### Retry Strategy

```typescript
async function executeWithRetry(
  agent: string,
  task: any,
  maxRetries = 3,
): Promise<any> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const result = await spawnAgent(agent, task);
      return result;
    } catch (error) {
      attempts++;
      console.error(`Agent ${agent} failed (attempt ${attempts})`);

      if (attempts >= maxRetries) {
        throw error;
      }

      // Refine task based on error
      task = refineTaskBasedOnError(task, error);
    }
  }
}
```

## Example Workflows

### Workflow 1: Fix All Test Failures

```typescript
// Phase 1: Parallel analysis
const [debugResult, e2eResult] = await Promise.all([
  spawnAgent('debugger', { task: 'analyze-test-failures' }),
  spawnAgent('e2e-test-optimizer', { task: 'analyze-timeouts' }),
]);

// Phase 2: Sequential fixes
const fixes = await spawnAgent('qa-engineer', {
  task: 'implement-fixes',
  context: { debugResult, e2eResult },
});

// Phase 3: Verification
await runCommand('npm run lint');
await runCommand('npm run test');
await runCommand('npm run test:e2e');
```

### Workflow 2: Multi-Agent Feature Development

```typescript
// Phase 1: Parallel design
const [archDesign, perfDesign] = await Promise.all([
  spawnAgent('architecture-guardian', { task: 'design-architecture' }),
  spawnAgent('performance-engineer', { task: 'analyze-performance' }),
]);

// Phase 2: Sequential implementation
const implementation = await spawnAgent('qa-engineer', {
  task: 'implement',
  context: { archDesign, perfDesign },
});

// Phase 3: Parallel verification
const [unitTests, e2eTests] = await Promise.all([
  runCommand('npm run test'),
  runCommand('npm run test:e2e'),
]);
```

## Integration Points

Works seamlessly with:

- **goap-agent**: Complex planning and decomposition
- **parallel-execution**: Advanced parallel coordination
- **e2e-test-optimizer**: E2E test optimization
- **qa-engineer**: Test strategy and quality assurance
- **performance-engineer**: Performance optimization
- **ux-designer**: UX and accessibility

## Content Modules

- **[Parallel Execution](parallel-execution.md)** - Parallel workflow details
- **[Sequential Execution](sequential-execution.md)** - Sequential workflow
  details
- **[Swarm Execution](swarm-execution.md)** - Swarm workflow details
- **[Iterative Execution](iterative-execution.md)** - Iterative workflow details
- **[Hybrid Execution](hybrid-execution.md)** - Hybrid workflow details
- **[Handoff Management](handoff-management.md)** - Handoff best practices
- **[Quality Gates](quality-gates.md)** - Quality gate patterns
- **[Progress Tracking](progress-tracking.md)** - Progress monitoring

## Coordinate agents effectively to achieve complex goals.

---

Always use plans/ folder for documentation.
