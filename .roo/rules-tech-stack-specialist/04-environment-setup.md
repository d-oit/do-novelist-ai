# Environment Setup Rules

## Purpose
Development, staging, production environment configuration for Novelist.ai.

## Rules
1. **Env Vars**
   - VITE_GEMINI_API_KEY required
   - VITE_TURSO_URL, VITE_TURSO_TOKEN for DB
   - Prefix VITE_ for client exposure

2. **Local Dev**
   - npm install → npm run dev (localhost:5173)
   - Turso dev DB sync via lib/db.ts
   - Mock Gemini for offline: mock-gemini.ts

3. **Production**
   - Build: npm run build → dist/
   - Deploy: Vercel/Netlify static host
   - DB: Turso production embed

4. **Testing Env**
   - Vitest: jsdom, coverage report
   - Playwright: headed false CI

## Validation
- .env.example committed
- Husky pre-commit: lint/test

## Exceptions
- API keys: .gitignore, user-provided