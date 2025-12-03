# Biome Configuration

Biome provides fast formatting and linting for JavaScript, TypeScript, and CSS.

## Basic Configuration

Minimum `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": { "enabled": true }
}
```

## Advanced Rules

### Strict Linting Rules

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "error",
        "useConst": "error",
        "noUnusedTemplateLiteral": "error",
        "noUselessElse": "error",
        "useFilenamingConvention": {
          "level": "error",
          "options": { "strictCase": true, "requireAscii": true }
        }
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsoleLog": "warn",
        "noGlobalIsNan": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "warn",
        "noInvalidUseBeforeDecl": "error"
      }
    }
  }
}
```

### Formatting Options

```json
{
  "formatter": {
    "enabled": true,
    "formatWithPath": false,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingComma": "all",
      "bracketSpacing": true,
      "bracketSameLine": false
    }
  },
  "json": {
    "formatter": {
      "enabled": true,
      "indentWidth": 2
    }
  }
}
```

## Import Organization

Organize imports automatically:

### Simple Groups

```json
{
  "organizeImports": {
    "enabled": true
  }
}
```

### Advanced Import Groups

```json
{
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": {
          "level": "on",
          "options": {
            "groups": [
              [":NODE:", ":BUN:"],
              ":BLANK_LINE:",
              [":PACKAGE:", "!@/**"],
              ":BLANK_LINE:",
              ["@/**"],
              ":BLANK_LINE:",
              [":RELATIVE:"]
            ]
          }
        }
      }
    }
  }
}
```

**Import order:**

1. Node/Bun built-ins (`fs`, `path`, `os`)
2. External packages (`lodash`, `react`)
3. Organization packages (`@org/**`)
4. Internal packages (`@/**`)
5. Relative imports (`./`, `../`)

### Clean Architecture Groups

For domain-driven design projects:

```json
{
  "groups": [
    [":NODE:", ":BUN:"],
    ":BLANK_LINE:",
    [":PACKAGE:", "!@org/**"],
    ":BLANK_LINE:",
    ["@org/**"],
    ":BLANK_LINE:",
    ["@/domain/**", "@/application/**", "@/infrastructure/**"],
    ":BLANK_LINE:",
    ["~/**"],
    ":BLANK_LINE:",
    [":PATH:"]
  ]
}
```

## Biome vs ESLint

**Use Biome for:**

- Code formatting
- Basic linting
- Import organization
- File naming conventions

**Use ESLint for:**

- React-specific rules (hooks, JSX)
- Complex logic rules
- Accessibility rules

**Configuration for coexistence:**

- Biome handles formatting
- ESLint handles React/TypeScript rules
- No overlapping rules

Example in `.eslintrc.cjs`:

```javascript
module.exports = {
  rules: {
    'no-unused-vars': 'off', // Biome handles this
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
```

## Common Commands

```bash
# Format code
npx biome format --write .

# Check formatting (CI)
npx biome format .

# Lint code
npx biome check .

# Fix lint issues
npx biome check --write .

# Organize imports
npx biome check --write --organize-imports .

# All in one
npx biome format --write . && npx biome check --write .
```

## Suppressing Rules

### File-level suppression

```javascript
/* biome-ignore lint: reason */
const x = 1; // Explicit any type
```

### Line-level suppression

```javascript
const x = 1; // biome-ignore: reason
```

## Performance

**Speed up linting:**

```json
{
  "linter": {
    "enabled": true,
    "ignore": ["node_modules/**", "dist/**"]
  }
}
```

**CI optimization:**

```bash
# Only check changed files
npx biome ci --changed

# Use parallel processing
npx biome check --jobs=4 .
```

## Best Practices

✓ Enable `organizeImports` ✓ Use `single` quote style (matches Prettier
defaults) ✓ Enable all recommended rules ✓ Configure `noUnusedVariables` ✓ Use
strict case for file naming

✗ Don't disable rules without reason ✗ Don't mix with Prettier on TS/JS files ✗
Don't ignore errors in CI

## Troubleshooting

### Import organization not working

- Check `organizeImports.enabled: true`
- Verify import groups syntax
- Run: `npx biome check --write --organize-imports .`

### Slow performance

- Add ignore patterns for `node_modules`, `dist`
- Use `--jobs` flag for parallel processing
- Check file count and complexity

### Conflicts with ESLint

- Disable overlapping rules in ESLint
- Use Biome only for formatting
- Let ESLint handle React-specific rules
