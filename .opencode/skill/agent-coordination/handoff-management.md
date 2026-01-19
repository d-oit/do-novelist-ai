# Handoff Management

Ensure smooth, complete information transfer between agents in a multi-agent
workflow.

## Why Handoffs Matter

- **Context Loss**: Without proper handoffs, agents work with incomplete
  information
- **Repetition**: Poor handoffs force agents to redo analysis
- **Quality**: Complete context enables better decisions
- **Efficiency**: Good handoffs reduce redundant work
- **Traceability**: Documented handoffs enable debugging

## Handoff Components

### Required Elements

Every handoff must include:

1. **Context** - Background about work done so far
2. **Objective** - What the receiving agent needs to accomplish
3. **Artifacts** - Files, data, outputs from previous agents
4. **Constraints** - Limitations, requirements, quality gates
5. **Success Criteria** - How to verify completion
6. **Metadata** - Timestamp, agent names, task IDs

### Optional Elements

- **Assumptions** - Explicit statements about what's assumed
- **Open Questions** - Issues that need clarification
- **Next Steps** - Suggested follow-up actions
- **Dependencies** - What must happen after this task

## Handoff Structure

### Template

```markdown
## Handoff from [Source Agent] to [Receiving Agent]

### Metadata

- **Timestamp**: ISO-8601 timestamp
- **Source Agent**: Agent name
- **Receiving Agent**: Agent name
- **Task ID**: Unique identifier
- **Workflow Phase**: Phase name/number

### Context

[Brief explanation of overall workflow, what has been done, and why we're here]

### Objective

[Clear statement of what needs to be accomplished]

### Previous Work

- **Agent**: Name and task
- **Result**: Brief summary of what was accomplished
- **Relevance**: Why this matters for next task

### Artifacts

- **Files Modified**: List of files with changes
- **Code Snippets**: Relevant code sections
- **Test Results**: Output from tests
- **Analysis**: Findings, root causes, patterns
- **Data**: Any data structures or objects

### Constraints

- **Must Pass Lint**: true/false
- **Maintain Accessibility**: WCAG level
- **No Breaking Changes**: List of critical features
- **Performance Targets**: Metrics to achieve
- **Time Constraints**: Deadlines or limits

### Success Criteria

- [ ] All tests passing (unit + E2E)
- [ ] No lint errors
- [ ] No accessibility violations
- [ ] Performance targets met
- [ ] Documentation updated

### Assumptions

[Any assumptions made that should be verified]

### Open Questions

[Any questions or uncertainties that need clarification]

### Next Steps

[Suggested actions after this task completes]

---
```

### TypeScript Interface

```typescript
interface Handoff {
  metadata: {
    timestamp: string;
    sourceAgent: string;
    receivingAgent: string;
    taskId: string;
    workflowPhase: string;
  };
  context: string;
  objective: string;
  previousWork: Array<{
    agent: string;
    task: string;
    result: string;
    relevance: string;
  }>;
  artifacts: {
    filesModified: string[];
    codeSnippets: Array<{
      file: string;
      snippet: string;
      description: string;
    }>;
    testResults: string;
    analysis: any;
    data: any;
  };
  constraints: {
    mustPassLint: boolean;
    maintainAccessibility?: 'wcag-a' | 'wcag-aa' | 'wcag-aaa';
    noBreakingChanges?: string[];
    performanceTargets?: Record<string, number>;
    timeConstraints?: number; // milliseconds
  };
  successCriteria: string[];
  assumptions: string[];
  openQuestions: string[];
  nextSteps?: string[];
}
```

## Handoff Patterns

### Pattern 1: Analysis to Implementation

```markdown
## Handoff from Debugger to QA Engineer

### Context

We're fixing failing E2E tests and accessibility issues. The debugger has
analyzed the root causes and identified specific fixes needed.

### Objective

Implement the identified fixes for E2E test failures and accessibility
violations.

### Artifacts

**Files to Fix:**

- `tests/specs/ai-generation.spec.ts` - Navigation test failing
- `tests/specs/mock-validation.spec.ts` - AI mock configuration test failing

**Root Causes:**

1. Navigation test: Missing mock for settings page navigation
2. Mock validation: AI mock routes not properly registered

**Accessibility Violations:**

- `aria-required-parent`: 6 elements need proper ARIA parent hierarchy
- Landmark issues: Banner/main landmarks not at top level

### Constraints

- Must pass lint
- Maintain WCAG AA accessibility
- Don't break existing tests

### Success Criteria

- [ ] E2E navigation test passes
- [ ] AI mock validation test passes
- [ ] All accessibility violations fixed
- [ ] No regressions in other tests
```

### Pattern 2: Implementation to Verification

```markdown
## Handoff from QA Engineer to QA Engineer (Verification)

### Context

All fixes have been implemented. Now we need to verify everything works.

### Objective

Run full test suite and verify all fixes are working correctly.

### Artifacts

**Changes Made:**

- Added mock for settings navigation in `tests/helpers/mocks.ts`
- Fixed ARIA hierarchy in `src/components/Header.tsx`
- Fixed landmark structure in `src/app/App.tsx`

**Test Files to Verify:**

- `tests/specs/ai-generation.spec.ts`
- `tests/specs/mock-validation.spec.ts`
- All other test files for regressions

### Constraints

- Must pass all quality gates
- Document any failures
- Report execution time

### Success Criteria

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Lint passes
- [ ] Build succeeds
- [ ] No accessibility violations
```

### Pattern 3: Verification to Deployment

```markdown
## Handoff from QA Engineer to Deployment

### Context

All tests passing, ready to deploy fixes.

### Objective

Commit, push, and verify GitHub Actions pass.

### Artifacts

**Changes:**

- 3 files modified
- 2 tests fixed
- 5 accessibility violations resolved

**Verification Results:**

- Unit tests: 2036/2036 passed
- E2E tests: 324/324 passed
- Lint: 0 errors, 0 warnings
- Build: Success
- Accessibility: 0 violations

### Constraints

- Never skip lint in commit
- Use conventional commit message
- Wait for GitHub Actions to complete

### Success Criteria

- [ ] Changes committed and pushed
- [ ] GitHub Actions all green
- [ ] No rollbacks needed
```

## Handoff Verification

### Receiving Agent Checklist

Before starting work, the receiving agent should verify:

```typescript
interface HandoffVerification {
  understandContext: boolean;
  haveAllArtifacts: boolean;
  knowConstraints: boolean;
  successCriteriaClear: boolean;
  haveQuestions: boolean;
}

async function verifyHandoff(handoff: Handoff): Promise<HandoffVerification> {
  return {
    understandContext: !!handoff.context,
    haveAllArtifacts: Object.keys(handoff.artifacts).length > 0,
    knowConstraints: !!handoff.constraints,
    successCriteriaClear: handoff.successCriteria.length > 0,
    haveQuestions: handoff.openQuestions.length > 0,
  };
}
```

### Confirmation Protocol

```markdown
## Handoff Confirmation

I acknowledge receipt of handoff from [Source Agent].

### Understanding

- ✅ Context understood: [brief summary]
- ✅ Objective clear: [what I'll do]
- ✅ Artifacts received: [list]
- ✅ Constraints noted: [list]

### Questions

[Any clarifications needed]

### Plan

[Brief description of how I'll proceed]

---
```

## Handoff Storage

### File-Based Storage

```typescript
// Save handoff to file
async function saveHandoff(handoff: Handoff, path: string): Promise<void> {
  const content = formatHandoffAsMarkdown(handoff);
  await fs.writeFile(path, content, 'utf-8');
  console.log(`Handoff saved to: ${path}`);
}

// Load handoff from file
async function loadHandoff(path: string): Promise<Handoff> {
  const content = await fs.readFile(path, 'utf-8');
  return parseHandoffFromMarkdown(content);
}

// Usage
const handoff: Handoff = {
  metadata: {
    /* ... */
  },
  context: 'Fixing E2E test failures',
  // ...
};

await saveHandoff(handoff, 'plans/handoff-debugger-to-qa.md');
```

### In-Memory Storage

```typescript
class HandoffManager {
  private handoffs: Map<string, Handoff> = new Map();

  store(id: string, handoff: Handoff): void {
    this.handoffs.set(id, handoff);
    console.log(`Stored handoff: ${id}`);
  }

  retrieve(id: string): Handoff | undefined {
    const handoff = this.handoffs.get(id);
    console.log(`Retrieved handoff: ${id}`);
    return handoff;
  }

  list(): string[] {
    return Array.from(this.handoffs.keys());
  }

  clear(): void {
    this.handoffs.clear();
  }
}

// Usage
const manager = new HandoffManager();
manager.store('debugger-to-qa', handoff);
const retrieved = manager.retrieve('debugger-to-qa');
```

## Error Handling

### Incomplete Handoff

If a handoff is incomplete, the receiving agent should:

1. **Identify missing elements** - What's missing from template
2. **Request clarification** - Ask source agent for missing info
3. **Don't proceed** - Wait for complete handoff
4. **Document the issue** - Note what was missing for improvement

```typescript
function validateHandoff(handoff: Handoff): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!handoff.context) missing.push('context');
  if (!handoff.objective) missing.push('objective');
  if (Object.keys(handoff.artifacts).length === 0) missing.push('artifacts');
  if (!handoff.constraints) missing.push('constraints');
  if (handoff.successCriteria.length === 0) missing.push('successCriteria');

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Usage
const validation = validateHandoff(handoff);

if (!validation.valid) {
  throw new Error(
    `Incomplete handoff. Missing: ${validation.missing.join(', ')}`,
  );
}
```

### Ambiguous Handoff

If handoff is ambiguous:

1. **Clarify objectives** - Ask for specific deliverables
2. **Request metrics** - How to measure success
3. **Resolve conflicts** - If constraints contradict
4. **Document assumptions** - Make implicit assumptions explicit

## Best Practices

### ✅ Do

- Use the complete handoff template
- Include all relevant artifacts
- Define clear success criteria
- State constraints explicitly
- Document assumptions
- List open questions
- Verify handoff receipt
- Confirm understanding

### ❌ Don't

- Skip handoff documentation
- Provide incomplete artifacts
- Use vague success criteria
- Forget constraints
- Make assumptions implicit
- Proceed with unclear objectives
- Assume understanding without confirmation
- Lose context between agents

## Examples

### Example 1: Debugger to QA Engineer

```markdown
## Handoff from Debugger to QA Engineer

### Context

Analyzing failing E2E tests to identify root causes and specific fixes needed.

### Objective

Implement fixes for failing E2E tests identified in analysis.

### Artifacts

**Test Failures:**

1. `tests/specs/ai-generation.spec.ts:179` - "should handle navigation between
   dashboard and settings"
   - Root cause: Missing mock for `/settings` route
   - Fix: Add route handler in MSW setup

2. `tests/specs/mock-validation.spec.ts:27` - "AI mocks are configured"
   - Root cause: Mock routes registered but not matching actual requests
   - Fix: Update route patterns to match actual API calls

**Files to Modify:**

- `tests/helpers/unified-mock.ts` - Add missing route handlers
- `tests/specs/ai-generation.spec.ts` - Update test expectations

### Constraints

- Must pass lint (ESLint + TypeScript)
- Maintain MSW handler caching for performance
- Don't break existing tests

### Success Criteria

- [ ] Navigation test passes
- [ ] Mock validation test passes
- [ ] No other E2E tests fail
- [ ] Lint passes
- [ ] Build succeeds

### Next Steps

After fixes are implemented, run full E2E test suite to verify no regressions.
```

### Example 2: QA Engineer to Performance Engineer

```markdown
## Handoff from QA Engineer to Performance Engineer

### Context

All functionality is working, but we have a build warning about large bundle
sizes.

### Objective

Optimize bundle sizes to eliminate build warnings and improve load time.

### Artifacts

**Build Warning:**
```

(!) Some chunks are larger than 500 kB after minification. Consider:

- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking

```

**Large Chunks:**
- `vendor-misc-exUg0-bV.js`: 566.28 kB (over by 66.28 kB)

**Current Build Configuration:**
- Vite default chunking strategy
- No manual chunk configuration
- No dynamic imports

### Constraints
- Must not break existing functionality
- Maintain code organization
- Must pass lint after changes
- Don't increase build time significantly

### Success Criteria
- [ ] All chunks under 500 kB
- [ ] No build warnings
- [ ] Build succeeds
- [ ] All tests still pass
- [ ] No regressions in functionality

### Next Steps
After optimization, run full test suite to verify everything still works.
```

## Performance Metrics

- **Handoff completion time**: < 30 seconds
- **Verification time**: < 1 minute
- **Information loss**: < 5% (minor details only)
- **Clarification requests**: < 10% of handoffs
- **Agent satisfaction**: > 90%

## Ensure smooth, complete information transfer between agents.
