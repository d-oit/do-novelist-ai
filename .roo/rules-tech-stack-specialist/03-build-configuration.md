# Build Configuration Rules

## Purpose
Vite, Tailwind, TypeScript, testing config standards for optimal Novelist.ai builds.

## Rules
1. **vite.config.ts**
   - React 19 plugin, strict base='/'
   - Build: lib mode false, sourcemap true prod
   - Preview: port 4173

2. **tsconfig.json**
   - strict: true, noImplicitAny: true
   - paths: @/* -> src/*
   - moduleResolution: bundler

3. **tailwind.config.js**
   - content: ./src/**/*.{ts,tsx}
   - theme: extend colors (slate-indigo semantic)
   - plugins: forms, typography

4. **Testing Configs**
   - vitest: globals true, environment: jsdom
   - playwright: fullyParallel false, retries 2

## Validation
- `npm run build` zero errors/warnings
- Bundle analyzer <2MB gzipped

## Exceptions
- Local dev: relaxed strictness via tsconfig.dev.json