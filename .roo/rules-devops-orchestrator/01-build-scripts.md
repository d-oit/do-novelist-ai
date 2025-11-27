# Build Scripts Rules

## Purpose
npm scripts standardization for Novelist.ai CI/CD pipeline.

## Rules
1. **Core Scripts**
   - dev: vite
   - build: vite build
   - test: vitest
   - test:e2e: playwright test
   - lint: tsc --noEmit

2. **Chaining**
   - lint-test: npm run lint && npm test
   - ci: npm ci && npm run lint-test && npm run build

3. **Husky Pre-commit**
   - lint-staged: tsc, vitest changed files

## Validation
- package.json scripts executable without errors

## Exceptions
- Local aliases in .zshrc