# Testing Configuration

Unit tests with Vitest and E2E tests with Playwright.

## Vitest Configuration

### Installation

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Basic Config

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/tests/**',
        '**/node_modules/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File

Create `tests/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

## React Testing

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });
});
```

## Vitest Advanced Config

### Environment Options

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom', // For React components
    environment: 'node', // For utilities
    environment: 'happy-dom', // Faster alternative to jsdom
  },
});
```

### Coverage Configuration

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/setup.ts',
        '**/types/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### Test Patterns

```typescript
export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
  },
});
```

## Playwright Configuration

### Installation

```bash
npm install -D @playwright/test
npx playwright install
```

### Basic Config

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## E2E Test Example

### Basic Test

Create `tests/e2e/example.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My App/);
});

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'user@example.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=submit]');
  await expect(page).toHaveURL('/dashboard');
});
```

### API Testing

```typescript
import { test, expect } from '@playwright/test';

test('creates user via API', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  });

  expect(response.status()).toBe(201);
  const user = await response.json();
  expect(user.name).toBe('John Doe');
});
```

## Test Organization

### Directory Structure

```
tests/
├── setup.ts                    # Test setup
├── utils/
│   ├── render.tsx              # Custom render function
│   └── msw.ts                  # MSW setup
├── components/
│   ├── Button.test.tsx         # Component tests
│   └── Button.e2e.spec.ts      # Component E2E tests
├── hooks/
│   └── useCounter.test.ts      # Hook tests
└── e2e/
    ├── auth.spec.ts            # Feature E2E tests
    └── user-flow.spec.ts       # User journey tests
```

### Test Utilities

Create `tests/utils/render.tsx`:

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

**Usage:**

```typescript
import { render, screen } from '@/tests/utils/render';
import { Button } from '@/components/Button';

test('renders button', () => {
  render(<Button>Click</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Running Tests

### Unit Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
vitest run src/components # Run specific file
vitest run --reporter=verbose # Verbose output
```

### E2E Tests

```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI
npx playwright test       # Direct Playwright
npx playwright test --headed # With browser UI
npx playwright show-report # View last report
```

### CI Commands

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests (install browsers first)
npx playwright install --with-deps
npm run test:e2e
```

## Mocking

### Vitest Mocking

```typescript
import { vi } from 'vitest';

// Mock function
const mockFn = vi.fn();
mockFn('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

// Mock module
vi.mock('@/utils/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' }),
}));

// Mock component
vi.mock('@/components/Button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));
```

### MSW for API Mocking

```bash
npm install -D msw
```

Create `tests/utils/msw.ts`:

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Best Practices

### Test Structure (AAA Pattern)

```typescript
test('button click handler', () => {
  // Arrange
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click</Button>);

  // Act
  screen.getByRole('button').click();

  // Assert
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Library Queries (Priority Order)

1. **getByRole** - For semantic elements
2. **getByLabelText** - For form fields
3. **getByPlaceholderText** - When no label
4. **getByText** - For non-interactive elements
5. **getByTestId** - Last resort

### E2E Test Best Practices

- Use `data-testid` for stable selectors
- Test one feature per test file
- Use page objects for complex UIs
- Clean up test data
- Test on multiple browsers
- Use realistic data

## Coverage Thresholds

### Recommended Thresholds

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### Strict Thresholds

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
}
```

## Troubleshooting

### "Text does not match" Error

```typescript
// Bad
expect(screen.getByText('Click Me')).toBeInTheDocument();

// Good - use exact match
expect(screen.getByText('Click Me')).toBeInTheDocument();

// Or use regex
expect(screen.getByText(/click/i)).toBeInTheDocument();
```

### Vitest Runs Out of Memory

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Increase memory limit
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
```

### Playwright Tests Timeout

```typescript
export default defineConfig({
  test: {
    timeout: 60000, // Increase test timeout
    expect: {
      timeout: 10000,
    },
  },
});
```

### MSW Not Intercepting Requests

```typescript
import { server } from '@/tests/utils/msw';

// Start MSW before each test
beforeEach(() => {
  server.listen();
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});
```

## Test Commands Reference

```bash
# Vitest
npm run test                    # Run tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage
vitest run --reporter=json     # JSON reporter

# Playwright
npm run test:e2e               # Run E2E
npm run test:e2e:ui            # UI mode
npx playwright test --headed   # Browser UI
npx playwright test --grep "login" # Filter by name
npx playwright show-report     # Show HTML report
npx playwright codegen         # Generate tests

# CI
CI=true npm run test:coverage  # CI mode
npx playwright install --with-deps # Install browsers
```
