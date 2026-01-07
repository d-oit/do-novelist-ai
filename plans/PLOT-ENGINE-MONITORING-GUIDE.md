# AI Plot Engine - Monitoring & Observability Guide

**Version**: 1.0.0 **Status**: Production Ready **Date**: January 7, 2026

---

## 🎯 Overview

This guide covers monitoring, observability, and operational excellence for the
AI Plot Engine in production. It includes metrics to track, alerting strategies,
logging practices, and performance monitoring.

---

## 📊 Key Metrics to Monitor

### 1. User Engagement Metrics

**Page Views & Navigation**

- Plot Engine dashboard views
- Tab navigation patterns (Overview → Structure → Characters → Plot Holes →
  Generator)
- Average session duration
- Bounce rate from Plot Engine

**Feature Adoption**

- Analysis runs per day/week/month
- Plot generation requests
- Feedback submissions
- Feature usage by tab (which tabs are most used?)

**User Retention**

- Returning users to Plot Engine
- Days between analysis runs
- Active users (DAU/WAU/MAU)

**Where to Track**: Vercel Analytics (built-in)

---

### 2. Performance Metrics

**Core Web Vitals** (Target: 90+ score)

- **First Contentful Paint (FCP)**: <2s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3s
- **Cumulative Layout Shift (CLS)**: <0.1
- **First Input Delay (FID)**: <100ms

**Component Performance**

- PlotAnalyzer analysis time: <30s (target: <20s)
- CharacterGraphView render time: <1s
- StoryArcVisualizer chart render: <500ms
- PlotHoleDetectorView table render: <500ms
- PlotGenerator generation time: <20s (target: <15s)

**Database Performance**

- Turso query latency: <100ms (with embedded replica)
- Cache hit rate: >80%
- Connection errors: <0.1%

**API Performance**

- OpenRouter API response time: <10s (analysis), <5s (generation)
- API error rate: <1%
- Rate limit errors: 0%

**Where to Track**:

- Vercel Analytics (Web Vitals)
- Logger service (component timings)
- Browser DevTools Performance tab

---

### 3. Reliability Metrics

**Error Rates**

- JavaScript errors: <1% of sessions
- API failures: <1% of requests
- Database connection failures: <0.1%
- Analysis failures: <5% (some expected due to content issues)

**Success Rates**

- Plot analysis completion: >95%
- Plot generation completion: >90%
- Feedback submission success: >99%
- Data persistence success: >99%

**Availability**

- Plot Engine uptime: 99.9%+ (excludes planned maintenance)
- Turso database uptime: 99.9%+
- OpenRouter API uptime: 99%+ (external dependency)

**Where to Track**:

- Vercel deployment logs
- Logger service error logs
- Turso dashboard (database status)
- OpenRouter status page

---

### 4. Business Metrics

**Usage Patterns**

- Projects with Plot Engine enabled: % of total
- Average analyses per project
- Plot holes detected per analysis
- Characters identified per analysis
- Generated plots saved to projects

**Quality Metrics**

- User satisfaction rating: >4.0/5.0 stars (from feedback)
- Plot hole detection accuracy: >80% true positive rate
- Feature usefulness rating by type

**Feedback Metrics**

- Bug reports submitted
- Feature requests submitted
- Average rating from feedback
- Critical bugs (P0/P1) per week

**Where to Track**:

- LocalStorage (plot-engine-feedback)
- Future: Backend analytics system
- Feedback Collector component data

---

## 🔍 Logging Strategy

### Logger Service Usage

The Plot Engine uses the centralized logger service (`@/lib/logging/logger`) for
all logging. **Never use console.log/warn/error in production code.**

**Log Levels**:

- **error**: Critical failures requiring immediate attention
- **warn**: Non-critical issues that should be investigated
- **info**: Important operational events (analysis started, completed, etc.)
- **debug**: Detailed debugging information (development only)

### Component Logging Pattern

```typescript
import { logger } from '@/lib/logging/logger';

// Success case
logger.info('Plot analysis completed', {
  component: 'PlotAnalyzer',
  projectId,
  duration: Date.now() - startTime,
  plotHolesFound: result.plotHoleAnalysis.totalCount,
});

// Error case
logger.error('Plot analysis failed', {
  component: 'PlotAnalyzer',
  projectId,
  error,
  duration: Date.now() - startTime,
});

// Warning case
logger.warn('Analysis took longer than expected', {
  component: 'PlotAnalyzer',
  projectId,
  duration,
  threshold: 30000,
});
```

### Structured Logging Context

Always include:

- **component**: Component name (e.g., 'PlotAnalyzer', 'CharacterGraphView')
- **action**: What operation was being performed
- **error**: Error object (if applicable)
- **duration**: Time taken (for performance tracking)
- **metadata**: Relevant context (projectId, userId, etc.)

### Log Retention

**Development**:

- Browser console (session only)
- LocalStorage (last 100 logs)

**Production**:

- Vercel logs (30 days retention)
- Future: External log aggregation service (Datadog, Logtail, etc.)

---

## 🚨 Alerting Strategy

### Critical Alerts (P0) - Immediate Action Required

**Trigger**: Error rate >5% over 5 minutes

- **Response**: Page on-call engineer
- **Action**: Investigate errors, consider rollback
- **SLA**: Acknowledge within 15 minutes

**Trigger**: Plot Engine downtime (503 errors)

- **Response**: Page on-call engineer
- **Action**: Check Vercel deployment, database connectivity
- **SLA**: Restore service within 1 hour

**Trigger**: Database connection failures >10 in 5 minutes

- **Response**: Page on-call engineer
- **Action**: Check Turso status, verify credentials
- **SLA**: Restore within 30 minutes

### High Priority Alerts (P1) - Same Day Response

**Trigger**: Analysis success rate <90% over 1 hour

- **Response**: Notify development team
- **Action**: Investigate failed analyses, check API limits
- **SLA**: Investigate within 4 hours

**Trigger**: Performance degradation (TTI >5s) over 15 minutes

- **Response**: Notify development team
- **Action**: Check for slow queries, API latency
- **SLA**: Investigate within 8 hours

**Trigger**: Feedback submissions reporting critical bugs

- **Response**: Notify product team
- **Action**: Triage bug reports, create GitHub issues
- **SLA**: Triage within 24 hours

### Medium Priority Alerts (P2) - Next Business Day

**Trigger**: Feature usage drop >20% week-over-week

- **Response**: Notify product team
- **Action**: Investigate UX issues, check for errors
- **SLA**: Review within 48 hours

**Trigger**: User satisfaction <3.5/5.0 average

- **Response**: Notify product team
- **Action**: Review feedback, identify pain points
- **SLA**: Review within 72 hours

### Alert Channels

**Critical (P0)**: PagerDuty / phone call **High (P1)**: Slack
#plot-engine-alerts + email **Medium (P2)**: Email daily digest

---

## 📈 Vercel Analytics Setup

### Accessing Analytics

1. Go to Vercel Dashboard → Project → Analytics
2. Select time range (Last 7 days, 30 days, etc.)
3. Review key metrics

### Key Dashboards

**Audience Dashboard**:

- Total visitors
- Page views
- Top pages (/projects/\*/plot-engine)
- Devices (Desktop, Mobile, Tablet)
- Geography

**Web Vitals Dashboard**:

- Core Web Vitals scores
- Performance over time
- Device breakdown
- Slowest pages

**Custom Events** (if configured):

```typescript
// Track custom events
import { track } from '@vercel/analytics';

track('plot_analysis_completed', {
  projectId,
  duration,
  plotHolesFound,
});

track('feedback_submitted', {
  type: feedbackType,
  rating,
});
```

### Setting Up Custom Events

1. Install Vercel Analytics:

```bash
npm install @vercel/analytics
```

2. Add to app root:

```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* Your app */}
      <Analytics />
    </>
  );
}
```

3. Track events in components:

```typescript
import { track } from '@vercel/analytics';

// In PlotAnalyzer after successful analysis
track('plot_analysis_completed', {
  projectId,
  duration: Date.now() - startTime,
  plotHolesFound: result.plotHoleAnalysis.totalCount,
  charactersFound: result.characterGraph.nodes.length,
});
```

---

## 🔧 Turso Database Monitoring

### Turso Dashboard

**Access**: https://turso.tech/app

**Key Metrics**:

- Database size (current usage)
- Rows read/written per day
- Query latency (p50, p95, p99)
- Active connections
- Replication lag (primary → replicas)

### Database Queries to Monitor

**Slow Queries** (>1s):

```sql
-- Check for slow queries in application logs
SELECT * FROM plot_analyses
WHERE created_at > datetime('now', '-1 day')
ORDER BY created_at DESC;
```

**Storage Growth**:

```sql
-- Monitor table sizes
SELECT
  'plot_analyses' as table_name,
  COUNT(*) as rows
FROM plot_analyses
UNION
SELECT
  'feedback' as table_name,
  COUNT(*) as rows
FROM feedback;
```

### Embedded Replica Performance

The Plot Engine uses Turso's embedded replica for low-latency reads. Monitor:

- Sync latency (replica vs primary)
- Cache hit rate
- Fallback to primary database (should be rare)

**How to Check**:

```typescript
// In PlotAnalyzer or other components using Turso
logger.info('Database query completed', {
  component: 'PlotAnalyzer',
  queryType: 'SELECT',
  duration,
  cacheHit: duration < 50, // Embedded replica typically <50ms
});
```

---

## 🐛 Error Tracking

### Error Categories

**1. User Errors** (Expected, informational)

- Invalid project content (empty chapters)
- Analysis timeout (very large projects)
- Rate limiting (too many requests)

**2. Application Errors** (Requires investigation)

- React component crashes
- State management issues
- Routing errors
- Type errors (should be caught by TypeScript)

**3. Integration Errors** (External dependencies)

- OpenRouter API failures
- Turso database connection issues
- Network errors

**4. Data Errors** (Data quality issues)

- Malformed JSON in database
- Missing required fields
- Type mismatches

### Error Context to Capture

Always log with context:

```typescript
logger.error('Error message', {
  component: 'ComponentName',
  error, // Full error object
  projectId,
  userId,
  action: 'what_was_being_done',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
});
```

### Error Response Checklist

When an error occurs:

1. ✅ Log error with full context via logger service
2. ✅ Show user-friendly error message in UI
3. ✅ Provide actionable next steps (e.g., "Try again" button)
4. ✅ Gracefully degrade (show partial results if possible)
5. ✅ Track error in metrics dashboard

---

## 📱 Real User Monitoring (RUM)

### Browser Performance API

Use Performance API to track real user experience:

```typescript
// Measure component render time
const startTime = performance.now();

// ... component rendering ...

const duration = performance.now() - startTime;
logger.info('Component rendered', {
  component: 'CharacterGraphView',
  duration,
  nodeCount: characterGraph.nodes.length,
});

// Track navigation timing
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  logger.info('Page load performance', {
    component: 'PlotEngineDashboard',
    loadTime: perfData.loadEventEnd - perfData.fetchStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
  });
});
```

### User Session Tracking

Track user journey through Plot Engine:

```typescript
// Session start
sessionStorage.setItem('plot-engine-session-start', Date.now().toString());

// Track tab switches
const trackTabSwitch = (fromTab: TabType, toTab: TabType) => {
  logger.info('User navigated', {
    component: 'PlotEngineDashboard',
    from: fromTab,
    to: toTab,
    sessionDuration:
      Date.now() -
      parseInt(sessionStorage.getItem('plot-engine-session-start') || '0'),
  });
};
```

---

## 🔬 Performance Profiling

### Development Profiling

**React DevTools Profiler**:

1. Install React DevTools extension
2. Open Profiler tab
3. Click "Record" → Interact with Plot Engine → Stop
4. Review component render times
5. Identify slow components

**Chrome DevTools Performance**:

1. Open DevTools → Performance tab
2. Click "Record" → Perform analysis → Stop
3. Review flame chart
4. Identify long tasks (>50ms)
5. Optimize slow operations

### Production Profiling

**Lighthouse CI**:

```bash
# Run Lighthouse on production URL
npm run lighthouse -- https://novelist.ai/projects/[id]/plot-engine

# Review results
# - Performance score
# - Accessibility score
# - Best practices score
# - SEO score
```

**Web Vitals Monitoring**:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  logger.info('Web Vital', {
    component: 'PlotEngineDashboard',
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 📝 Monitoring Checklist

### Daily Checks

- [ ] Review error logs (Vercel logs)
- [ ] Check error rate (<1% threshold)
- [ ] Review feedback submissions
- [ ] Check for critical bugs (P0/P1)
- [ ] Verify all services up (Vercel, Turso, OpenRouter)

### Weekly Checks

- [ ] Review performance metrics (Web Vitals)
- [ ] Analyze feature usage patterns
- [ ] Check database size and growth
- [ ] Review user satisfaction ratings
- [ ] Triage feedback and bug reports

### Monthly Checks

- [ ] Performance audit (Lighthouse)
- [ ] Review retention metrics
- [ ] Analyze feature adoption trends
- [ ] Update documentation based on learnings
- [ ] Plan optimizations and improvements

---

## 🎯 Success Criteria

Monitoring is successful when:

- ✅ Error rate <1% consistently
- ✅ Performance score >90 (Lighthouse)
- ✅ Analysis success rate >95%
- ✅ User satisfaction >4.0/5.0 stars
- ✅ All critical alerts respond within SLA
- ✅ Zero undetected outages
- ✅ Issues identified before users report them

---

## 🔗 Useful Resources

### Dashboards

- **Vercel Analytics**: https://vercel.com/[team]/novelist-ai/analytics
- **Turso Dashboard**: https://turso.tech/app
- **OpenRouter Status**: https://status.openrouter.ai

### Documentation

- **Vercel Analytics Docs**: https://vercel.com/docs/analytics
- **Turso Monitoring**: https://docs.turso.tech/monitoring
- **Web Vitals**: https://web.dev/vitals/

### Tools

- **React DevTools**: Chrome extension
- **Lighthouse**: Built into Chrome DevTools
- **Vercel CLI**: `vercel logs` for real-time logs

---

## 📞 Escalation Paths

### P0 (Critical) - Immediate Response

1. Check Vercel deployment status
2. Review error logs in Vercel dashboard
3. Check Turso database status
4. Verify OpenRouter API status
5. If needed: Rollback to previous deployment
6. Page on-call engineer if unresolved

### P1 (High) - Same Day

1. Review logger service logs
2. Identify error patterns
3. Create GitHub issue with context
4. Assign to development team
5. Monitor for escalation to P0

### P2 (Medium) - Next Business Day

1. Review feedback submissions
2. Analyze usage metrics
3. Create GitHub issue if needed
4. Add to product backlog

---

**Last Updated**: January 7, 2026 **Next Review**: After beta testing
**Status**: ✅ Ready for production monitoring
