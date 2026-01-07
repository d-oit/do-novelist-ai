# AI Plot Engine - Deployment Guide

**Target**: Vercel Deployment **Status**: Ready for Beta Deployment **Date**:
January 7, 2026

---

## ✅ Pre-Deployment Checklist

### Code Quality

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] All 250+ tests passing
- [x] Production build successful
- [x] No console.log statements
- [x] Proper error logging with logger service

### Features

- [x] Plot analysis with AI
- [x] Plot hole detection
- [x] Character relationship mapping
- [x] Story arc visualization
- [x] Plot generation
- [x] Turso database integration
- [x] Feedback collection system
- [x] Performance optimizations (lazy loading)
- [x] Accessibility (WCAG 2.1 AA)

### Documentation

- [x] README.md (567 lines)
- [x] QUICK-START.md (446 lines)
- [x] API documentation
- [x] Component documentation
- [x] Completion reports

---

## 🔑 Environment Variables

### Already Configured in Vercel

✅ `VITE_OPENROUTER_API_KEY` - AI provider key (already set)

### Required for Plot Engine

#### Turso Database (Required)

```bash
VITE_TURSO_DATABASE_URL=libsql://[your-database].turso.io
VITE_TURSO_AUTH_TOKEN=eyJhbGc...
```

**Setup Steps**:

1. Create Turso database: `turso db create novelist-plot-engine`
2. Get connection URL: `turso db show novelist-plot-engine --url`
3. Create auth token: `turso db tokens create novelist-plot-engine`
4. Add to Vercel environment variables

#### Optional Environment Variables

```bash
# AI Configuration (if not using OpenRouter)
VITE_ANTHROPIC_API_KEY=sk-ant-...  # For Claude models
VITE_OPENAI_API_KEY=sk-...         # For GPT models

# Feature Flags
VITE_ENABLE_PLOT_ENGINE=true       # Enable Plot Engine feature
VITE_PLOT_ENGINE_BETA=true         # Show beta badge

# Monitoring
VITE_ENABLE_ANALYTICS=true         # Enable analytics
```

---

## 🚀 Deployment Steps

### 1. Verify Local Build

```bash
# Clean build
npm run build

# Check for errors
npm run lint:ci

# Run tests
npm test

# Preview production build
npm run preview
```

### 2. Configure Vercel Environment

**Via Vercel Dashboard**:

1. Go to Project Settings → Environment Variables
2. Add Turso credentials:
   - `VITE_TURSO_DATABASE_URL`
   - `VITE_TURSO_AUTH_TOKEN`
3. Verify `VITE_OPENROUTER_API_KEY` is set ✅
4. Set environment: Production, Preview, Development (as needed)

**Via Vercel CLI**:

```bash
vercel env add VITE_TURSO_DATABASE_URL
vercel env add VITE_TURSO_AUTH_TOKEN
```

### 3. Deploy to Preview (Staging)

```bash
# Deploy to preview environment
vercel deploy

# Or via git push (automatic)
git push origin main
```

Vercel will automatically:

- Install dependencies
- Run build process
- Deploy to preview URL
- Run deployment checks

### 4. Test Preview Deployment

**Preview URL**: `https://novelist-ai-[hash].vercel.app`

**Test Checklist**:

- [ ] Plot Engine dashboard loads
- [ ] Can navigate between tabs
- [ ] "Analyze Plot" button works
- [ ] Analysis completes successfully
- [ ] Visualizations render correctly
- [ ] Character graph displays
- [ ] Plot hole detection runs
- [ ] Plot generator creates structures
- [ ] Feedback form submits
- [ ] Data persists (Turso)
- [ ] Performance is acceptable (<3s load)
- [ ] Mobile responsive
- [ ] Dark mode works

### 5. Promote to Production

**Via Vercel Dashboard**:

1. Go to Deployments
2. Find successful preview deployment
3. Click "Promote to Production"

**Via CLI**:

```bash
vercel --prod
```

---

## 📊 Post-Deployment Verification

### Health Checks

**1. Feature Availability**

```bash
# Check Plot Engine route
curl https://novelist.ai/projects/[id]/plot-engine

# Should return 200 OK
```

**2. Database Connection**

- Open Plot Engine dashboard
- Click "Analyze Plot"
- Verify no database connection errors
- Check data persists after refresh

**3. AI Integration**

- Run plot analysis
- Verify OpenRouter API is called
- Check analysis results are generated
- Confirm no API errors in logs

**4. Performance**

```bash
# Use Lighthouse or WebPageTest
npm run lighthouse -- https://novelist.ai
```

**Target Metrics**:

- First Contentful Paint: <2s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1
- Accessibility Score: >90

### Monitoring

**Vercel Analytics** (Built-in):

- Page views
- Performance metrics
- Error rates
- Geography data

**Access**:

1. Vercel Dashboard → Analytics
2. Select time range
3. Monitor key metrics

**Key Metrics to Watch**:

- Plot Engine page views
- Analysis completion rate
- Error rate (should be <1%)
- Average response time
- Feedback submissions

---

## 🐛 Common Issues & Solutions

### Issue 1: Turso Connection Fails

**Symptoms**: "Failed to connect to database" error

**Solutions**:

1. Verify environment variables are set correctly
2. Check Turso auth token hasn't expired
3. Confirm database URL format: `libsql://[name].turso.io`
4. Test connection locally with same credentials

```bash
# Test Turso connection
turso db shell [database-name]
```

### Issue 2: AI Analysis Fails

**Symptoms**: "Analysis failed" error, no results

**Solutions**:

1. Verify OpenRouter API key is valid
2. Check API quota/limits
3. Review error logs in Vercel dashboard
4. Test with smaller content (fewer chapters)

### Issue 3: Performance Issues

**Symptoms**: Slow loading, timeouts

**Solutions**:

1. Verify lazy loading is working (check Network tab)
2. Check Turso embedded replica is enabled
3. Ensure caching is configured
4. Review bundle size analysis

```bash
# Analyze bundle size
npm run build -- --analyze
```

### Issue 4: Feedback Not Saving

**Symptoms**: Feedback form submits but data not stored

**Solutions**:

1. Check localStorage quota (browser limit)
2. Verify logger service is working
3. Review browser console for errors
4. Test with custom onSubmit handler

---

## 🔄 Rollback Procedure

If issues occur in production:

### Quick Rollback (Vercel)

**Via Dashboard**:

1. Go to Deployments
2. Find last working deployment
3. Click "..." menu → "Promote to Production"

**Via CLI**:

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Emergency Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel auto-deploys
```

**Time to Rollback**: ~2-3 minutes

---

## 📈 Gradual Rollout (Optional)

### Feature Flag Strategy

**1. Add Feature Flag**

```typescript
// src/lib/featureFlags.ts
export const PLOT_ENGINE_ENABLED =
  import.meta.env.VITE_ENABLE_PLOT_ENGINE === 'true';

export const PLOT_ENGINE_BETA_USERS = [
  'user-id-1',
  'user-id-2',
  // Add beta tester IDs
];
```

**2. Conditional Rendering**

```typescript
// In navigation or route
{PLOT_ENGINE_ENABLED && (
  <Link to="/plot-engine">Plot Engine (Beta)</Link>
)}
```

**3. Gradual Rollout**

- **Phase 1**: 10% of users (beta testers)
- **Phase 2**: 50% of users (if no issues)
- **Phase 3**: 100% of users (full release)

### Monitor Each Phase

- Watch error rates
- Collect feedback
- Fix critical bugs before next phase

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Production build successful
- [ ] Environment variables configured in Vercel
- [ ] Turso database created and accessible
- [ ] Documentation reviewed and updated
- [ ] Team notified of deployment

### During Deployment

- [ ] Deploy to preview environment
- [ ] Run smoke tests on preview
- [ ] Verify all features work
- [ ] Check performance metrics
- [ ] Review deployment logs for errors
- [ ] Test on mobile devices

### Post-Deployment

- [ ] Verify production URL works
- [ ] Check Vercel Analytics dashboard
- [ ] Monitor error rates
- [ ] Test critical user flows
- [ ] Announce to users (if applicable)
- [ ] Monitor feedback submissions

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Plot Engine accessible at production URL
- ✅ All features working as expected
- ✅ Zero critical errors in logs
- ✅ Performance metrics meet targets
- ✅ Database connection stable
- ✅ AI analysis completing successfully
- ✅ Users can submit feedback
- ✅ Mobile experience acceptable

---

## 📞 Support Contacts

### Deployment Issues

- **Vercel Support**: https://vercel.com/support
- **Turso Discord**: https://discord.gg/turso
- **OpenRouter Status**: https://status.openrouter.ai

### Team Contacts

- **Technical Lead**: [Contact info]
- **DevOps**: [Contact info]
- **On-Call**: [Rotation schedule]

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/[team]/novelist-ai
- **Turso Dashboard**: https://turso.tech/app
- **OpenRouter Dashboard**: https://openrouter.ai/dashboard
- **GitHub Repository**: [Repo URL]
- **Production URL**: https://novelist.ai
- **Preview URL**: https://novelist-ai-git-main.vercel.app

---

## 📊 Deployment History

| Date        | Version     | Deploy ID | Status | Notes                       |
| ----------- | ----------- | --------- | ------ | --------------------------- |
| Jan 7, 2026 | v1.0.0-beta | [Pending] | Ready  | Initial Plot Engine release |

---

**Last Updated**: January 7, 2026 **Next Review**: After beta testing
**Status**: ✅ Ready for deployment
