# Swarm Execution

Deploy multiple agents to work on different aspects of a problem simultaneously,
then synthesize findings.

## When to Use

- Complex problems requiring multiple perspectives
- Exploratory phases of development
- Feature design and architecture
- Brainstorming solutions
- Comprehensive analysis needed

## When NOT to Use

- Tasks have clear single solution
- Time is critical
- Simple, well-defined problems
- Need immediate implementation

## Implementation Pattern

### Basic Swarm

```typescript
// Deploy multiple agents on different aspects
const [designPattern, performanceView, testability] = await Promise.all([
  spawnAgent('architecture-guardian', {
    task: 'analyze-design-patterns',
    context: 'authentication system',
  }),
  spawnAgent('performance-engineer', {
    task: 'analyze-performance',
    context: 'authentication system',
  }),
  spawnAgent('qa-engineer', {
    task: 'analyze-testability',
    context: 'authentication system',
  }),
]);

// Synthesize findings
const synthesis = await spawnAgent('goap-agent', {
  task: 'combine-perspectives',
  inputs: {
    design: designPattern,
    performance: performanceView,
    testability: testability,
  },
});

console.log('Swarm synthesis:', synthesis.recommendations);
```

### Swarm with Voting

```typescript
// Multiple agents propose solutions
const solutions = await Promise.all([
  spawnAgent('debugger', { task: 'propose-fix-approach-1' }),
  spawnAgent('debugger', { task: 'propose-fix-approach-2' }),
  spawnAgent('debugger', { task: 'propose-fix-approach-3' }),
]);

// Evaluate and vote on best
const evaluation = await spawnAgent('goap-agent', {
  task: 'evaluate-solutions',
  inputs: solutions,
  criteria: ['reliability', 'maintainability', 'performance'],
});

console.log('Best solution:', evaluation.best);
```

### Swarm with Consensus

```typescript
// Agents work towards consensus
let consensus = false;
let iteration = 0;
const maxIterations = 5;

while (!consensus && iteration < maxIterations) {
  console.log(`Swarm iteration ${iteration + 1}`);

  // Each agent proposes
  const proposals = await Promise.all([
    spawnAgent('architecture-guardian', { task: 'propose', iteration }),
    spawnAgent('performance-engineer', { task: 'propose', iteration }),
    spawnAgent('qa-engineer', { task: 'propose', iteration }),
  ]);

  // Check for consensus
  const check = await spawnAgent('goap-agent', {
    task: 'check-consensus',
    proposals,
  });

  consensus = check.hasConsensus;
  iteration++;

  if (!consensus) {
    console.log('No consensus, refining proposals...');
    // Agents refine based on feedback
  }
}

console.log('✅ Consensus reached in', iteration, 'iterations');
```

## Coordination Strategies

### Strategy 1: Parallel Exploration

Multiple agents explore different approaches independently.

```typescript
const approaches = await Promise.all([
  spawnAgent('architecture-guardian', {
    task: 'explore-mvc-pattern',
  }),
  spawnAgent('architecture-guardian', {
    task: 'explore-clean-architecture',
  }),
  spawnAgent('architecture-guardian', {
    task: 'explore-ddd-pattern',
  }),
]);

// Compare approaches
const comparison = await spawnAgent('goap-agent', {
  task: 'compare-approaches',
  inputs: approaches,
  criteria: ['complexity', 'maintainability', 'scalability'],
});
```

### Strategy 2: Cross-Pollination

Agents build on each other's ideas in rounds.

```typescript
let ideas = [
  { agent: 'architecture-guardian', idea: 'MVC pattern' },
  { agent: 'qa-engineer', idea: 'Testable architecture' },
  { agent: 'performance-engineer', idea: 'Optimized data flow' },
];

for (let round = 0; round < 3; round++) {
  console.log(`Cross-pollination round ${round + 1}`);

  // Each agent builds on all ideas
  const refined = await Promise.all(
    ideas.map(async (idea, i) => {
      const otherIdeas = ideas.filter((_, j) => j !== i);
      return spawnAgent(idea.agent, {
        task: 'refine-idea',
        idea: idea.idea,
        context: otherIdeas,
      });
    }),
  );

  ideas = refined.map((r, i) => ({
    agent: ideas[i].agent,
    idea: r.refinedIdea,
  }));
}

// Final synthesis
const final = await spawnAgent('goap-agent', {
  task: 'synthesize-final',
  inputs: ideas,
});
```

### Strategy 3: Expert Panels

Different agent types provide expert opinions.

```typescript
const expertOpinions = await Promise.all([
  spawnAgent('architecture-guardian', {
    task: 'expert-opinion',
    domain: 'architecture',
    question: 'How should we structure this feature?',
  }),
  spawnAgent('performance-engineer', {
    task: 'expert-opinion',
    domain: 'performance',
    question: 'What are the performance considerations?',
  }),
  spawnAgent('ux-designer', {
    task: 'expert-opinion',
    domain: 'ux',
    question: 'What are the UX implications?',
  }),
  spawnAgent('qa-engineer', {
    task: 'expert-opinion',
    domain: 'testing',
    question: 'How can we ensure testability?',
  }),
  spawnAgent('security-specialist', {
    task: 'expert-opinion',
    domain: 'security',
    question: 'What security measures are needed?',
  }),
]);

// Compile expert panel findings
const panelReport = await spawnAgent('goap-agent', {
  task: 'compile-expert-panel',
  inputs: expertOpinions,
});

console.log('Expert panel recommendations:', panelReport.recommendations);
```

## Synthesis Strategies

### Strategy 1: Weighted Voting

```typescript
interface Vote {
  agent: string;
  preference: string;
  confidence: number;
  weight: number; // Based on domain expertise
}

// Collect votes
const votes: Vote[] = await Promise.all([
  spawnAgent('architecture-guardian', {
    task: 'vote',
    options: ['Option A', 'Option B', 'Option C'],
  }),
  spawnAgent('qa-engineer', {
    task: 'vote',
    options: ['Option A', 'Option B', 'Option C'],
  }),
  spawnAgent('performance-engineer', {
    task: 'vote',
    options: ['Option A', 'Option B', 'Option C'],
  }),
]);

// Calculate weighted votes
const weightedScores = votes.reduce(
  (acc, vote) => {
    const score = vote.confidence * vote.weight;
    acc[vote.preference] = (acc[vote.preference] || 0) + score;
    return acc;
  },
  {} as Record<string, number>,
);

// Find winner
const winner = Object.entries(weightedScores).reduce((a, b) =>
  b[1] > a[1] ? b : a,
)[0];

console.log('Swarm decision:', winner);
```

### Strategy 2: Best-of-Breed

```typescript
// Agents produce specialized outputs
const [architecture, performance, testing, security] = await Promise.all([
  spawnAgent('architecture-guardian', {
    task: 'design-architecture',
  }),
  spawnAgent('performance-engineer', {
    task: 'optimize-performance',
  }),
  spawnAgent('qa-engineer', {
    task: 'design-tests',
  }),
  spawnAgent('security-specialist', {
    task: 'design-security',
  }),
]);

// Combine best aspects from each
const combined = await spawnAgent('goap-agent', {
  task: 'combine-best-of-breed',
  inputs: {
    architecture: architecture.bestApproach,
    performance: performance.optimizations,
    testing: testing.testStrategy,
    security: security.measures,
  },
});

console.log('Best-of-breed solution:', combined);
```

### Strategy 3: Consensus Building

```typescript
async function buildConsensus(
  agents: string[],
  topic: string,
  maxIterations = 5,
): Promise<any> {
  let proposals: any[] = [];
  let consensus = false;
  let iteration = 0;

  while (!consensus && iteration < maxIterations) {
    console.log(`Consensus iteration ${iteration + 1}`);

    // Collect proposals
    const currentProposals = await Promise.all(
      agents.map(agent =>
        spawnAgent(agent, {
          task: 'propose',
          topic,
          context: proposals, // Previous proposals as context
        }),
      ),
    );

    proposals = currentProposals;

    // Check for consensus
    const analysis = await spawnAgent('goap-agent', {
      task: 'check-consensus',
      proposals,
    });

    consensus = analysis.hasConsensus;

    if (!consensus) {
      console.log('Refining proposals based on feedback...');
    }

    iteration++;
  }

  if (consensus) {
    return analysis.consensusSolution;
  } else {
    throw new Error('Failed to reach consensus');
  }
}

// Use
const solution = await buildConsensus(
  ['architecture-guardian', 'qa-engineer', 'performance-engineer'],
  'authentication system design',
);
```

## Error Handling

### Swarm with Partial Success

```typescript
const results = await Promise.allSettled([
  spawnAgent('architecture-guardian', { task: 'analyze' }),
  spawnAgent('qa-engineer', { task: 'analyze' }),
  spawnAgent('performance-engineer', { task: 'analyze' }),
]);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

// Proceed with successful results
const synthesis = await spawnAgent('goap-agent', {
  task: 'synthesize',
  inputs: successful,
  missingInputs: failed.length > 0 ? ['performance analysis'] : undefined,
});
```

### Swarm with Fallback

```typescript
async function swarmWithFallback(
  primaryAgents: string[],
  fallbackAgent: string,
  task: any,
): Promise<any> {
  try {
    // Try primary swarm
    const results = await Promise.all(
      primaryAgents.map(agent => spawnAgent(agent, task)),
    );

    // Synthesize primary results
    return await spawnAgent('goap-agent', {
      task: 'synthesize',
      inputs: results,
    });
  } catch (error) {
    console.error('Primary swarm failed, using fallback:', error);

    // Use fallback agent
    return await spawnAgent(fallbackAgent, {
      task: 'synthesis-without-swarm',
      context: { originalTask: task, error },
    });
  }
}

// Use
const result = await swarmWithFallback(
  ['architecture-guardian', 'qa-engineer', 'performance-engineer'],
  'general',
  { action: 'analyze', topic: 'authentication' },
);
```

## Examples

### Example 1: Feature Design Swarm

```typescript
// Deploy swarm for feature design
const [archDesign, uxDesign, testStrategy, perfConsiderations] =
  await Promise.all([
    spawnAgent('architecture-guardian', {
      task: 'design-architecture',
      feature: 'user authentication',
    }),
    spawnAgent('ux-designer', {
      task: 'design-ux',
      feature: 'user authentication',
    }),
    spawnAgent('qa-engineer', {
      task: 'design-test-strategy',
      feature: 'user authentication',
    }),
    spawnAgent('performance-engineer', {
      task: 'analyze-performance',
      feature: 'user authentication',
    }),
  ]);

// Synthesize complete design
const featureDesign = await spawnAgent('goap-agent', {
  task: 'create-feature-design',
  inputs: {
    architecture: archDesign,
    ux: uxDesign,
    testing: testStrategy,
    performance: perfConsiderations,
  },
});

console.log('Feature design:', featureDesign);
```

### Example 2: Problem Diagnosis Swarm

```typescript
// Multiple agents diagnose the same issue
const diagnoses = await Promise.all([
  spawnAgent('debugger', {
    task: 'diagnose',
    perspective: 'runtime-error',
    error: 'TypeError: Cannot read property "undefined"',
  }),
  spawnAgent('typescript-guardian', {
    task: 'diagnose',
    perspective: 'type-safety',
    error: 'TypeError: Cannot read property "undefined"',
  }),
  spawnAgent('architecture-guardian', {
    task: 'diagnose',
    perspective: 'architecture',
    error: 'TypeError: Cannot read property "undefined"',
  }),
]);

// Cross-reference diagnoses
const rootCause = await spawnAgent('goap-agent', {
  task: 'cross-reference-diagnoses',
  inputs: diagnoses,
});

console.log('Root cause:', rootCause);
```

### Example 3: Optimization Swarm

```typescript
// Swarm for code optimization
const [readability, maintainability, performance, accessibility] =
  await Promise.all([
    spawnAgent('general', {
      task: 'analyze-readability',
      code: targetCode,
    }),
    spawnAgent('architecture-guardian', {
      task: 'analyze-maintainability',
      code: targetCode,
    }),
    spawnAgent('performance-engineer', {
      task: 'analyze-performance',
      code: targetCode,
    }),
    spawnAgent('ux-designer', {
      task: 'analyze-accessibility',
      code: targetCode,
    }),
  ]);

// Balanced optimization
const optimized = await spawnAgent('goap-agent', {
  task: 'balanced-optimization',
  inputs: { readability, maintainability, performance, accessibility },
  priorities: {
    performance: 'high',
    maintainability: 'high',
    readability: 'medium',
    accessibility: 'high',
  },
});

console.log('Optimized code:', optimized.code);
```

## Best Practices

### ✅ Do

- Use diverse agent perspectives
- Define clear synthesis criteria
- Implement voting/consensus mechanisms
- Handle partial successes gracefully
- Document all agent contributions
- Consider fallback options
- Evaluate multiple approaches

### ❌ Don't

- Deploy too many agents (2-5 is optimal)
- Ignore minority opinions
- Forget to synthesize findings
- Assume consensus will emerge automatically
- Skip quality gates after synthesis
- Ignore agent failures
- Over-engineer simple problems

## Performance Metrics

- **Parallelism**: High (all agents run simultaneously)
- **Quality**: High (multiple perspectives)
- **Overhead**: Synthesis time (10-30s)
- **Optimal agents**: 3-5 for most tasks
- **Consensus rate**: 70-90% within 3 iterations

## Deploy multiple agents for comprehensive exploration and synthesis.
