# Quick Fix Deployment Guide - Security Hardening

**Date**: January 2, 2026 **Priority**: P0 (CRITICAL) **Time Required**: 15-30
minutes

---

## 🎯 Goal

Deploy 3 critical serverless endpoints to secure 70% of API traffic immediately.

---

## Step 1: Set Up Local Environment (5 minutes)

### Create `.env.local` File

Create a new file `.env.local` in the project root:

```bash
# Server-side (for /api functions) - REQUIRED
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here

# Client-side (existing config) - Keep your existing values
VITE_TURSO_DATABASE_URL=your_turso_database_url
VITE_TURSO_AUTH_TOKEN=your_turso_auth_token
VITE_DEFAULT_AI_PROVIDER=nvidia
VITE_DEFAULT_AI_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
VITE_THINKING_AI_MODEL=anthropic/claude-3-5-sonnet-20241022
VITE_ENABLE_AUTO_FALLBACK=true
VITE_ENABLE_AUTO_ROUTING=true
VITE_ENABLE_MODEL_VARIANTS=true
VITE_MONTHLY_AI_BUDGET=50

# Optional: PostHog Analytics
VITE_POSTHOG_API_KEY=your_posthog_key
VITE_POSTHOG_API_HOST=https://app.posthog.com
VITE_POSTHOG_ENABLED=true
```

**IMPORTANT**: Replace `sk-or-v1-your-actual-key-here` with your real OpenRouter
API key.

---

## Step 2: Test Locally (5-10 minutes)

### 2.1 Start Development Server

```bash
npm run dev
```

**Expected output**:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2.2 Test in Browser

1. **Open**: http://localhost:5173
2. **Create New Project**:
   - Click "New Project"
   - Enter any idea (e.g., "A space adventure")
   - Enter any style (e.g., "Science Fiction")
   - Click "Generate Outline"

**Expected**:

- ✅ Outline generates successfully
- ✅ No errors in browser console (F12)
- ✅ No "API configuration error"

3. **Test Chapter Writing**:
   - Click on a chapter from the outline
   - Click "Write Chapter"
   - Wait for content to generate

**Expected**:

- ✅ Chapter content appears
- ✅ No errors

4. **Test Continue Writing**:
   - In the chapter editor
   - Click "Continue Writing"

**Expected**:

- ✅ Continuation added
- ✅ No errors

### 2.3 Check Browser Console

Press **F12** to open Developer Tools, check Console tab:

**Expected**:

- ✅ No red errors
- ✅ May see info/debug logs (normal)

**If you see errors**: Check that `OPENROUTER_API_KEY` is set correctly in
`.env.local`

---

## Step 3: Deploy to Vercel (10-15 minutes)

### 3.1 Install Vercel CLI (if not installed)

```bash
npm i -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### 3.3 Link Project (First-Time Only)

If this is your first deployment:

```bash
vercel link
```

**Prompts**:

- "Set up and deploy?" → **Yes**
- "Which scope?" → Select your account
- "Link to existing project?" → **No** (or Yes if you already have one)
- "What's your project's name?" → **novelist-ai** (or your preferred name)
- "In which directory is your code located?" → **./** (press Enter)

### 3.4 Set Server-Side Environment Variable

```bash
vercel env add OPENROUTER_API_KEY production
```

**Prompts**:

- "What's the value of OPENROUTER_API_KEY?" → Paste your OpenRouter API key
  (sk-or-v1-...)
- Press Enter

**Verify**:

```bash
vercel env ls
```

You should see `OPENROUTER_API_KEY` listed for Production.

### 3.5 Deploy to Production

```bash
vercel --prod
```

**Expected output**:

```
Vercel CLI 28.x.x
🔍  Inspect: https://vercel.com/...
✅  Production: https://novelist-ai-xxx.vercel.app [2m]
```

**Note**: Deployment takes ~2-3 minutes. Copy the production URL.

---

## Step 4: Test Production Deployment (5 minutes)

### 4.1 Open Production URL

Visit your production URL (e.g., `https://novelist-ai-xxx.vercel.app`)

### 4.2 Test Critical Operations

Repeat the same tests from Step 2.2:

1. **Generate Outline**:
   - Create new project
   - Generate outline
   - **Expected**: ✅ Works

2. **Write Chapter**:
   - Click chapter
   - Write chapter
   - **Expected**: ✅ Works

3. **Continue Writing**:
   - In editor
   - Continue writing
   - **Expected**: ✅ Works

### 4.3 Check for Errors

Open browser console (F12):

- **Expected**: ✅ No errors

---

## Step 5: Security Verification (CRITICAL - 2 minutes)

### 5.1 Verify API Key NOT in Client Bundle

**On your local machine**, run:

```bash
# Build production bundle
npm run build

# Check for exposed API keys
grep -r "VITE_OPENROUTER_API_KEY" dist/
# Expected: NO RESULTS ✅

grep -r "sk-or-" dist/
# Expected: NO RESULTS ✅
```

**If either command returns results**: 🚨 **STOP! API key is still exposed. Do
NOT use production.**

### 5.2 Test Rate Limiting (Optional)

From your terminal:

```bash
# Make 65 rapid requests (should hit rate limit)
for i in {1..65}; do
  curl -X POST https://your-app.vercel.app/api/ai/outline \
    -H "Content-Type: application/json" \
    -d '{"idea":"test","style":"test"}' \
    -w "\n%{http_code}\n" 2>/dev/null | tail -1
done
```

**Expected**:

- First 60 requests: `200` (success)
- Requests 61-65: `429` (rate limited)

---

## Step 6: Monitor Production (Ongoing)

### 6.1 View Logs

```bash
# Real-time logs
vercel logs --follow

# Or visit Vercel dashboard
# https://vercel.com/your-username/novelist-ai/logs
```

### 6.2 Monitor for Errors

**Watch for**:

- 500 errors (server errors)
- 429 errors (rate limiting - normal, but track frequency)
- 400 errors (bad requests - investigate if frequent)

---

## ✅ Success Checklist

After deployment, verify:

- [x] Local development works
- [x] Production app loads
- [x] Outline generation works in production
- [x] Chapter writing works in production
- [x] Continue writing works in production
- [x] No API keys in client bundle (verified with `grep`)
- [x] No errors in browser console
- [x] Rate limiting works (optional test)

---

## 🐛 Troubleshooting

### Issue: "API configuration error"

**Symptom**: Error message when generating outline/chapter

**Cause**: `OPENROUTER_API_KEY` not set on server

**Fix**:

```bash
# Check environment variables
vercel env ls

# If missing, add it
vercel env add OPENROUTER_API_KEY production

# Redeploy
vercel --prod
```

---

### Issue: "CORS error"

**Symptom**: Browser console shows CORS error

**Cause**: Usually browser-related, endpoints already have CORS headers

**Fix**:

1. Check browser console for exact error
2. Verify endpoint includes CORS headers (already added in code)
3. Try hard refresh (Ctrl+Shift+R)

---

### Issue: "Rate limit exceeded" immediately

**Symptom**: 429 error on first request

**Cause**: Rate limit store issue or testing from same IP

**Fix**:

1. Wait 60 seconds
2. Try from different IP/browser
3. Rate limit is per-IP, so multiple tabs count as same IP

---

### Issue: Outline generates but doesn't parse

**Symptom**: Error parsing JSON response

**Cause**: AI returned non-JSON format

**Fix**: Already handled in code (extracts JSON with regex), but if persists:

1. Check Vercel logs for raw response
2. Model might need adjustment

---

### Issue: Deployment fails

**Symptom**: `vercel --prod` shows errors

**Fix**:

```bash
# Check build locally first
npm run build

# If build succeeds, try deployment again
vercel --prod

# Check Vercel dashboard for specific error
```

---

## 📊 What to Monitor Post-Deployment

### Week 1

- Error rates (should be <1%)
- Response times (should be <5s)
- Rate limiting hits (track if too restrictive)
- User feedback

### Ongoing

- OpenRouter API costs (check dashboard)
- Vercel usage (bandwidth, function invocations)
- Any reported bugs

---

## 🎯 Next Steps After Deployment

### Phase 2: Complete Migration (Optional, 1-2 days)

Once Quick Fix is stable, complete the full migration:

1. Create remaining 7 endpoints:
   - `/api/ai/refine.ts`
   - `/api/ai/consistency.ts`
   - `/api/ai/image.ts`
   - `/api/ai/translate.ts`
   - `/api/ai/characters.ts`
   - `/api/ai/world.ts`
   - `/api/ai/plot.ts`
   - `/api/ai/dialogue.ts`

2. Migrate remaining 7 operations

3. Remove `VITE_OPENROUTER_API_KEY` entirely

4. Comprehensive testing

**Timeline**: Ask me when ready to continue!

---

## 📞 Need Help?

If you encounter issues:

1. Check this troubleshooting guide first
2. Check Vercel logs: `vercel logs --follow`
3. Check browser console (F12)
4. Share error messages with me for debugging

---

**Deployment Guide Created**: January 2, 2026 **Estimated Time**: 15-30 minutes
**Status**: Ready for deployment **Risk**: LOW (isolated changes, backward
compatible)

---

Good luck with deployment! 🚀
