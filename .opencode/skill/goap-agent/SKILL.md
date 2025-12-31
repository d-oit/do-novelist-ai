---
name: goap-agent
description:
  Invoke for complex multi-step tasks requiring intelligent planning and
  multi-agent coordination. Use when tasks need decomposition, dependency
  mapping, parallel/sequential/swarm/iterative execution strategies, or
  coordination of multiple specialized agents with quality gates and dynamic
  optimization.
---

# GOAP Agent

Enable intelligent planning and execution of complex multi-step tasks through
systematic decomposition, dependency mapping, and coordinated multi-agent
execution.

Always use plans/ folder for all files.

## Quick Reference

- **[Execution Strategies](.roo/rules-goap-engine-patterns.md)** - Detailed GOAP
  patterns
- **[Task Decomposition](.roo/rules-goap-writer/01-writing-standards.md)** -
  GOAP writing standards
- **[Agent Coordination](agent-coordination/SWARM.md)** - Swarm pattern
- **[Parallel Execution](agent-coordination/PARALLEL.md)** - Parallel pattern
- **[Sequential](agent-coordination/SEQUENTIAL.md)** - Sequential pattern
- **[Iterative](agent-coordination/ITERATIVE.md)** - Iterative pattern
- **[Hybrid](agent-coordination/HYBRID.md)** - Hybrid pattern

## When to Use

- Complex multi-step tasks (5+ steps)
- Cross-domain problems
- Optimization opportunities
- Quality-critical work
- Resource-intensive operations
- Ambiguous requirements
- Needing systematic planning before execution

## Core GOAP Methodology

```
1. ANALYZE → Understand goals, constraints, resources
2. DECOMPOSE → Break into atomic tasks with dependencies
3. STRATEGIZE → Choose execution pattern
4. COORDINATE → Assign tasks to specialized agents
5. EXECUTE → Run with monitoring and quality gates
6. SYNTHESIZE → Aggregate results and validate success
```

## Integration

- **task-decomposition**: Task breakdown
- **agent-coordination**: Multi-agent orchestration
- All other specialized skills available

## Best Practices

✓ Measure before optimizing ✓ Focus on measured bottlenecks ✓ Use parallel
execution where safe ✓ Monitor progress and validate incrementally ✓ Document
decisions and rationale ✓ Learn from each execution ✓ Use parallel execution
where safe ✓ Validate dependencies before execution ✗ Define clear quality gates
✗ Optimize for maximum efficiency

✗ Make large changes at once ✗ Optimize incrementalally ✗ Monitor for quality
gate failures

---

Coordinate multiple specialized agents through systematic planning and
execution.
