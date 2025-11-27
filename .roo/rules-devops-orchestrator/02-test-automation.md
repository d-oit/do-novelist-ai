# Test Automation Rules

## Purpose
Automated testing pipeline for Novelist.ai quality gates.

## Rules
1. **Vitest Config**
   - pool: threads, coverage: v8
   - watch: false CI, true dev

2. **Playwright**
   - projects: chromium, firefox, webkit
   - reporter: html, json, junit

3. **CI Integration**
   - GitHub Actions/Vercel: matrix browsers
   - Parallel: 3 jobs

4. **Quality Gates**
   - Coverage <80%: fail
   - Flaky tests: auto-retry 2

## Validation
- npx playwright test --project=ci

## Exceptions
- Slow tests: tag @slow, separate job