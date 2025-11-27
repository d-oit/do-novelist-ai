# Module Boundaries Rules

## Purpose
Defines module cohesion and coupling rules for Novelist.ai features per SRP and high cohesion.

## Rules
1. **Feature Modules**
   - Cohesion: all files serve single feature (editor, analytics)
   - Coupling: low, only lib/ and own index.ts

2. **Single Responsibility**
   - Components: UI only
   - Hooks: business logic
   - Services: external API calls

3. **Public/Private**
   - __tests__/: private
   - index.ts: public API only
   - Internal: no export

4. **Size Limits**
   - Module <20 files
   - High cohesion score >80%

## Validation
- cloc per feature dir
- import graph analysis

## Exceptions
- Core lib/: higher coupling allowed