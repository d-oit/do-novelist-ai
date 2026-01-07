# AI Plot Engine - Troubleshooting Runbook

**Version**: 1.0.0 **Status**: Production Ready **Date**: January 7, 2026

---

## 🎯 Overview

This runbook provides step-by-step troubleshooting procedures for common Plot
Engine issues. Follow the diagnostic steps, apply fixes, and verify resolution.

**Quick Reference**:

- 🔴 **Critical (P0)**: Service down, data loss, security issue
- 🟠 **High (P1)**: Major feature broken, incorrect results
- 🟡 **Medium (P2)**: Minor feature issue, degraded UX
- 🟢 **Low (P3)**: Cosmetic issue, enhancement

---

## 📋 Table of Contents

1. [Analysis Issues](#1-analysis-issues)
2. [Database Issues](#2-database-issues)
3. [API Integration Issues](#3-api-integration-issues)
4. [Performance Issues](#4-performance-issues)
5. [UI/Component Issues](#5-uicomponent-issues)
6. [Feedback System Issues](#6-feedback-system-issues)
7. [Deployment Issues](#7-deployment-issues)
8. [Data Quality Issues](#8-data-quality-issues)

---

## 1. Analysis Issues

### Issue 1.1: Plot Analysis Fails to Start

**Severity**: 🟠 P1

**Symptoms**:

- "Analyze Plot" button does nothing
- No loading state shown
- No error message displayed

**Diagnostic Steps**:

```bash
# 1. Check browser console for errors
# Open DevTools → Console tab
# Look for JavaScript errors

# 2. Check if PlotAnalyzer component loaded
# In Console:
console.log(document.querySelector('[data-testid="analyze-button"]'));
# Should return button element

# 3. Check network tab for API calls
# DevTools → Network tab → Filter: Fetch/XHR
# Click "Analyze Plot" → Should see API request
```

**Root Causes**:

- React event handler not attached
- Button disabled state stuck
- Missing projectId prop
- JavaScript error preventing execution

**Fixes**:

**Fix A: Clear browser cache**

```bash
# In browser:
# 1. DevTools → Application → Clear Storage
# 2. Check "Unregister service workers"
# 3. Click "Clear site data"
# 4. Refresh page (Ctrl+F5)
```

**Fix B: Verify component props**

```typescript
// In PlotEngineDashboard.tsx
<PlotAnalyzer projectId={projectId} onAnalyze={handleAnalysisComplete} />

// Ensure projectId is defined:
console.log('projectId:', projectId); // Should be a valid string
```

**Fix C: Check for React errors**

```bash
# Look for error boundary activation
# In browser console, check for:
# "Error: [Component] crashed"

# If found, check logger service:
logger.error('PlotAnalyzer failed to mount', {
  component: 'PlotEngineDashboard',
  error,
});
```

**Verification**:

- [ ] Click "Analyze Plot" button
- [ ] Loading state appears
- [ ] Progress indicator shows
- [ ] Analysis completes or shows error

---

### Issue 1.2: Analysis Times Out or Never Completes

**Severity**: 🟠 P1

**Symptoms**:

- Analysis starts but never finishes
- Loading state stuck indefinitely
- No error message after 2+ minutes

**Diagnostic Steps**:

```bash
# 1. Check network requests
# DevTools → Network → Look for:
# - OpenRouter API call (should complete in <30s)
# - Status: Pending (still waiting) or Failed

# 2. Check browser console for timeout errors
# Look for: "Analysis timeout" or "Request timeout"

# 3. Check OpenRouter API status
curl https://openrouter.ai/api/v1/auth/key
# Should return 200 OK

# 4. Check project size
# In database or UI: Count chapters, total word count
# Large projects (50+ chapters, 200k+ words) may timeout
```

**Root Causes**:

- OpenRouter API slow response (>30s)
- Network connectivity issues
- Very large project content (timeout threshold exceeded)
- Rate limiting on OpenRouter API
- API key expired or invalid

**Fixes**:

**Fix A: Retry analysis**

```typescript
// User action: Click "Analyze Plot" again
// System should retry with fresh request
```

**Fix B: Check OpenRouter API key**

```bash
# Verify environment variable set:
echo $VITE_OPENROUTER_API_KEY

# Test API key:
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $VITE_OPENROUTER_API_KEY"

# Should return: { "data": { "label": "...", ... } }
```

**Fix C: Reduce project size**

```typescript
// In PlotAnalyzer.tsx, limit content sent to API:
const chapters = await getChapters(projectId);
const limitedChapters = chapters.slice(0, 20); // First 20 chapters only

// Or limit word count:
const truncatedChapters = chapters.map(ch => ({
  ...ch,
  content: ch.content.slice(0, 5000), // Max 5000 chars per chapter
}));
```

**Fix D: Increase timeout threshold**

```typescript
// In PlotAnalyzer.tsx
const ANALYSIS_TIMEOUT = 60000; // Increase from 30s to 60s

const timeoutId = setTimeout(() => {
  logger.warn('Analysis timeout', { component: 'PlotAnalyzer', projectId });
  // Show timeout error
}, ANALYSIS_TIMEOUT);
```

**Verification**:

- [ ] Analysis completes within timeout period
- [ ] Results displayed correctly
- [ ] No timeout error shown

---

### Issue 1.3: Analysis Returns Incorrect Results

**Severity**: 🟠 P1

**Symptoms**:

- Plot holes detected are false positives
- Character relationships incorrect
- Story structure detection wrong (e.g., shows 3-act but should be 5-act)
- Quality score seems inaccurate

**Diagnostic Steps**:

```bash
# 1. Review analysis input
# Check what content was sent to AI:
logger.info('Analysis input', {
  component: 'PlotAnalyzer',
  chapterCount: chapters.length,
  totalWords: chapters.reduce((sum, ch) => sum + ch.content.split(' ').length, 0),
});

# 2. Review AI model response
# Check raw API response in Network tab:
# DevTools → Network → Select API call → Response tab

# 3. Check for data quality issues
# - Empty chapters
# - Missing character names
# - Incomplete scenes
```

**Root Causes**:

- Poor quality input content (incomplete, unclear)
- AI model hallucination or misinterpretation
- Prompt engineering issues
- Data processing errors (incorrect parsing)

**Fixes**:

**Fix A: Improve content quality**

```markdown
Ensure project content includes:

- ✅ Clear character names (avoid pronouns only)
- ✅ Complete scenes (not fragments)
- ✅ Consistent narrative voice
- ✅ Proper chapter boundaries
```

**Fix B: Adjust AI prompts**

```typescript
// In plotAnalysisService.ts or similar
const prompt = `
Analyze this story carefully and accurately:
- Identify ONLY real plot holes (logical inconsistencies, timeline errors)
- Do NOT flag intentional mysteries or unresolved subplots
- Detect character relationships based on explicit interactions
- Classify story structure based on actual plot points present

${content}
`;
```

**Fix C: Add validation logic**

```typescript
// Validate plot hole detection results
const validatePlotHoles = (plotHoles: PlotHole[]): PlotHole[] => {
  return plotHoles.filter(hole => {
    // Remove low-confidence detections
    if (
      hole.severity === 'low' &&
      !hole.description.includes('contradiction')
    ) {
      return false;
    }
    // Remove vague issues
    if (hole.description.length < 50) {
      return false;
    }
    return true;
  });
};
```

**Verification**:

- [ ] Plot holes are actual issues (not false positives)
- [ ] Character relationships match story content
- [ ] Story structure matches narrative arc
- [ ] Quality score aligns with expectations

---

## 2. Database Issues

### Issue 2.1: Cannot Connect to Turso Database

**Severity**: 🔴 P0

**Symptoms**:

- "Failed to connect to database" error
- Analysis data not saving
- Cannot load previous analyses

**Diagnostic Steps**:

```bash
# 1. Check environment variables
echo $VITE_TURSO_DATABASE_URL
echo $VITE_TURSO_AUTH_TOKEN

# Should output valid values, not undefined

# 2. Test database connection manually
turso db shell novelist-plot-engine

# Should open interactive SQL shell
# If fails, check Turso CLI auth:
turso auth login

# 3. Check database status
turso db show novelist-plot-engine

# Look for: Status: active

# 4. Check network connectivity
ping libsql://[your-database].turso.io
```

**Root Causes**:

- Missing or incorrect environment variables
- Expired auth token
- Database not created or deleted
- Network firewall blocking connection
- Turso service outage

**Fixes**:

**Fix A: Re-create auth token**

```bash
# Generate new token:
turso db tokens create novelist-plot-engine

# Copy token to clipboard

# Update Vercel environment variable:
vercel env add VITE_TURSO_AUTH_TOKEN
# Paste new token

# Redeploy:
vercel deploy --prod
```

**Fix B: Verify database exists**

```bash
# List databases:
turso db list

# If not found, create:
turso db create novelist-plot-engine

# Get URL and token:
turso db show novelist-plot-engine --url
turso db tokens create novelist-plot-engine

# Update Vercel environment variables
```

**Fix C: Check Turso service status**

```bash
# Check status page:
curl https://status.turso.tech/api/v2/status.json

# Or visit: https://status.turso.tech

# If degraded, wait for resolution or use fallback
```

**Fix D: Enable fallback to localStorage**

```typescript
// In database client initialization:
const client = useMemo(() => {
  try {
    return createClient({
      url: import.meta.env.VITE_TURSO_DATABASE_URL,
      authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
    });
  } catch (error) {
    logger.warn('Failed to connect to Turso, using localStorage', {
      component: 'PlotAnalyzer',
      error,
    });
    return null; // Use localStorage fallback
  }
}, []);
```

**Verification**:

- [ ] Database connection succeeds
- [ ] Can save analysis results
- [ ] Can load previous analyses
- [ ] No connection errors in logs

---

### Issue 2.2: Slow Database Queries (>1s)

**Severity**: 🟡 P2

**Symptoms**:

- Loading previous analysis takes >3s
- Dashboard slow to load
- Analysis save takes >2s

**Diagnostic Steps**:

```bash
# 1. Check embedded replica status
# In browser console:
logger.info('Database query timing', {
  component: 'PlotAnalyzer',
  queryType: 'SELECT',
  duration: performanceEnd - performanceStart,
});

# 2. Check for missing indexes
turso db shell novelist-plot-engine
> .schema plot_analyses
# Look for CREATE INDEX statements

# 3. Check database size
turso db show novelist-plot-engine
# Look for: Size: XXX MB

# 4. Profile queries
# Add logging before/after queries:
const start = Date.now();
const result = await client.execute('SELECT * FROM plot_analyses WHERE project_id = ?', [projectId]);
logger.info('Query completed', { duration: Date.now() - start });
```

**Root Causes**:

- Missing database indexes
- Large dataset without pagination
- Embedded replica not synced
- Network latency (fallback to primary database)
- Inefficient query patterns (N+1 queries)

**Fixes**:

**Fix A: Add database indexes**

```sql
-- Create index on frequently queried columns:
CREATE INDEX IF NOT EXISTS idx_plot_analyses_project_id
ON plot_analyses(project_id);

CREATE INDEX IF NOT EXISTS idx_plot_analyses_created_at
ON plot_analyses(created_at DESC);

-- Composite index for common queries:
CREATE INDEX IF NOT EXISTS idx_plot_analyses_project_created
ON plot_analyses(project_id, created_at DESC);
```

**Fix B: Implement pagination**

```typescript
// Instead of loading all analyses:
const getAllAnalyses = async (projectId: string) => {
  return client.execute(
    'SELECT * FROM plot_analyses WHERE project_id = ? ORDER BY created_at DESC',
    [projectId],
  );
};

// Use pagination:
const getRecentAnalyses = async (projectId: string, limit = 10) => {
  return client.execute(
    'SELECT * FROM plot_analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT ?',
    [projectId, limit],
  );
};
```

**Fix C: Use embedded replica caching**

```typescript
// Configure embedded replica with caching:
const client = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
  syncUrl: import.meta.env.VITE_TURSO_DATABASE_URL, // Enable embedded replica
  syncInterval: 60, // Sync every 60 seconds
});
```

**Verification**:

- [ ] Queries complete in <100ms (with replica)
- [ ] Dashboard loads in <1s
- [ ] No "slow query" warnings in logs

---

## 3. API Integration Issues

### Issue 3.1: OpenRouter API Returns 429 (Rate Limited)

**Severity**: 🟠 P1

**Symptoms**:

- Analysis fails with "Rate limit exceeded" error
- Multiple users affected simultaneously
- Error message: "Too many requests"

**Diagnostic Steps**:

```bash
# 1. Check API response in Network tab
# DevTools → Network → Select failed request → Response
# Look for: { "error": { "code": 429, "message": "Rate limit exceeded" } }

# 2. Check OpenRouter dashboard for limits
# Visit: https://openrouter.ai/dashboard
# Check: Current usage, daily/monthly limits

# 3. Check logger for frequency of API calls
# Count API calls in last hour:
grep "OpenRouter API called" logs.txt | wc -l
```

**Root Causes**:

- Too many analysis requests in short period
- Shared API key rate limit reached
- Burst usage from multiple users
- Missing rate limiting on frontend

**Fixes**:

**Fix A: Implement exponential backoff**

```typescript
const analyzeWithRetry = async (
  content: string,
  maxRetries = 3,
): Promise<AnalysisResult> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callOpenRouterAPI(content);
    } catch (error) {
      if (error.code === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        logger.warn('Rate limited, retrying', {
          component: 'PlotAnalyzer',
          attempt: i + 1,
          delay,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};
```

**Fix B: Add client-side rate limiting**

```typescript
// Limit to 1 analysis per user per minute:
const RATE_LIMIT_KEY = 'plot-engine-last-analysis';
const RATE_LIMIT_INTERVAL = 60000; // 1 minute

const handleAnalyze = async () => {
  const lastAnalysis = localStorage.getItem(RATE_LIMIT_KEY);
  if (
    lastAnalysis &&
    Date.now() - parseInt(lastAnalysis) < RATE_LIMIT_INTERVAL
  ) {
    const remaining = Math.ceil(
      (RATE_LIMIT_INTERVAL - (Date.now() - parseInt(lastAnalysis))) / 1000,
    );
    showError(`Please wait ${remaining} seconds before analyzing again`);
    return;
  }

  localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
  await runAnalysis();
};
```

**Fix C: Queue requests**

```typescript
// Implement request queue to avoid bursts:
class AnalysisQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async add(fn: () => Promise<void>) {
    this.queue.push(fn);
    if (!this.processing) {
      await this.process();
    }
  }

  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between requests
      }
    }
    this.processing = false;
  }
}
```

**Verification**:

- [ ] Rate limit errors resolved
- [ ] Retries succeed after delay
- [ ] Users see helpful "please wait" message
- [ ] API usage stays within limits

---

### Issue 3.2: OpenRouter API Returns 401 (Unauthorized)

**Severity**: 🔴 P0

**Symptoms**:

- All analyses fail immediately
- Error: "Invalid API key" or "Unauthorized"
- Affects all users

**Diagnostic Steps**:

```bash
# 1. Verify API key in environment
echo $VITE_OPENROUTER_API_KEY
# Should start with "sk-or-v1-"

# 2. Test API key manually
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $VITE_OPENROUTER_API_KEY"

# Should return: { "data": { "label": "..." } }
# If error: { "error": { "code": 401, ... } }

# 3. Check Vercel environment variables
vercel env ls
# Look for VITE_OPENROUTER_API_KEY

# 4. Check OpenRouter dashboard
# Visit: https://openrouter.ai/keys
# Verify key is active and not revoked
```

**Root Causes**:

- API key expired or revoked
- API key not set in environment
- Typo in environment variable name
- API key exposed and rotated for security

**Fixes**:

**Fix A: Regenerate API key**

```bash
# 1. Go to OpenRouter dashboard: https://openrouter.ai/keys
# 2. Click "Create Key"
# 3. Copy new key

# 4. Update Vercel environment:
vercel env add VITE_OPENROUTER_API_KEY
# Paste new key
# Select: Production, Preview, Development

# 5. Redeploy:
vercel deploy --prod
```

**Fix B: Verify environment variable name**

```typescript
// Check exact spelling in code:
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

// Match with Vercel environment:
// vercel env ls → should show exact same name
```

**Verification**:

- [ ] API key test returns 200 OK
- [ ] Analysis completes successfully
- [ ] No 401 errors in logs
- [ ] All users can analyze plots

---

## 4. Performance Issues

### Issue 4.1: Plot Engine Dashboard Slow to Load (>5s)

**Severity**: 🟡 P2

**Symptoms**:

- Dashboard takes >5s to appear
- White screen during load
- Slow initial render

**Diagnostic Steps**:

```bash
# 1. Run Lighthouse audit
# DevTools → Lighthouse → Analyze page load

# 2. Check bundle size
npm run build -- --analyze

# Look for large chunks (>500KB)

# 3. Profile component render
# React DevTools → Profiler → Record interaction
# Look for slow components

# 4. Check network waterfall
# DevTools → Network → Reload page
# Look for blocking resources
```

**Root Causes**:

- Large JavaScript bundle (not code-split)
- Heavy components loading eagerly
- Missing lazy loading
- Large dependencies (Recharts, D3, etc.)
- No caching strategy

**Fixes**:

**Fix A: Verify lazy loading is working**

```typescript
// Check that components are lazy loaded:
const CharacterGraphView = lazy(() => import('./CharacterGraphView'));
const StoryArcVisualizer = lazy(() => import('./StoryArcVisualizer'));
const PlotHoleDetectorView = lazy(() => import('./PlotHoleDetectorView'));
const PlotGenerator = lazy(() => import('./PlotGenerator'));

// Wrap in Suspense:
<Suspense fallback={<LoadingSpinner />}>
  <CharacterGraphView characterGraph={analysisResult.characterGraph} />
</Suspense>
```

**Fix B: Split vendor chunks**

```typescript
// In vite.config.ts:
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
```

**Fix C: Add service worker caching**

```typescript
// In src/sw.ts (service worker):
const CACHE_NAME = 'plot-engine-v1';
const urlsToCache = ['/plot-engine', '/assets/plot-engine-bundle.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)),
  );
});
```

**Verification**:

- [ ] Dashboard loads in <3s
- [ ] Lighthouse Performance score >90
- [ ] Bundle size <500KB (initial)
- [ ] Lazy loading works (check Network tab)

---

### Issue 4.2: Character Graph Visualization Laggy/Frozen

**Severity**: 🟡 P2

**Symptoms**:

- Character graph takes >3s to render
- Browser freezes during render
- Nodes/edges don't display correctly

**Diagnostic Steps**:

```bash
# 1. Check number of nodes/edges
# In browser console:
console.log('Nodes:', characterGraph.nodes.length);
console.log('Edges:', characterGraph.edges.length);
# >50 nodes or >100 edges may cause performance issues

# 2. Profile rendering
# Chrome DevTools → Performance → Record → Switch to Characters tab
# Look for long tasks (>50ms)

# 3. Check for layout algorithm performance
# Look for force-directed layout calculations
```

**Root Causes**:

- Too many nodes/edges (>50 nodes)
- Complex layout algorithm (force-directed)
- Re-rendering on every state change
- No memoization or virtualization

**Fixes**:

**Fix A: Limit nodes displayed**

```typescript
// Show only main characters (top 20 by relationship count):
const getMainCharacters = (characterGraph: CharacterGraph): CharacterGraph => {
  const sortedNodes = characterGraph.nodes
    .sort((a, b) => b.relationshipCount - a.relationshipCount)
    .slice(0, 20);

  const nodeIds = new Set(sortedNodes.map(n => n.id));
  const filteredEdges = characterGraph.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target),
  );

  return { nodes: sortedNodes, edges: filteredEdges };
};
```

**Fix B: Optimize rendering with React.memo**

```typescript
// Memoize CharacterNode component:
const CharacterNode = React.memo(({ node, onClick }: NodeProps) => {
  return (
    <circle
      cx={node.x}
      cy={node.y}
      r={node.size}
      fill={node.color}
      onClick={() => onClick(node)}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if position or data changed
  return prevProps.node.id === nextProps.node.id &&
         prevProps.node.x === nextProps.node.x &&
         prevProps.node.y === nextProps.node.y;
});
```

**Fix C: Use simpler layout algorithm**

```typescript
// Instead of force-directed (expensive), use circular layout:
const circularLayout = (nodes: Node[]): Node[] => {
  const radius = 200;
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, i) => ({
    ...node,
    x: 300 + radius * Math.cos(i * angleStep),
    y: 300 + radius * Math.sin(i * angleStep),
  }));
};
```

**Verification**:

- [ ] Graph renders in <1s
- [ ] No browser freeze
- [ ] Smooth interactions (drag, click)
- [ ] Nodes/edges display correctly

---

## 5. UI/Component Issues

### Issue 5.1: Feedback Form Not Submitting

**Severity**: 🟡 P2

**Symptoms**:

- Click "Send Feedback" does nothing
- No success message appears
- Feedback not saved

**Diagnostic Steps**:

```bash
# 1. Check browser console for errors
# DevTools → Console → Look for errors on submit

# 2. Check localStorage
# Console:
JSON.parse(localStorage.getItem('plot-engine-feedback') || '[]')
# Should return array of feedback objects

# 3. Check form validation
# Ensure message is not empty

# 4. Check network tab (if using custom onSubmit)
# DevTools → Network → Should see POST request
```

**Root Causes**:

- Form validation preventing submit (empty message)
- localStorage quota exceeded
- JavaScript error in submit handler
- Custom onSubmit handler failing

**Fixes**:

**Fix A: Verify message is not empty**

```typescript
// In FeedbackCollector.tsx:
const handleSubmit = async (e: React.FormEvent): Promise<void> => {
  e.preventDefault();

  if (!message.trim()) {
    logger.warn('Empty feedback message', { component: 'FeedbackCollector' });
    return; // Don't submit empty feedback
  }

  // ... proceed with submission
};
```

**Fix B: Handle localStorage quota errors**

```typescript
// Wrap localStorage.setItem in try/catch:
try {
  const existingFeedback = localStorage.getItem('plot-engine-feedback');
  const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
  feedbackList.push(feedback);
  localStorage.setItem('plot-engine-feedback', JSON.stringify(feedbackList));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    logger.warn('LocalStorage quota exceeded, clearing old feedback', {
      component: 'FeedbackCollector',
    });
    // Keep only last 50 items:
    const limited = feedbackList.slice(-50);
    localStorage.setItem('plot-engine-feedback', JSON.stringify(limited));
    // Retry:
    localStorage.setItem(
      'plot-engine-feedback',
      JSON.stringify([...limited, feedback]),
    );
  } else {
    throw error;
  }
}
```

**Fix C: Add error handling to custom onSubmit**

```typescript
// In PlotEngineDashboard.tsx:
const handleFeedbackSubmit = async (feedback: FeedbackData): Promise<void> => {
  try {
    await api.submitFeedback(feedback);
    logger.info('Feedback submitted successfully', {
      component: 'PlotEngineDashboard',
    });
  } catch (error) {
    logger.error('Failed to submit feedback to API', {
      component: 'PlotEngineDashboard',
      error,
    });
    // Fallback to localStorage:
    const existingFeedback = localStorage.getItem('plot-engine-feedback');
    const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
    feedbackList.push(feedback);
    localStorage.setItem('plot-engine-feedback', JSON.stringify(feedbackList));
  }
};
```

**Verification**:

- [ ] Feedback submits successfully
- [ ] Success message appears
- [ ] Feedback stored in localStorage (or API)
- [ ] Form resets after submission

---

### Issue 5.2: Dark Mode Contrast Issues

**Severity**: 🟢 P3

**Symptoms**:

- Text hard to read in dark mode
- Buttons not visible
- Poor color contrast

**Diagnostic Steps**:

```bash
# 1. Check color contrast ratio
# Use Chrome DevTools accessibility panel:
# DevTools → Lighthouse → Accessibility → Review contrast issues

# 2. Test with system dark mode
# OS Settings → Enable dark mode
# Reload app and check visibility

# 3. Check Tailwind dark: classes
# Inspect element → Look for dark:bg-*, dark:text-* classes
```

**Root Causes**:

- Missing dark: prefixes on Tailwind classes
- Using bg-secondary with text-primary (poor contrast)
- Hard-coded colors (not using CSS variables)

**Fixes**:

**Fix A: Use proper Tailwind dark mode classes**

```typescript
// Before:
<Button className="bg-secondary text-primary">Click</Button>

// After:
<Button className="bg-secondary text-secondary-foreground">Click</Button>

// Or:
<Button variant="secondary">Click</Button> // Uses design system
```

**Fix B: Add dark mode variants**

```typescript
// Add dark: classes where needed:
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
  Content
</div>
```

**Fix C: Use CSS variables from design system**

```css
/* In Tailwind config or CSS: */
:root {
  --primary: 220 100% 50%;
  --primary-foreground: 0 0% 100%;
}

.dark {
  --primary: 220 100% 60%; /* Lighter in dark mode */
  --primary-foreground: 0 0% 10%; /* Darker text */
}
```

**Verification**:

- [ ] All text readable in dark mode
- [ ] Buttons have good contrast (4.5:1 ratio minimum)
- [ ] No hard-to-read elements
- [ ] Lighthouse accessibility score >90

---

## 6. Feedback System Issues

### Issue 6.1: Cannot Retrieve Stored Feedback

**Severity**: 🟡 P2

**Symptoms**:

- Submitted feedback not appearing in localStorage
- Cannot export feedback data
- Feedback lost after browser clear

**Diagnostic Steps**:

```bash
# 1. Check localStorage:
const feedback = localStorage.getItem('plot-engine-feedback');
console.log('Feedback:', JSON.parse(feedback || '[]'));

# 2. Check localStorage size:
const size = new Blob([feedback || '']).size;
console.log('Size:', size, 'bytes');

# 3. Check for browser privacy mode:
# Private/Incognito mode may prevent localStorage writes
```

**Root Causes**:

- Browser in private/incognito mode
- localStorage disabled by browser settings
- Storage quota exceeded
- Browser cleared data

**Fixes**:

**Fix A: Implement backend API for feedback**

```typescript
// Replace localStorage with API calls:
const submitFeedbackToAPI = async (feedback: FeedbackData): Promise<void> => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }
};

// In FeedbackCollector:
const handleSubmit = async (e: React.FormEvent): Promise<void> => {
  e.preventDefault();
  // ...
  try {
    await submitFeedbackToAPI(feedback);
    // Fallback to localStorage if API fails:
  } catch (error) {
    logger.warn('API failed, using localStorage', {
      component: 'FeedbackCollector',
      error,
    });
    localStorage.setItem(
      'plot-engine-feedback',
      JSON.stringify([...existing, feedback]),
    );
  }
};
```

**Fix B: Export feedback to file**

```typescript
// Add export button:
const exportFeedback = (): void => {
  const feedback = localStorage.getItem('plot-engine-feedback');
  const blob = new Blob([feedback || '[]'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plot-engine-feedback-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Verification**:

- [ ] Feedback persists across sessions
- [ ] Can export feedback data
- [ ] API integration working (if implemented)
- [ ] No data loss

---

## 7. Deployment Issues

### Issue 7.1: Deployment Fails (Build Errors)

**Severity**: 🔴 P0

**Symptoms**:

- Vercel deployment fails
- Build errors in deployment logs
- TypeScript or ESLint errors

**Diagnostic Steps**:

```bash
# 1. Check Vercel deployment logs
vercel logs [deployment-url]

# Look for:
# - TypeScript errors
# - ESLint errors
# - Build failures

# 2. Reproduce locally
npm run build

# Should show same errors

# 3. Check for missing environment variables
vercel env ls

# Ensure all required vars are set
```

**Root Causes**:

- TypeScript type errors
- ESLint violations
- Missing environment variables in Vercel
- Import errors or missing dependencies
- Build configuration issues

**Fixes**:

**Fix A: Fix TypeScript errors**

```bash
# Run type checking locally:
npm run lint:ci

# Fix all errors:
# - Add missing types
# - Fix type mismatches
# - Add type assertions where needed

# Verify:
npm run build
# Should succeed
```

**Fix B: Fix ESLint errors**

```bash
# Run ESLint:
npm run lint:fix

# Or manually fix violations

# Verify:
npm run lint:ci
# Should show 0 errors
```

**Fix C: Add missing environment variables**

```bash
# Add all required vars to Vercel:
vercel env add VITE_TURSO_DATABASE_URL
vercel env add VITE_TURSO_AUTH_TOKEN
vercel env add VITE_OPENROUTER_API_KEY

# Redeploy:
vercel deploy --prod
```

**Verification**:

- [ ] Local build succeeds: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Vercel deployment succeeds
- [ ] Production site loads correctly

---

### Issue 7.2: Deployment Succeeds but Features Don't Work

**Severity**: 🔴 P0

**Symptoms**:

- Deployment shows success
- Plot Engine loads but features fail
- API calls fail
- Database operations fail

**Diagnostic Steps**:

```bash
# 1. Check browser console on production
# Visit: https://novelist.ai/projects/[id]/plot-engine
# DevTools → Console → Look for errors

# 2. Check environment variables are set
# In browser console:
console.log('Turso URL:', import.meta.env.VITE_TURSO_DATABASE_URL);
console.log('API Key:', import.meta.env.VITE_OPENROUTER_API_KEY?.slice(0, 10) + '...');

# Should output valid values, not undefined

# 3. Check Vercel environment variables
vercel env ls --prod
# Ensure all vars are set for Production environment

# 4. Check build-time vs runtime vars
# Vite requires VITE_ prefix for client-side vars
```

**Root Causes**:

- Environment variables not set for Production environment
- Missing VITE\_ prefix on environment variables
- Variables set after deployment (need redeploy)
- Variables not exposed to client-side

**Fixes**:

**Fix A: Add environment variables to Production**

```bash
# List current vars:
vercel env ls

# Add missing vars to Production:
vercel env add VITE_TURSO_DATABASE_URL
# Select: Production ✓

vercel env add VITE_TURSO_AUTH_TOKEN
# Select: Production ✓

# Redeploy:
vercel deploy --prod
```

**Fix B: Verify VITE\_ prefix**

```bash
# Environment variables MUST start with VITE_ to be exposed to client:

# Correct:
VITE_TURSO_DATABASE_URL=...
VITE_OPENROUTER_API_KEY=...

# Incorrect (won't work):
TURSO_DATABASE_URL=...  # Missing VITE_ prefix
OPENROUTER_API_KEY=...   # Missing VITE_ prefix
```

**Fix C: Redeploy after env changes**

```bash
# Environment variables are injected at build time
# Must redeploy after changing env vars:
vercel deploy --prod
```

**Verification**:

- [ ] Environment variables accessible in browser console
- [ ] API calls succeed
- [ ] Database operations work
- [ ] All features functional

---

## 8. Data Quality Issues

### Issue 8.1: Plot Holes Showing Too Many False Positives

**Severity**: 🟡 P2

**Symptoms**:

- 20+ plot holes detected (unusually high)
- Many flagged issues are not actual problems
- False positives for intentional mysteries

**Diagnostic Steps**:

```bash
# 1. Review detected plot holes
# Check types of issues flagged:
const plotHoles = analysisResult.plotHoleAnalysis.plotHoles;
const types = plotHoles.map(ph => ph.type);
console.log('Types:', types);

# 2. Check severity distribution
const bySeverity = {
  critical: plotHoles.filter(ph => ph.severity === 'critical').length,
  high: plotHoles.filter(ph => ph.severity === 'high').length,
  medium: plotHoles.filter(ph => ph.severity === 'medium').length,
  low: plotHoles.filter(ph => ph.severity === 'low').length,
};
console.log('By severity:', bySeverity);

# 3. Review AI prompt for plot hole detection
# Check if prompt is too aggressive
```

**Root Causes**:

- AI prompt too aggressive (flags everything)
- No confidence threshold filtering
- Missing context about genre conventions
- Confusing intentional mysteries with plot holes

**Fixes**:

**Fix A: Improve AI prompt**

```typescript
// In plotHoleDetector service:
const prompt = `
Analyze this story for CRITICAL plot holes only:

A plot hole is a logical inconsistency or contradiction in the story, such as:
- Timeline contradictions (character in two places at once)
- Contradiction of established facts (character's eye color changes)
- Impossible events given story rules (magic used after it was destroyed)

DO NOT flag:
- Intentional mysteries (unanswered questions meant for later)
- Unresolved subplots (may be resolved later)
- Minor inconsistencies (small details that don't affect plot)
- Genre conventions (fantasy logic, sci-fi technology)

Only report plot holes with HIGH confidence (clear contradictions).

${content}
`;
```

**Fix B: Add confidence filtering**

```typescript
// Filter plot holes by confidence score:
const validatePlotHole = (plotHole: PlotHole): boolean => {
  // Require specific keywords for high-confidence issues:
  const highConfidenceKeywords = [
    'contradiction',
    'impossible',
    'inconsistent',
    'timeline error',
  ];

  const hasKeyword = highConfidenceKeywords.some(keyword =>
    plotHole.description.toLowerCase().includes(keyword),
  );

  // Require severity >= medium OR high confidence keyword
  return plotHole.severity !== 'low' || hasKeyword;
};

const filteredPlotHoles = plotHoles.filter(validatePlotHole);
```

**Fix C: Add user feedback mechanism**

```typescript
// Allow users to mark false positives:
interface PlotHoleWithFeedback extends PlotHole {
  userFeedback?: 'valid' | 'false_positive' | 'not_sure';
}

// In PlotHoleDetectorView:
const handleMarkAsFalsePositive = (plotHoleId: string) => {
  // Update plot hole with user feedback
  // Use this data to improve future detection
  logger.info('Plot hole marked as false positive', {
    component: 'PlotHoleDetectorView',
    plotHoleId,
  });
};
```

**Verification**:

- [ ] Fewer false positives (<20% of detections)
- [ ] Critical plot holes are real issues
- [ ] Intentional mysteries not flagged
- [ ] User can provide feedback

---

## 📞 Support Escalation

### When to Escalate

**Escalate to P0 (Critical)** if:

- Service is completely down
- Data loss or corruption
- Security vulnerability
- Affects all users

**Escalate to P1 (High)** if:

- Major feature broken
- Affects >25% of users
- Performance severely degraded
- Cannot resolve within 4 hours

### Escalation Contacts

**Technical Lead**: [Contact info] **DevOps Team**: [Contact info] **On-Call
Engineer**: [PagerDuty/phone]

### Escalation Procedure

1. Document issue (description, steps to reproduce, logs)
2. Attempt fixes from runbook (15-30 minutes)
3. If unresolved, escalate with:
   - Issue description
   - Steps already attempted
   - Relevant logs/screenshots
   - Impact assessment (users affected)
4. Monitor issue until resolution

---

## 🔗 Additional Resources

- **Deployment Guide**: `plans/PLOT-ENGINE-DEPLOYMENT-GUIDE.md`
- **Monitoring Guide**: `plans/PLOT-ENGINE-MONITORING-GUIDE.md`
- **Beta Testing Plan**: `plans/PLOT-ENGINE-BETA-TESTING-PLAN.md`
- **Vercel Docs**: https://vercel.com/docs
- **Turso Docs**: https://docs.turso.tech
- **OpenRouter API**: https://openrouter.ai/docs

---

**Last Updated**: January 7, 2026 **Next Review**: After beta testing feedback
**Status**: ✅ Ready for production support
