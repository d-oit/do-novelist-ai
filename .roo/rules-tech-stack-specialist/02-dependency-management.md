# Dependency Management Rules

## Purpose
Guidelines for library selection, version pinning, and dependency hygiene in Novelist.ai.

## Rules
1. **Core Dependencies**
   - React 19.2+, TypeScript 5.8+, Vite 6+
   - Zustand 5+ for state, Zod 4+ validation
   - @google/genai latest stable, libsql/client for DB
   - No React Query/SWR: Zustand covers async

2. **Selection Criteria**
   - Bundle size <50kb gzipped preferred
   - TypeScript native, active maintenance (>1k stars)
   - Peer deps minimal, no CSS-in-JS (Tailwind only)
   - Example: recharts for charts (lightweight SVG)

3. **Version Policy**
   - package.json: ~ for majors, ^ for minors
   - No bleeding edge: wait 1 month post-release
   - Lockfile: commit package-lock.json always

4. **Dev Dependencies**
   - Vitest 4+, Playwright 1.56+ for testing
   - Tailwind 3.4+, PostCSS autoprefixer

## Validation
- `npm ls --depth=0` no duplicates
- `npm audit` clean, no high vulns

## Exceptions
- Experimental: opt-in via feature flags
- Document rationale in CHANGELOG