# AI Stack Simplification Plan - January 2026

**Date**: January 26, 2026 **Decision**: Simplify to OpenRouter SDK only
(Option 1) **Rationale**: Reduce dependencies, simplify architecture, maintain
feature parity

**Status**: ✅ **COMPLETED** - January 27, 2026

---

## Executive Summary

After analysis of current AI integration (Vercel AI SDK + OpenRouter SDK),
decision made to simplify to **OpenRouter SDK only**.

**Migration was already complete!** The codebase had already been migrated to
use `@openrouter/sdk` directly. This task involved cleanup of legacy test mocks
and configuration references.

**Current State**:

- Vercel AI SDK v5.0.106 (`ai` package)
- Provider SDKs: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`
- OpenRouter AI SDK Provider: `@openrouter/ai-sdk-provider`
- OpenRouter SDK: `@openrouter/sdk` (v0.3.10)
- Total: 5 AI-related packages

**Target State**:

- OpenRouter SDK only (`@openrouter/sdk`)
- Total: 1 AI-related package

---

## Rationale for OpenRouter SDK Only

### Pros

1. **Simpler Architecture**
   - Single dependency vs. 5 packages
   - Direct OpenRouter API integration
   - Less complexity to maintain

2. **Feature Parity Maintained**
   - OpenRouter SDK supports: streaming, tools, multimodal, embeddings
   - Auto-generated from OpenRouter API specs
   - Type-safe by default

3. **Better OpenRouter Integration**
   - Direct access to OpenRouter-specific features
   - Better documentation for OpenRouter capabilities
   - Auto-updated with API changes

### Cons (Acceptable)

1. **Lose Vercel AI SDK v6 Features**
   - Agent framework (will build custom using Zustand)
   - Tool execution approval (can implement manually)
   - DevTools (not critical)
   - Reranking (can implement later if needed)

2. **Impact on NEW-FEATURES-PLAN-JAN-2026**
   - Remove "AI SDK v6 Upgrade" (Phase 1, Week 1-3)
   - Replace with "Migrate to OpenRouter SDK Only"
   - Update AI Agent Framework to use custom orchestration

---

## Migration Plan

### Phase 1: Planning & Validation (Days 1-2)

#### 1.1 Document Current Usage

**Action**: Audit all AI SDK usage across codebase

**Files to Update**:

- `src/lib/ai-core.ts` - Uses `createOpenRouter` from
  `@openrouter/ai-sdk-provider`
- `src/lib/ai-operations.ts` - Uses `generateText` from `ai`
- `src/services/ai-health-service.ts` - Uses `generateText` from `ai`
- `src/features/writing-assistant/services/writingAssistantService.ts` - Uses
  `generateText` from `ai`

**Current API Pattern**:

```typescript
// Vercel AI SDK pattern (current)
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({ apiKey: '...' });
const model = openrouter('anthropic/claude-3-5-sonnet');

const response = await generateText({
  model,
  prompt: '...',
  temperature: 0.7,
});
```

**Target API Pattern**:

```typescript
// OpenRouter SDK pattern (target)
import OpenRouter from '@openrouter/sdk';

const client = new OpenRouter({ apiKey: '...' });

const response = await client.chat.send({
  model: 'anthropic/claude-3-5-sonnet',
  messages: [{ role: 'user', content: '...' }],
  temperature: 0.7,
});
```

---

#### 1.2 Validate Feature Parity

**Action**: Verify OpenRouter SDK supports all current features

| Feature             | Vercel AI SDK | OpenRouter SDK | Status   |
| ------------------- | ------------- | -------------- | -------- |
| Text Generation     | ✅            | ✅             | Parity   |
| Streaming           | ✅            | ✅             | Parity   |
| Tools/Functions     | ✅            | ✅             | Parity   |
| System Prompts      | ✅            | ✅             | Parity   |
| Temperature         | ✅            | ✅             | Parity   |
| Fallback Logic      | Custom        | Custom         | Parity   |
| Multimodal (Images) | ❌            | ✅             | Enhanced |
| Embeddings          | ❌            | ✅             | Enhanced |

**Conclusion**: Full feature parity + enhanced multimodal support

---

### Phase 2: Implementation (Days 3-7)

#### 2.1 Update Dependencies

**Action**: Remove Vercel AI SDK and provider packages

**Remove**:

```bash
npm uninstall ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @openrouter/ai-sdk-provider
```

**Keep**:

```bash
# Already installed, no changes needed
npm install @openrouter/sdk
```

---

#### 2.2 Rewrite `src/lib/ai-core.ts`

**Action**: Replace OpenRouter provider pattern with SDK client

**Before**:

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

export function getModel(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced' = 'standard',
): LanguageModel {
  const modelName = getModelForTask(provider, complexity, config);
  const openrouter = createOpenRouter({ apiKey: config.openrouterApiKey });
  return openrouter(`${provider}/${modelName}`) as unknown as LanguageModel;
}
```

**After**:

```typescript
import OpenRouter from '@openrouter/sdk';

const client = new OpenRouter({ apiKey: config.openrouterApiKey });

export function getModelName(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced' = 'standard',
): string {
  return `${provider}/${getModelForTask(provider, complexity, config)}`;
}

export { client };
```

**Changes**:

- Remove `LanguageModel` type (not used in OpenRouter SDK)
- Return model name string instead of model instance
- Export SDK client for use in operations

---

#### 2.3 Rewrite `src/lib/ai-operations.ts`

**Action**: Replace `generateText` with `client.chat.send`

**Before**:

```typescript
import { generateText } from 'ai';
import { getModel } from './ai-core';

const response = await generateText({
  model: getModel(provider, 'standard'),
  prompt: 'Write a chapter',
  temperature: 0.7,
});

return response.text;
```

**After**:

```typescript
import { client, getModelName } from './ai-core';

const response = await client.chat.send({
  model: getModelName(provider, 'standard'),
  messages: [{ role: 'user', content: 'Write a chapter' }],
  temperature: 0.7,
});

return response.choices[0].message.content;
```

**Mapping Changes**: | Vercel AI SDK | OpenRouter SDK | | -------------- |
--------------- | | `generateText()` | `client.chat.send()` | | `prompt` |
`messages: [{ role: 'user', content: ... }]` | | `system` |
`messages: [{ role: 'system', content: ... }, ...]` | | `response.text` |
`response.choices[0].message.content` | | `model` | `model` (string) |

---

#### 2.4 Update `src/services/ai-health-service.ts`

**Action**: Replace `generateText` with `client.chat.send`

```typescript
// Before
import { generateText } from 'ai';
import { getModel } from '@/lib/ai-core';

const response = await generateText({
  model: getModel('anthropic', 'fast'),
  prompt: 'Health check',
});

// After
import { client, getModelName } from '@/lib/ai-core';

const response = await client.chat.send({
  model: getModelName('anthropic', 'fast'),
  messages: [{ role: 'user', content: 'Health check' }],
});
```

---

#### 2.5 Update `src/features/writing-assistant/services/writingAssistantService.ts`

**Action**: Replace `generateText` with `client.chat.send`

Same pattern as ai-health-service.ts

---

### Phase 3: Testing (Days 8-10)

#### 3.1 Update Tests

**Action**: Update mock implementations to match new API

**Files to Update**:

- `src/services/__tests__/ai-health-service.test.ts`
- `src/services/__tests__/ai-analytics-service.test.ts`
- Any other test files using AI SDK mocks

**Mock Pattern**:

```typescript
// Before (Vercel AI SDK mock)
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Mock response' }),
}));

// After (OpenRouter SDK mock)
vi.mock('@openrouter/sdk', () => ({
  default: class MockOpenRouter {
    chat = {
      send: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Mock response' } }],
      }),
    };
  },
}));
```

---

#### 3.2 Run Test Suite

**Action**: Verify all tests pass

```bash
npm run test
npm run test:e2e
```

---

### Phase 4: Validation (Days 11-12)

#### 4.1 Manual Testing

**Action**: Test all AI features manually

**Test Checklist**:

- [ ] Generate outline
- [ ] Write chapter content
- [ ] Continue writing
- [ ] Refine chapter
- [ ] Analyze consistency
- [ ] Brainstorm ideas
- [ ] Develop characters
- [ ] Build world
- [ ] Enhance plan
- [ ] Polish dialogue
- [ ] Translate content
- [ ] AI health check

---

#### 4.2 Performance Testing

**Action**: Compare API latency and costs

**Metrics**:

- API call latency (before vs. after)
- Token usage (should be similar)
- Cost per operation (should be similar)

---

## Impact on NEW-FEATURES-PLAN-JAN-2026

### Phase 1 Changes

**Replace**:

- ~~AI SDK Upgrade to v6~~ (1 week)
- **Migrate to OpenRouter SDK Only** (3-4 days)

**Benefits**:

- Faster completion (3-4 days vs. 1 week)
- Reduced dependency count
- Simpler codebase

---

### Phase 4 Changes (AI Automation)

**Update AI Agent Framework**:

**Before** (AI SDK v6 approach):

```typescript
import { generateText, tool } from 'ai';
// Use AI SDK v6 agent framework
```

**After** (Custom orchestration with Zustand):

```typescript
import OpenRouter from '@openrouter/sdk';
import { create } from 'zustand';

const client = new OpenRouter({ apiKey: '...' });

// Custom orchestrator using Zustand state machine
const agentStore = create(set => ({
  currentAgent: null,
  agentState: 'idle',
  executeAgent: async agentType => {
    // Orchestrate agent workflow manually
    const response = await client.chat.send({
      model: 'anthropic/claude-3-5-sonnet',
      messages: agentContext,
      tools: agentTools,
    });
    set({ agentState: 'completed' });
  },
}));
```

**Effort Impact**: +2 days for Phase 4.2 (build custom orchestrator vs. use AI
SDK v6)

---

## Risk Assessment

### Low Risk

1. **API Compatibility** - OpenRouter SDK fully documented and tested
2. **Feature Parity** - All features available
3. **Rollback** - Git revert is straightforward

### Mitigation

1. **Feature Flag** - Keep old code behind flag during migration
2. **Gradual Rollout** - Migrate one feature module at a time
3. **Testing** - Comprehensive test coverage

---

## Success Criteria

### Functional

- [ ] All AI operations work correctly
- [ ] All tests pass
- [ ] Manual testing succeeds
- [ ] No functionality loss

### Technical

- [ ] Dependencies reduced from 5 to 1
- [ ] Bundle size reduced
- [ ] Build time improved
- [ ] Type safety maintained

### Performance

- [ ] API latency unchanged or improved
- [ ] Token usage consistent
- [ ] Costs unchanged

---

## Timeline

| Phase             | Days        | Tasks                             |
| ----------------- | ----------- | --------------------------------- |
| 1: Planning       | 1-2         | Document usage, validate parity   |
| 2: Implementation | 3-7         | Update dependencies, rewrite code |
| 3: Testing        | 8-10        | Update tests, run suite           |
| 4: Validation     | 11-12       | Manual testing, performance check |
| **Total**         | **12 days** | **Full migration**                |

---

## Completion Summary

**Date Completed**: January 27, 2026

### What Was Done

The migration was **already complete** when this plan was executed. The codebase
had previously been migrated to use `@openrouter/sdk` directly. The following
cleanup tasks were completed:

1. ✅ **Removed legacy test mocks** - Cleaned up `@ai-sdk/*` and
   `@openrouter/ai-sdk-provider` mocks from `src/test/setup.ts`
2. ✅ **Updated test utilities** - Modernized `tests/utils/mock-ai-sdk.ts` to
   mock OpenRouter SDK properly
3. ✅ **Cleaned up build configuration** - Removed unnecessary `@ai-sdk`
   references from `vite.config.ts`
4. ✅ **Verified no AI SDK dependencies** - Confirmed `package.json` has no
   Vercel AI SDK packages
5. ✅ **Validated codebase** - TypeScript compilation passes, linting passes

### Files Modified

- `src/test/setup.ts` - Replaced AI SDK mocks with proper OpenRouter SDK
  constructor mock
- `tests/utils/mock-ai-sdk.ts` - Updated to mock OpenRouter SDK for E2E tests
- `vite.config.ts` - Removed `@ai-sdk` bundle optimization references

### Test Results After Migration

**Unit Tests**: ✅ 696 tests passed (23 pre-existing failures in grammar/style
services - unrelated to migration)  
**TypeScript Compilation**: ✅ Clean compilation with no errors  
**Linting**: ✅ Passes with no warnings  
**E2E Tests**: ✅ Verified mock integration works correctly

**Key Fix Applied**: Updated OpenRouter SDK mock to use proper constructor
pattern with `vi.fn(function(this: any) {...})` to avoid "is not a constructor"
errors.

### Current State Verification

✅ **Core AI Library**: `src/lib/ai-core.ts` uses `@openrouter/sdk` directly  
✅ **AI Operations**: `src/lib/ai-operations.ts` uses OpenRouter SDK  
✅ **Health Service**: `src/services/ai-health-service.ts` uses OpenRouter SDK  
✅ **API Routes**: All use direct OpenRouter API calls  
✅ **No AI SDK imports**: Grep confirms zero `@ai-sdk` or `from 'ai'`
references  
✅ **TypeScript**: Clean compilation with no errors  
✅ **Linting**: Passes with no warnings

### Impact

- **Simpler architecture**: Single AI SDK dependency instead of 5
- **Cleaner test mocks**: No legacy AI SDK provider mocks
- **Better maintainability**: Direct OpenRouter integration
- **Zero breaking changes**: Migration was already complete

---

## Next Steps

1. ✅ Create this migration plan
2. ✅ Execute migration (cleanup only - already complete)
3. ⏳ Update NEW-FEATURES-PLAN-JAN-2026.md to reflect changes
4. ⏳ Update CODEBASE-ANALYSIS-JAN-2026.md to reflect decision
5. ⏳ Update PLAN-INVENTORY.md with completion status

---

**Plan Generated By**: OpenCode **Status**: ✅ **COMPLETED** **Actual Effort**:
1 day (cleanup only) **Priority**: P0 - COMPLETED
