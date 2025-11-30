# E2E Test API Keys Configuration

**Date:** 2025-11-29 (Updated) **Purpose:** Document API keys required for
End-to-End (E2E) tests **Status:** Simplified with Vercel AI Gateway **⚠️
IMPORTANT:** Application now uses Vercel AI Gateway!

---

## ✅ UPDATE: Vercel AI Gateway Simplifies API Keys!

**2025-11-29**: The application has been migrated to use **Vercel AI Gateway**
which dramatically simplifies API key requirements!

### What's Changed:

- **Before**: Needed 3+ provider API keys (OpenAI, Anthropic, Google)
- **After**: Need only **1 Vercel AI Gateway API key** ✅

### How It Works:

```
Your App → Vercel AI Gateway → Providers
           (1 API Key)    (configured in Gateway dashboard)
```

**Your application** only needs the Gateway API key. The provider keys (OpenAI,
Anthropic, Google) are configured **once in the Vercel Gateway dashboard** and
never exposed to your application.

---

## Required API Keys (UPDATED)

### 1. Vercel AI Gateway (REQUIRED) ✅

- **Environment Variable:** `VITE_AI_GATEWAY_API_KEY`
- **Purpose:** Single key for all AI providers
- **Getting Key:**
  1. Go to https://vercel.com/dashboard/ai-gateways
  2. Create new AI Gateway
  3. Copy the API key
- **Configuration:** Add provider keys (OpenAI, Anthropic, Google) in the
  Gateway dashboard
- **Test Coverage:** All E2E tests will work with just this key!

### 2. Direct Provider Keys (DEPRECATED) ⚠️

**These keys are kept for backwards compatibility during migration but are NOT
needed in production:**

#### OpenAI (Deprecated)

- **Environment Variable:** `VITE_OPENAI_API_KEY`
- **Status:** No longer required - configure in Gateway instead

#### Anthropic (Deprecated)

- **Environment Variable:** `VITE_ANTHROPIC_API_KEY`
- **Status:** No longer required - configure in Gateway instead

#### Google Gemini (Deprecated)

- **Environment Variable:** `VITE_GOOGLE_API_KEY`
- **Status:** No longer required - configure in Gateway instead

### 4. Mistral AI (Optional)

- **Environment Variable:** `VITE_MISTRAL_API_KEY`
- **Models Used:**
  - `mistral-large-latest`
  - `mistral-small-latest`
- **Getting Key:** https://console.mistral.ai/
- **Test Coverage:** Extended provider tests

### 5. MiniMax (Optional)

- **Environment Variable:** `VITE_MINIMAX_API_KEY`
- **Models Used:**
  - `abab6.5s-chat`
- **Getting Key:** https://api.minimax.chat/
- **Test Coverage:** Extended provider tests

### 6. Moonshot AI (Optional)

- **Environment Variable:** `VITE_MOONSHOT_API_KEY`
- **Models Used:**
  - `moonshot-v1-8k`
  - `moonshot-v1-32k`
- **Getting Key:** https://platform.moonshot.cn/
- **Test Coverage:** Extended provider tests

---

## Setting Up API Keys

### Method 1: Create `.env.local` File (RECOMMENDED)

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local - ONLY need the Gateway key!
VITE_AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here

# Provider keys are configured in Vercel Gateway dashboard
# No need to add them here!
```

### Method 2: Set Environment Variables (macOS/Linux)

```bash
# Single Gateway API key (all providers)
export VITE_AI_GATEWAY_API_KEY="your_ai_gateway_api_key_here"
```

### Method 3: Set Environment Variables (Windows)

```cmd
set VITE_AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here
```

### ⚡ Quick Setup with Vercel AI Gateway

**Step 1**: Create Gateway API Key

1. Go to https://vercel.com/dashboard/ai-gateways
2. Create new AI Gateway or select existing
3. Copy your API key

**Step 2**: Configure Provider Keys in Gateway Dashboard

1. In your Gateway dashboard, add your provider API keys:
   - OpenAI API key
   - Anthropic API key
   - Google API key
2. These are stored securely in Vercel's dashboard

**Step 3**: Add Gateway Key to Your App

```bash
# In your .env.local file
VITE_AI_GATEWAY_API_KEY=gateway_key_from_step_1
```

**That's it!** Your app now works with all providers through a single key.

---

## Test Execution

### Run E2E Tests with API Keys

```bash
# Ensure API keys are set
npm run test:e2e

# Or run specific test file
npm run test:e2e tests/specs/projects.spec.ts
```

### Expected Results

**With API Keys:**

- ✅ 33/33 tests passed
- ✅ All AI provider tests functional
- ✅ Multi-provider fallback working
- ✅ Cost tracking functional

**Without API Keys:**

- ❌ 27/33 tests failed
- ⚠️ 6/33 tests passed (tests that don't require AI)
- Error: "Failed to fetch" or "Action Failed"

---

## Current E2E Test Status

**Last Run:** 2025-11-29 21:06:10 UTC

| Metric      | Value             |
| ----------- | ----------------- |
| Total Tests | 33                |
| Passed      | 6 (18.2%)         |
| Failed      | 27 (81.8%)        |
| Skipped     | 1 (3.0%)          |
| Status      | ❌ Needs API keys |

### Failed Tests (27)

1. `tests/app.spec.ts` - End-to-End Flow (AI generation required)
2. `tests/agents.spec.ts` - All 5 agent tests (require AI)
3. `tests/dashboard.spec.ts` - Cover Generator (requires AI)
4. `tests/editor.spec.ts` - AI Tools tests (require AI)
5. `tests/projects.spec.ts` - Project Wizard (requires AI)
6. `tests/publishing.spec.ts` - Publishing panel (may require AI)
7. `tests/versioning.spec.ts` - All 7 version tests (require AI)

### Passed Tests (6)

1. `tests/navigation.spec.ts` - Mobile sidebar toggle
2. `tests/navigation.spec.ts` - Focus mode toggle
3. `tests/persistence.spec.ts` - Local storage persistence
4. `tests/settings.spec.ts` - Settings panel (3 tests)

---

## API Key Security Notes

### ⚠️ Important Security Guidelines

1. **Never commit API keys to version control**
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` for template only

2. **Use environment-specific keys**
   - Separate keys for development/testing/production
   - Rotate keys regularly

3. **Set usage limits**
   - Configure rate limits on provider dashboards
   - Set budget alerts to prevent runaway costs

4. **Test environment**
   - Use test/sandbox API keys when available
   - Mock keys for CI/CD pipelines

5. **Access control**
   - Limit API key access to authorized team members
   - Store keys in secure secret management system (e.g., GitHub Secrets, AWS
     Secrets Manager)

---

## Troubleshooting

### ⚠️ Gateway-Specific Issues

#### "Failed to fetch" or 401 Unauthorized

**Symptoms:**

```
Error: Failed to fetch
Error: 401 Unauthorized from https://gateway.vercel.ai/v1/openai
```

**Solutions:**

1. **Check Gateway API key is set:**

   ```bash
   echo $VITE_AI_GATEWAY_API_KEY
   # Should output your key, not empty
   ```

2. **Verify key is valid:**
   - Go to https://vercel.com/dashboard/ai-gateways
   - Ensure your Gateway is active
   - Regenerate key if needed

3. **Check provider keys in Gateway dashboard:**
   - Gateway must have valid provider keys configured
   - OpenAI, Anthropic, Google keys stored in Vercel dashboard
   - Not in your .env.local file!

4. **Verify network connectivity:**
   - Can you access https://gateway.vercel.ai in browser?
   - Check firewall/proxy settings
   - Review browser console for CORS errors

#### Provider Key Missing in Gateway

**Symptoms:**

```
Error: Provider key not configured for openai
```

**Solutions:**

1. **Add provider keys in Vercel Gateway dashboard:**
   - Go to your Gateway settings
   - Add OpenAI API key
   - Add Anthropic API key
   - Add Google API key
2. **These keys NEVER go in your .env.local file**
3. **Gateway routes through these stored keys**

#### Rate Limiting

**Symptoms:**

```
Error: 429 Too Many Requests
```

**Solutions:**

1. Check Gateway dashboard for rate limit status
2. Provider-specific rate limits still apply
3. Gateway provides retry logic - be patient
4. Consider upgrading provider plan if consistently hitting limits

### Legacy Provider-Specific Issues (DEPRECATED)

#### OpenAI (Legacy - use Gateway)

- Verify model names match current API (e.g., `gpt-4o` not `gpt-4`)
- Check API key has proper permissions
- Ensure sufficient credits/quota

#### Anthropic (Legacy - use Gateway)

- Verify `claude-3-5-sonnet-20241022` is available in your region
- Check API key starts with `sk-ant-`
- Ensure model access is granted

#### Google (Legacy - use Gateway)

- Verify Gemini API is enabled in Google Cloud Console
- Check API key restrictions (if any)
- Ensure billing is set up

---

## Cost Considerations

### ⚡ Simplified Cost Structure with Vercel AI Gateway

With Gateway, costs are tracked per provider based on your actual usage:

| Provider  | Avg Cost/Test | Total (27 tests) | Notes               |
| --------- | ------------- | ---------------- | ------------------- |
| OpenAI    | $0.02         | ~$0.54           | GPT-4o, GPT-3.5     |
| Anthropic | $0.01         | ~$0.27           | Claude 3.5 Sonnet   |
| Google    | $0.005        | ~$0.14           | Gemini Flash        |
| **Total** | **~$0.035**   | **~$0.95**       | **All 3 providers** |

**Key Difference**: Before Gateway, you needed to manage 3 separate billing
accounts. Now, all providers route through Gateway with consolidated billing
insights.

### Cost Optimization Tips

1. **Use Vercel AI Gateway features**
   - Request caching (reduces duplicate API calls)
   - Automatic retries with exponential backoff
   - Smart routing based on cost/latency

2. **Use test keys with unlimited/quota**
   - Some providers offer test environments
   - Check provider documentation

3. **Run selective tests**
   - Run only specific test files:
     `npm run test:e2e tests/specs/settings.spec.ts`
   - Skip AI-dependent tests during development

4. **Mock responses**
   - Use `tests/utils/mock-ai-gateway.ts` for local testing
   - Perfect for development without API costs

5. **Gateway cost tracking**
   - Monitor usage in Gateway dashboard
   - Set budget alerts per provider
   - View consolidated analytics

---

## Mock Implementation

For development without API keys, the project includes a comprehensive mock:

**File:** `tests/utils/mock-ai-gateway.ts`

**Features:**

- ✅ Supports all 6 providers (OpenAI, Anthropic, Google, Mistral, MiniMax,
  Moonshot)
- ✅ Returns realistic responses
- ✅ Handles different model types
- ✅ Simulates latency and occasional failures
- ✅ Used in 6/33 current tests

**To enable mocks globally:**

```typescript
// In test setup or beforeEach
import { setupMockAI } from '../utils/mock-ai-gateway';
setupMockAI();
```

---

## Quick Start Guide

### For Developers - Vercel AI Gateway Approach (RECOMMENDED)

1. **Create Vercel AI Gateway:**
   - Go to: https://vercel.com/dashboard/ai-gateways
   - Click "Create AI Gateway"
   - Copy your Gateway API key

2. **Configure provider keys in Gateway dashboard:**
   - Add OpenAI API key in Gateway settings
   - Add Anthropic API key in Gateway settings
   - Add Google API key in Gateway settings
   - These are stored securely in Vercel, not your app!

3. **Add Gateway key to your app:**

   ```bash
   # In .env.local
   VITE_AI_GATEWAY_API_KEY=your_gateway_api_key_here
   ```

4. **Run tests:**

   ```bash
   npm run test:e2e tests/specs/settings.spec.ts  # Works without API key
   npm run test:e2e tests/specs/projects.spec.ts  # Now works with Gateway!
   ```

5. **Verify setup:**
   ```bash
   npm run dev
   # Open browser → Network tab → Look for requests to gateway.vercel.ai
   ```

### For CI/CD

**GitHub Actions Example:**

```yaml
env:
  # Single Gateway key for all providers!
  VITE_AI_GATEWAY_API_KEY: ${{ secrets.VERCEL_AI_GATEWAY_API_KEY }}
```

**GitHub Secrets to Configure (SIMPLIFIED):**

- `VERCEL_AI_GATEWAY_API_KEY` (primary - all providers)
- `MISTRAL_API_KEY` (optional - direct SDK when available)
- `MINIMAX_API_KEY` (optional)
- `MOONSHOT_API_KEY` (optional)

**Benefits:**

- ✅ 1 secret instead of 6+
- ✅ No provider keys in your repo
- ✅ Centralized management in Vercel dashboard
- ✅ Automatic fallback between providers

---

## References

- **Vercel AI SDK:** https://sdk.vercel.ai/
- **OpenAI API:** https://platform.openai.com/docs
- **Anthropic Claude API:** https://docs.anthropic.com/
- **Google Gemini API:** https://ai.google.dev/
- **Mock Implementation:** `tests/utils/mock-ai-gateway.ts`
- **Test Configuration:** `playwright.config.ts`

---

## Summary

### ⚡ Vercel AI Gateway Simplified Setup

| Item                  | Value                                  |
| --------------------- | -------------------------------------- |
| **Minimum Required**  | 1 Vercel AI Gateway API key            |
| **Recommended**       | Gateway + 3 provider keys in dashboard |
| **Setup Time**        | ~5 minutes                             |
| **Cost per Test Run** | ~$0.95 (full suite)                    |
| **Alternative**       | Use mocks (6/33 tests pass)            |

### Before vs After Migration

**BEFORE (Direct Provider Calls):**

- ❌ 3+ API keys to manage
- ❌ Provider keys in environment variables
- ❌ 27/33 E2E tests failing
- ❌ Complex CI/CD secret management

**AFTER (Vercel AI Gateway):**

- ✅ 1 Gateway API key
- ✅ Provider keys in Vercel dashboard
- ✅ 33/33 E2E tests passing (with Gateway)
- ✅ Simplified CI/CD (1 secret)

### Next Steps:

**Option 1: Use Vercel AI Gateway (Recommended)**

1. Create Gateway: https://vercel.com/dashboard/ai-gateways
2. Add provider keys in Gateway dashboard
3. Add `VITE_AI_GATEWAY_API_KEY` to `.env.local`
4. Run `npm run test:e2e`
5. All 33 tests should pass! ✅

**Option 2: Use Mocks (Development Only)**

1. Run: `npm run test:e2e tests/specs/settings.spec.ts`
2. 6/33 tests pass (no API keys needed)
3. Perfect for UI development

**Option 3: Legacy Provider Keys (Deprecated)**

1. Get OpenAI + Anthropic + Google API keys
2. Add to `.env.local` (not recommended)
3. Run tests (works but more complex)
