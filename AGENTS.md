# AGENTS.md - Coding Guidelines for Novelist.ai

Important: All plan,report,summary,proposal,design, etc. documents in plans/
folder.

## Build/Lint/Test Commands

- **Build**: `npm run build` (Vite production build)
- **Lint**: `npm run lint` (ESLint + TypeScript type checking with auto-fix)
- **Lint CI**: `npm run lint:ci` (ESLint + TypeScript checking for CI/CD)
- **Lint Fix**: `npm run lint:fix` (ESLint auto-fix only)
- **Test**: `npm run test` (Vitest unit tests)
- **Test single file**: `vitest run src/path/to/file.test.ts`
- **E2E tests**: `npm run test:e2e` (Playwright)
- **E2E single spec**: `playwright test tests/specs/specific.spec.ts`

## Code Style Guidelines

### TypeScript & Types

- Strict mode enabled - explicit types required
- Use interfaces for component props: `interface ComponentProps { ... }`
- Prefer explicit return types for functions (enforced by ESLint)
- Use `React.FC<Props>` for functional components
- Avoid `any` type; use `unknown` if necessary (ESLint enforces this in
  production code)
- Explicit member accessibility required for class properties
- Strict boolean expressions enforced for type safety

### Naming Conventions

- **Components**: PascalCase (`AgentConsole`, `ProjectDashboard`)
- **Variables/Functions**: camelCase (`handleCreateProject`, `currentProject`)
- **Constants**: SCREAMING_SNAKE_CASE (`INITIAL_WORLD_STATE`)
- **Files**: PascalCase for components, camelCase for utilities
- **Test files**: `ComponentName.test.tsx`

### Imports & Organization

- Group imports: React → external libs → internal modules
- Use absolute imports with `@/` alias (`@/components/Button`)
- Sort imports alphabetically within groups
- No duplicate imports
- Auto-organize imports on save (VS Code integration)

### Formatting & Syntax

- 2 spaces indentation (no tabs)
- Semicolons required
- Single quotes for strings
- Trailing commas in multi-line objects/arrays
- Max line length: ~100 characters

**Colocation mandatory.** Max **500 LOC per file**.

### React Patterns

- Use hooks for state management (`useState`, `useEffect`)
- Include accessibility attributes (`aria-label`, `role`, `data-testid`)
- Handle events with proper typing: `(e: React.MouseEvent) =>`
- Use `React.Fragment` or `<>` for multiple root elements
- Follow React Hooks rules (enforced by ESLint)
- Use function declarations for named components, arrow functions for unnamed
  (enforced by ESLint)
- Modern React 17+ - no need to import React for JSX

### Error Handling

- Use try/catch blocks for async operations
- Log errors with `console.error('Context:', error)`
- Graceful fallbacks for failed operations
- User-friendly error messages in UI

### Styling

- Tailwind CSS utility classes
- Responsive design with `sm:`, `md:`, `lg:` prefixes
- Dark mode support with `dark:` prefix
- Consistent spacing with Tailwind scale

### Testing

- Vitest for unit tests, Playwright for E2E
- Use `data-testid` attributes for element selection
- Mock external dependencies (API calls, database)
- Test user interactions and state changes
