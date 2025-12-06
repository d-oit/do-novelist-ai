# Accessibility Best Practices - Novelist.ai

## Overview

This document outlines accessibility best practices for Novelist.ai, documenting
fixes and prevention strategies for WCAG 2.1 AA compliance.

## Recent Fix: Navigation Color Contrast Issue

### Problem Identified

**Date:** December 5, 2025  
**Severity:** WCAG 2.1 AA Violation  
**Component:** `src/components/Navbar.tsx`

#### Issue Details

- **Color Contrast Ratio:** 1.12:1 (Failed - Required: 4.5:1)
- **Affected Element:** Active navigation buttons
- **Colors:**
  - Foreground: `#18181b` (dark text)
  - Background: `#251f37` (primary color with 20% opacity)
- **Impact:** Navigation buttons were unreadable for users with visual
  impairments

#### Root Cause

```tsx
// Problematic styling in dark mode
currentView === view
  ? 'bg-primary/20 text-primary-foreground' // 20% opacity created insufficient contrast
  : 'text-muted-foreground hover:bg-secondary hover:text-foreground';
```

### Solution Implemented

#### Fix Applied

Changed from low-opacity background to full primary color:

```tsx
// Fixed styling with proper contrast
currentView === view
  ? 'bg-primary text-primary-foreground' // Full primary color provides proper contrast
  : 'text-muted-foreground hover:bg-secondary hover:text-foreground';
```

#### Verification Process

1. **Unit Tests:** Updated `Navbar.test.tsx` expectations
2. **Accessibility Audit:** Ran automated axe-core tests
3. **E2E Testing:** Verified in Playwright accessibility tests
4. **Manual Verification:** Checked contrast ratios in browser dev tools

#### Results

- ✅ **Before:** 1.12:1 contrast ratio (FAIL)
- ✅ **After:** Proper contrast meeting 4.5:1 requirement (PASS)
- ✅ **Zero accessibility violations** in automated testing

## Accessibility Testing Strategy

### Automated Testing Tools

1. **axe-core** - Integrated in unit tests
2. **@axe-core/playwright** - E2E accessibility testing
3. **jest-axe** - Component-level accessibility testing

### Testing Workflow

```bash
# Run accessibility-specific tests
npm run test -- src/test/accessibility-audit.test.ts

# Run E2E accessibility tests
npm run test:e2e -- tests/specs/accessibility.spec.ts

# Check for accessibility violations in specific components
npm run test -- --grep="accessibility"
```

## Design System Guidelines

### Color Contrast Requirements

#### WCAG 2.1 AA Standards

- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text (18pt+):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

#### Our Color Variables

```css
/* Light Mode */
--primary: 255 60% 55%;
--primary-foreground: 0 0% 98%;

/* Dark Mode */
--primary: 255 60% 65%;
--primary-foreground: 240 5.9% 10%;
```

### Safe Color Combinations

#### ✅ Recommended Patterns

```tsx
// High contrast for active states
'bg-primary text-primary-foreground';

// Safe hover states
'hover:bg-secondary hover:text-foreground';

// Muted content with sufficient contrast
'text-muted-foreground';
```

#### ⚠️ Patterns to Avoid

```tsx
// Low opacity backgrounds with contrasting text
'bg-primary/20 text-primary-foreground'; // Risk: insufficient contrast

// Similar tone combinations
'bg-muted text-muted-foreground'; // Risk: low contrast in some themes
```

## Development Best Practices

### 1. Color Contrast Validation

#### During Development

- Use browser dev tools to check contrast ratios
- Test in both light and dark modes
- Consider color blindness accessibility

#### Tools & Extensions

- **WebAIM Contrast Checker:** Online contrast validation
- **axe DevTools:** Browser extension for accessibility auditing
- **Colour Contrast Analyser:** Desktop application for detailed analysis

### 2. Component Design Principles

#### Navigation Components

```tsx
// ✅ Good: Clear contrast for active states
const activeStyles = 'bg-primary text-primary-foreground'
const inactiveStyles = 'text-muted-foreground hover:bg-secondary hover:text-foreground'

// ✅ Good: Proper ARIA labeling
<button
  aria-current={isActive ? 'page' : undefined}
  aria-label={`Navigate to ${label}`}
>
```

#### Form Components

```tsx
// ✅ Good: Sufficient contrast and clear focus states
const inputStyles =
  'border-input bg-background text-foreground focus:ring-2 focus:ring-ring';
```

### 3. Testing Checklist

Before committing code with UI changes:

- [ ] Verify color contrast ratios meet WCAG 2.1 AA standards
- [ ] Test in both light and dark modes
- [ ] Run accessibility test suite
- [ ] Check keyboard navigation functionality
- [ ] Validate ARIA attributes and semantic HTML

## Accessibility Test Coverage

### Current Test Files

- `src/test/accessibility-audit.test.ts` - Component accessibility auditing
- `tests/specs/accessibility.spec.ts` - E2E accessibility testing
- Component-specific accessibility tests in `__tests__` directories

### Test Patterns

```tsx
// Example accessibility test pattern
it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Monitoring & Maintenance

### Regular Audits

- **Weekly:** Automated accessibility test runs in CI
- **Monthly:** Manual accessibility review of new features
- **Quarterly:** Comprehensive accessibility audit with external tools

### Performance Monitoring

- Track accessibility test results in CI/CD pipeline
- Monitor for new violations in pull requests
- Document accessibility decisions in code reviews

## Resources & References

### WCAG Guidelines

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_overview&levels=aa)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Testing Tools

- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

### Design Resources

- [A11Y Project](https://www.a11yproject.com/)
- [Inclusive Design Patterns](https://inclusive-components.design/)

## Contributing to Accessibility

When adding new UI components or modifying existing ones:

1. **Design Phase:** Consider accessibility from the start
2. **Development:** Follow established color patterns and ARIA guidelines
3. **Testing:** Include accessibility tests for new components
4. **Review:** Check accessibility impact in code reviews
5. **Documentation:** Update this guide when establishing new patterns

---

**Last Updated:** December 5, 2025  
**Next Review:** January 5, 2025  
**Maintained by:** Development Team
