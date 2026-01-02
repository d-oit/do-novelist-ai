# Security Hardening Research - January 2, 2026

**Date**: January 2, 2026 **Phase**: Phase 1 - Research & Design (Day 1)
**Status**: Research Complete **Priority**: P0 (BLOCKING)

---

## Executive Summary

Research findings on current AI implementation security vulnerabilities and
serverless architecture options for Phase 1.2: Security Hardening.

**🚨 CRITICAL FINDING**: OpenRouter API key (`VITE_OPENROUTER_API_KEY`) is
currently exposed in client builds, creating a security vulnerability.

---

## Current AI Implementation Analysis

### API Key Exposure (CRITICAL)

**Location**: `.env.example:18`

```bash
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Problem**:

- Environment variables prefixed with `VITE_` are embedded in the client bundle
  by Vite
- Anyone can inspect the production bundle and extract the API key
- No server-side protection or rate limiting
- Direct cost exposure (users can make unlimited API calls on your key)

**Files Affected**:

1. `src/lib/ai-config.ts:58` - API key loaded from
   `import.meta.env.VITE_OPENROUTER_API_KEY`
2. `src/lib/ai-core.ts:27-29` - OpenRouter SDK client created with exposed API
   key
3. `src/lib/ai-operations.ts` - All AI operations use exposed client

### Current Architecture

```
┌─────────────────────┐
│   Client Browser    │
│                     │
│  ┌──────────────┐   │
│  │ OpenRouter   │   │──────► Direct API calls with
│  │ SDK Client   │   │        EXPOSED API key
│  └──────────────┘   │
│                     │
│  VITE_OPENROUTER   │
│  _API_KEY exposed!  │
└─────────────────────┘
         │
         │ Direct HTTP
         ▼
┌─────────────────────┐
│   OpenRouter API    │
│  (External Service) │
└─────────────────────┘
```

### AI Operations Inventory

**Client-Side Operations** (All need migration):

| Operation                     | File               | Line    | Complexity | Uses API Key |
| ----------------------------- | ------------------ | ------- | ---------- | ------------ |
| `generateOutline`             | `ai-operations.ts` | 27-151  | High       | ✅           |
| `writeChapterContent`         | `ai-operations.ts` | 156-198 | High       | ✅           |
| `continueWriting`             | `ai-operations.ts` | 203-244 | High       | ✅           |
| `refineChapterContent`        | `ai-operations.ts` | 249-298 | High       | ✅           |
| `analyzeConsistency`          | `ai-operations.ts` | 303-344 | Medium     | ✅           |
| `brainstormProject`           | `ai-operations.ts` | 350-381 | Medium     | ⚠️ Partial   |
| `generateCoverImage`          | `ai-operations.ts` | 387-405 | Medium     | ✅           |
| `generateChapterIllustration` | `ai-operations.ts` | 411-431 | Medium     | ✅           |
| `translateContent`            | `ai-operations.ts` | 436-462 | Medium     | ✅           |
| `developCharacters`           | `ai-operations.ts` | 467-494 | Medium     | ✅           |
| `buildWorld`                  | `ai-operations.ts` | 499-526 | Medium     | ✅           |
| `enhancePlot`                 | `ai-operations.ts` | 531-558 | High       | ✅           |
| `polishDialogue`              | `ai-operations.ts` | 563-596 | Medium     | ✅           |

**Total**: 13 operations need serverless migration

**Note**: `brainstormProject` already calls `/api/ai/brainstorm` but the
endpoint doesn't exist yet.

### Existing API Infrastructure

**Client-Side API Client**: `src/lib/ai-api.ts`

- Already references `/api/ai/generate` and `/api/ai/brainstorm`
- Comment confirms: "Avoids CORS issues by routing through **Vercel serverless
  functions**"
- **Status**: Client code exists, but server endpoints **not implemented**

**Planned Endpoints** (Not Yet Implemented):

1. `/api/ai/generate` - Generic text generation
2. `/api/ai/brainstorm` - Brainstorming assistance

---

## Serverless Options Research

### Option 1: Vercel Functions ✅ RECOMMENDED

**Pros**:

- ✅ Already referenced in codebase (`ai-api.ts:4`)
- ✅ Zero-config deployment (drop files in `/api` folder)
- ✅ Automatic HTTPS and CDN
- ✅ Edge Functions available for low latency
- ✅ Built-in environment variable management
- ✅ Free tier: 100GB bandwidth, 100GB-hours compute
- ✅ Native TypeScript support
- ✅ Automatic route handling (`/api/hello.ts` → `/api/hello`)

**Cons**:

- Limited to 10s execution time (Hobby tier)
- Vendor lock-in to Vercel

**File Structure**:

```
/api
  /ai
    generate.ts        # POST /api/ai/generate
    brainstorm.ts      # POST /api/ai/brainstorm
    outline.ts         # POST /api/ai/outline
    ...
```

**Example Vercel Function** (`/api/ai/generate.ts`):

```typescript
import { OpenRouter } from '@openrouter/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY; // Server-side env var (no VITE_ prefix)

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { model, prompt, temperature } = req.body;

    const client = new OpenRouter({ apiKey });
    const response = await client.chat.send({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature ?? 0.7,
    });

    const text = response.choices[0]?.message.content || '';
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**Deployment**:

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variable
vercel env add OPENROUTER_API_KEY
```

---

### Option 2: Cloudflare Workers ⚠️ NOT RECOMMENDED

**Pros**:

- Edge computing (extremely low latency)
- More generous free tier (100K requests/day)
- No cold starts
- Better for global applications

**Cons**:

- ❌ More complex setup (wrangler.toml, separate build)
- ❌ Different runtime (Service Workers API, not Node.js)
- ❌ Requires code changes (no Node.js APIs like `fs`, `path`)
- ❌ Separate deployment from Vite app
- ❌ No clear reference in existing codebase
- ❌ Learning curve for Workers API

**Why Not Recommended**:

1. Security hardening is **P0 (urgent)** - needs 3-5 days max
2. Vercel Functions already referenced in codebase
3. Simpler deployment model (drop files in `/api`)
4. Team likely already familiar with Vercel (Vite common practice)

---

## Recommendation: Vercel Functions

**Decision**: Use **Vercel Functions** for serverless AI gateway

**Rationale**:

1. **Already planned**: Code references "Vercel serverless functions"
   (`ai-api.ts:4`)
2. **Fastest to implement**: Zero-config, drop files in `/api` folder
3. **Urgent timeline**: P0 security issue, need solution in 3-5 days
4. **TypeScript native**: No build configuration needed
5. **Environment variables**: Built-in secrets management
6. **Deployment**: Single `vercel` command

**Timeline**:

- Day 1 (Today): Research ✅ Complete
- Day 2: Design serverless architecture and create first endpoint
- Day 3: Migrate all 13 AI operations
- Day 4: Add rate limiting and cost tracking
- Day 5: Testing, validation, and deployment

---

## Security Architecture (Target State)

### After Migration

```
┌─────────────────────┐
│   Client Browser    │
│                     │
│  ┌──────────────┐   │
│  │   Fetch API  │   │──────► POST /api/ai/*
│  │   (no keys)  │   │        (no API keys!)
│  └──────────────┘   │
│                     │
│  NO API keys        │
│  in client!         │
└─────────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────┐
│   Vercel Functions          │
│   (Server-Side)             │
│                             │
│  ┌──────────────────────┐   │
│  │ Rate Limiting        │   │
│  │ Cost Tracking        │   │
│  │ OpenRouter Client    │   │
│  │ (OPENROUTER_API_KEY) │   │  ← Server env var
│  └──────────────────────┘   │    (SECURE!)
└─────────────────────────────┘
         │
         │ HTTP
         ▼
┌─────────────────────┐
│   OpenRouter API    │
│  (External Service) │
└─────────────────────┘
```

### Security Improvements

**Before** (Current):

- ❌ API key in client bundle
- ❌ Anyone can extract and use key
- ❌ Unlimited cost exposure
- ❌ No rate limiting
- ❌ No usage tracking per user

**After** (Serverless):

- ✅ API key only on server
- ✅ Client cannot access key
- ✅ Rate limiting per user/IP
- ✅ Cost tracking and alerts
- ✅ Usage analytics
- ✅ Request validation
- ✅ Error handling

---

## Next Steps (Day 2)

### Tomorrow's Goals

1. **Design Serverless Architecture**
   - Create `/api` folder structure
   - Design endpoint interfaces
   - Plan rate limiting strategy
   - Design cost tracking approach

2. **Create First Endpoint**
   - Implement `/api/ai/generate` (generic endpoint)
   - Add rate limiting middleware
   - Add error handling
   - Write tests

3. **Update Environment Variables**
   - Remove `VITE_OPENROUTER_API_KEY` from `.env.example`
   - Add `OPENROUTER_API_KEY` (server-side, no VITE\_ prefix)
   - Update documentation

---

## Dependencies

- `@vercel/node` (for TypeScript types)
- `@openrouter/sdk` (already installed)
- Rate limiting library (TBD: `express-rate-limit` or custom)

---

## Success Criteria (End of Day 5)

- [ ] Zero API keys in client builds (verified with bundle analysis)
- [ ] All 13 AI operations routed through serverless functions
- [ ] Rate limiting active (10 requests/minute per user)
- [ ] Cost tracking dashboard functional
- [ ] All tests passing (80%+ coverage)
- [ ] Security audit passed (no exposed secrets)
- [ ] Production deployment successful

---

**Research Completed By**: GOAP Agent **Status**: ✅ COMPLETE - Ready for Day 2
(Architecture Design) **Next Task**: Design serverless API architecture
**Priority**: P0 (BLOCKING PRODUCTION)

---

## Appendix: Bundle Analysis Command

To verify API keys are removed from client build:

```bash
# Build production bundle
npm run build

# Analyze bundle for secrets
grep -r "VITE_OPENROUTER_API_KEY" dist/
# Should return ZERO results after migration

# Check for any exposed keys
grep -r "sk-or-" dist/  # OpenRouter keys start with sk-or-
# Should return ZERO results
```
