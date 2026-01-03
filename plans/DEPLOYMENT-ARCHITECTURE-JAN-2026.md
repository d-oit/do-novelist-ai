# Deployment Architecture - January 3, 2026

**Date**: January 3, 2026 **Status**: Current **Purpose**: Clarify deployment
architecture and technology roles

---

## Executive Summary

Novelist.ai uses a modern, edge-first architecture with clear separation of
concerns between frontend hosting, API routing, and database storage.

**Key Insight**: Vercel and Turso serve different, complementary purposes:

- **Vercel** = Frontend hosting + Edge Functions (optional deployment platform)
- **Turso** = Edge database (data storage, independent of hosting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│                  (React Application)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             FRONTEND HOSTING (Vite Build Output)            │
│                                                              │
│  Vercel (Hobby)        Netlify        Cloudflare Pages     │
│  • Global CDN          • Global CDN    • Global CDN         │
│  • Edge Functions      • Functions     • Workers            │
│  • Preview deployments • Previews      • Previews           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              EDGE FUNCTIONS (Secure API Layer)               │
│                                                              │
│  /api/ai/generate     • Hide API keys                      │
│  /api/ai/outline      • Rate limiting (60 req/hour)        │
│  /api/ai/chapter      • Cost tracking                      │
│  ... (13 endpoints)   • CORS handling                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           EXTERNAL AI SERVICES (OpenRouter API)              │
│                                                              │
│  OpenRouter → Multiple AI providers:                        │
│  • Anthropic, OpenAI, Mistral, NVIDIA, etc.                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              TURSO EDGE DATABASE (Data Storage)              │
│                                                              │
│  SQLite-based, global edge distribution                      │
│  • User projects                                             │
│  • Writing sessions                                          │
│  • Analytics data                                             │
│  • Settings                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Roles

### 1. Frontend Hosting (Vercel or alternatives)

**Purpose**: Deploy and serve the built React application

**Options**:

- **Vercel** (recommended for DX):
  - Hobby plan: Free, sufficient for most use cases
  - 100 GB bandwidth/month
  - Unlimited projects
  - Auto-deployments from Git
  - Preview URLs for PRs

- **Alternatives**:
  - Netlify (similar features, free tier)
  - Cloudflare Pages (fastest global CDN)
  - GitHub Pages (static only, no functions)
  - Custom VPS (full control, manual setup)

**What gets deployed**:

- `dist/` folder from Vite build
- Static assets (JS, CSS, images)
- Service worker (PWA support)

---

### 2. Edge Functions (Secure API Layer)

**Purpose**: Secure proxy for AI API calls, rate limiting, cost tracking

**Why needed**:

- ✅ **Security**: Hide OpenRouter API key from client bundles
- ✅ **Rate Limiting**: Prevent abuse (60 req/hour auth, 10 req/hour anon)
- ✅ **Cost Control**: Track usage, enforce budget limits
- ✅ **CORS**: Eliminate cross-origin issues
- ✅ **Logging**: Structured logging for debugging

**Implementation**:

```typescript
// Edge Function example: /api/ai/generate.ts
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  // Server-side API key (not exposed to client)
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Rate limiting check
  // Cost tracking
  // Request forwarding to OpenRouter
}
```

**Deployment options**:

- **Vercel Edge Functions** (recommended)
- **Cloudflare Workers** (free tier available)
- **AWS Lambda + API Gateway** (enterprise)
- **Netlify Functions** (similar to Vercel)
- **Custom Node.js server** (full control)

---

### 3. Turso Database (Edge Data Storage)

**Purpose**: Edge-native database for application data

**Features**:

- SQLite-based (simple, familiar)
- Global edge distribution (low latency)
- Automatic replication
- Free tier: 500 rows, 8 GB storage
- Production: $4.99/month for extended features

**What's stored**:

- User projects
- Writing sessions
- Analytics data
- Settings and preferences

**Key point**: Turso is independent of frontend hosting. Use same Turso
credentials regardless of whether you deploy to Vercel, Netlify, or anywhere
else.

---

## Deployment Matrix

| Component        | Vercel Hobby | Netlify Free | Cloudflare Pages | Custom VPS |
| ---------------- | ------------ | ------------ | ---------------- | ---------- |
| Frontend hosting | ✅           | ✅           | ✅               | ✅         |
| Edge Functions   | ✅           | ✅           | ✅               | ✅         |
| Rate limiting    | In-memory    | In-memory    | In-memory        | Redis/KV   |
| Environment vars | ✅           | ✅           | ✅               | Manual     |
| Preview URLs     | ✅           | ✅           | ✅               | ❌         |
| Turso DB         | ✅\*         | ✅\*         | ✅\*             | ✅\*       |

**\*** Turso works with all platforms (it's a separate service)

---

## Recommended Setup

### For Development

```bash
# Local development with Vite
npm run dev

# API proxied through Vite middleware (vite.config.ts)
# Turso connects via local credentials
```

### For Production (Vercel - Recommended)

```bash
# 1. Build frontend
npm run build

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod

# 4. Set environment variables
vercel env add OPENROUTER_API_KEY production
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
```

### For Production (Alternative: Netlify)

```bash
# 1. Build frontend
npm run build

# 2. Deploy with Netlify CLI
npm i -g netlify-cli
netlify deploy --prod

# 3. Set environment variables in Netlify dashboard
```

---

## Migration Between Platforms

**Frontend**: Simply redeploy `dist/` folder to new platform

**Edge Functions**:

- Vercel → Cloudflare: Adapt function signature (Request/Response vs
  VercelRequest/VercelResponse)
- Vercel → Netlify: Mostly compatible, minor syntax changes
- Vercel → AWS: Major rewrite (use AWS SDK)

**Database (Turso)**: No migration needed! Use same credentials

---

## Cost Comparison

| Platform       | Frontend (monthly) | Functions (monthly) | Total |
| -------------- | ------------------ | ------------------- | ----- |
| Vercel Hobby   | $0                 | $0                  | $0    |
| Vercel Pro     | $20                | Included            | $20   |
| Netlify Free   | $0                 | $0                  | $0    |
| Cloudflare     | $0                 | $0 (Workers free)   | $0    |
| AWS (t3.micro) | ~$8.50             | Lambda varies       | ~$10+ |

**Turso**: $0 (free tier) or $4.99/month (production)

---

## Security Considerations

### API Key Protection

**Before** (insecure):

```typescript
// Client-side - exposed in bundle
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
```

**After** (secure):

```typescript
// Server-side Edge Function
const apiKey = process.env.OPENROUTER_API_KEY;
```

### Database Access

- Turso auth tokens stored server-side
- Never exposed to client
- Use Row-Level Security for multi-tenant apps

---

## Monitoring and Analytics

### Built-in Tools

**Vercel Analytics**:

- Page views, core web vitals
- Edge Function metrics
- Error tracking

**PostHog** (integrated):

- User behavior analytics
- Feature usage
- Writing session tracking

### Custom Logging

```typescript
// Edge Functions
logger.info('AI request', { endpoint: 'generate', userId });
logger.error('OpenRouter error', { error, metadata });
```

---

## Troubleshooting

### Issue: API key exposed in bundle

**Solution**: Ensure API key is in environment variable without `VITE_` prefix:

```bash
# ✅ Correct (server-side)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# ❌ Wrong (client-side, exposed)
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### Issue: Rate limiting not working

**Solution**: Check Edge Function deployment:

```bash
# Verify function is deployed
vercel ls

# Check function logs
vercel logs --follow
```

### Issue: Turso connection refused

**Solution**: Verify credentials in environment variables:

```bash
# Turso credentials (same for all platforms)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
```

---

## Decision Framework

### Choose Vercel if:

- ✅ Want fastest setup and best DX
- ✅ Need preview URLs for PRs
- ✅ Using Vite (native integration)
- ✅ Team already familiar with Vercel

### Choose Netlify if:

- ✅ Need form handling (built-in)
- ✅ Want similar features to Vercel
- ✅ Prefer Netlify's UI

### Choose Cloudflare if:

- ✅ Need fastest global CDN
- ✅ Want free Workers tier
- ✅ Existing Cloudflare setup

### Choose Custom VPS if:

- ✅ Need full control
- ✅ Have existing infrastructure
- ✅ Want to optimize costs at scale

---

## Summary

**Key Takeaways**:

1. **Vercel ≠ Database**: Vercel hosts frontend and Edge Functions, Turso is
   database
2. **Edge Functions ≠ Backend**: Edge Functions are lightweight API routing
   layer, not full backend
3. **Hosting is flexible**: Can use Vercel, Netlify, Cloudflare, or custom
   server
4. **Database is independent**: Turso works with any hosting platform
5. **Security requires Edge Functions**: Must use server-side code to protect
   API keys

**Recommendation**: Start with Vercel Hobby (free) for frontend + Edge
Functions. Migrate to alternatives if specific features or cost optimization
needed later.

---

**Document Version**: 1.0 **Last Updated**: January 3, 2026 **Next Review**:
March 2026
