# Optimization Targets

## Purpose
Performance KPIs and targets for Novelist.ai frontend.

## Rules
1. **Core Web Vitals**
   - LCP <2.5s, FID <100ms, CLS <0.1
   - Lighthouse 95+ mobile/desktop

2. **React Renders**
   - <10 re-renders/component on interaction
   - Bundle <1MB gzipped

3. **Gemini Calls**
   - <2s TTFT, cache hit 80%

4. **Chart Rendering**
   - Recharts: <200ms update 1000 data points

## Validation
- Lighthouse CI
- React DevTools Profiler

## Exceptions
- Initial load: progressive