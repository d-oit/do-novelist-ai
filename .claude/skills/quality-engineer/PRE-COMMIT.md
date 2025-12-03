# Pre-commit Hooks Setup

Automated quality checks before every commit using Husky and lint-staged.

## Installation

```bash
npm install -D husky lint-staged
npx husky init
```

## Basic Configuration

### Pre-commit Hook

Update `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npm run lint:ci
```

**This runs lint checks before every commit and fails if errors exist.**

### Lint-staged Configuration

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --ext .ts,.tsx --fix --no-error-on-unmatched"
  ],
  "*.{js,jsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --fix --no-error-on-unmatched"
  ],
  "*.json": ["biome check --write"],
  "*.md": ["biome format --write"],
  "package.json": ["prettier --write"]
}
```

## Advanced Hook Configuration

### Run Multiple Quality Checks

Update `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run quality gates
npm run lint:ci && npm run type-check && npm run test
```

**This ensures all quality gates pass before commit.**

### Staged Files Only

`.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --ext .ts,.tsx --fix --no-error-on-unmatched",
    "git add"
  ]
}
```

**Auto-adds fixed files to commit.**

## Commit Message Linting

### Installation

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

### Configuration

Create `commitlint.config.js`:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
    'subject-case': [0],
    'header-max-length': [0],
  },
};
```

### Commit-msg Hook

Create `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

## Hook Scripts

### Type Check Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Fast feedback: run only what's necessary
npm run lint:ci

# Optional: type check (slower, can be moved to CI)
# npm run type-check
```

### Test Hook (Not Recommended)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run test:fast
```

**Warning**: Running tests on every commit can be slow. Better to run in CI.

## Workflow Integration

### Git Workflow with Hooks

```bash
# Make changes
git add .

# Hooks run automatically on commit
git commit -m "feat: add new feature"

# If hooks fail, fix issues
npm run lint:fix
git add .
git commit -m "feat: add new feature"
```

### Bypassing Hooks (Emergency Only)

```bash
git commit --no-verify -m "Emergency fix"
```

**Use sparingly** - only for urgent hotfixes.

## Performance Optimization

### Faster Lint-staged

```json
{
  "*.{ts,tsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --ext .ts,.tsx --fix --no-error-on-unmatched --max-warnings 0"
  ]
}
```

**Flags explained:**

- `--no-errors-on-unmatched`: Don't fail if no files match
- `--max-warnings 0`: Fail on warnings in CI

### Parallel Execution

```json
{
  "*.{ts,tsx}": "biome check --write --no-errors-on-unmatched",
  "*.{js,jsx}": "eslint --fix --no-error-on-unmatched"
}
```

**Run checks in parallel** - faster than sequential execution.

### Cache Configuration

```json
{
  "*.{ts,tsx}": [
    "biome check --write --no-errors-on-unmatched --cache",
    "eslint --fix --no-error-on-unmatched --cache"
  ]
}
```

**Enables caching** for faster subsequent runs.

## Different Environments

### Development

Focus on speed and automatic fixes:

`.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint:fix
```

### CI/CD

Fail on any issues:

```bash
npm run lint:ci && npm run type-check
```

## Troubleshooting

### Hooks Not Running

```bash
# Check if hooks are installed
ls -la .husky/

# Reinstall hooks
rm -rf .husky
npx husky init
chmod +x .husky/pre-commit

# Verify hook content
cat .husky/pre-commit
```

### Pre-commit Hook Fails

```bash
# Run manually to see errors
npm run lint:ci

# Fix automatically
npm run lint:fix

# Check specific file
npx eslint src/App.tsx --format=compact
```

### Lint-staged Too Slow

```bash
# Check what files are being processed
npx lint-staged --debug

# Add --no-errors-on-unmatched flag
# Use parallel configuration
# Add caching flags
```

### Changes Not Staged After Fix

```json
{
  "*.{ts,tsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --ext .ts,.tsx --fix --no-error-on-unmatched",
    "git add"  # Auto-stage fixes
  ]
}
```

## Advanced Patterns

### Multi-stage Validation

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Stage 1: Fast checks (auto-fix)
npm run lint:fix

# Stage 2: Type check (fail if errors)
npm run type-check

# Stage 3: Unit tests (can skip in pre-commit)
# npm run test:unit
```

### Conditional Hooks

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only run checks if TypeScript files changed
if git diff --cached --name-only | grep -q '\.ts$'; then
  npm run type-check
fi

if git diff --cached --name-only | grep -q '\.tsx\?$'; then
  npm run lint:ci
fi
```

### Environment-specific Hooks

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Skip hooks in specific directories
if [ -d "external/" ]; then
  echo "Skipping hooks for external code"
  exit 0
fi

npm run lint:ci
```

## Hook Best Practices

✓ Keep pre-commit hooks fast (< 10 seconds) ✓ Focus on formatting and linting
(not tests) ✓ Use `--no-errors-on-unmatched` for safety ✓ Auto-fix when possible
(format, lint) ✓ Fail on type errors (always check) ✓ Use commit message linting
for consistency

✗ Don't run slow tests in pre-commit ✗ Don't commit if hooks fail ✗ Don't bypass
hooks regularly ✗ Don't make hooks dependent on external services

## Git Hooks Cheatsheet

### Available Hooks

- `pre-commit`: Before commit message
- `commit-msg`: Validate commit message
- `pre-push`: Before push to remote
- `post-commit`: After commit (informational)

### Creating Custom Hooks

```bash
# Pre-push hook
echo '#!/usr/bin/env sh' > .husky/pre-push
echo '. "$(dirname -- "$0")/_/husky.sh"' >> .husky/pre-push
echo 'npm run type-check' >> .husky/pre-push
chmod +x .husky/pre-push
```

### Testing Hooks

```bash
# Test pre-commit hook manually
. .husky/pre-commit

# Test commit message hook
. .husky/commit-msg .git/COMMIT_EDITMSG
```

## Complete Example

**`.lintstagedrc.json`:**

```json
{
  "*.{ts,tsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --ext .ts,.tsx --fix --no-error-on-unmatched"
  ],
  "*.{js,jsx}": [
    "biome check --write --no-errors-on-unmatched",
    "eslint --fix --no-error-on-unmatched"
  ],
  "*.json": ["biome check --write"],
  "*.md": ["biome format --write"],
  "package.json": ["prettier --write"]
}
```

**`.husky/pre-commit`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**`commitlint.config.js`:**

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
  },
};
```

**`.husky/commit-msg`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

This setup ensures:

- Code is formatted and linted on commit
- Commit messages follow conventions
- Fast feedback for developers
- Quality gates are enforced
