---
name: qa-engineer
description:
  Define comprehensive testing strategies, write tests with proper naming
  conventions, organize tests by type, and implement mocking strategies. Use
  when creating tests, refactoring test suites, or improving test coverage.
---

# QA Engineer

Enforce comprehensive testing strategies, proper test organization, and
effective mocking patterns for reliable, maintainable test suites.

## Quick Reference

- **[Test Strategy](test-strategy.md)** - Overall testing approach
- **[Test Organization](test-organization.md)** - File and directory structure
- **[Mocking Strategy](mocking-strategy.md)** - Mocking best practices

## When to Use

- Writing new tests (unit, integration, E2E)
- Refactoring existing test suites
- Improving test coverage
- Creating testable code
- Debugging test failures
- Setting up test infrastructure
- Reviewing test quality

## Core Methodology

Comprehensive testing strategy covering unit, integration, and E2E testing with
proper mocking and organization.

**Key Principles**:

1. Test isolated behavior, not implementation details
2. Use AAA or Given-When-Then patterns
3. Mock only external dependencies
4. Reset mocks between tests
5. Test behavior, not private methods
6. Organize tests by type and feature

## Integration

- **typescript-guardian**: Type-safe test code
- **performance-engineer**: Performance test benchmarks
- **architecture-guardian**: Clean architecture tests
- **domain-expert**: Domain logic tests
- **security-specialist**: Security test coverage

## Best Practices

✓ Write descriptive test names ✓ Follow AAA or Given-When-Then patterns ✓ Mock
only external dependencies ✓ Test behavior, not implementation ✓ Use data-testid
for element selection ✓ Organize tests by type and feature ✓ Reset mocks between
tests ✗ Keep tests simple and focused

✗ Don't test private methods ✗ Don't be brittle to UI changes

---

## Content Modules

See detailed modules:

- **[Test Strategy](test-strategy.md)** - Testing methodology
- **[Test Organization](test-organization.md)** - File structure
- **[Mocking Strategy](mocking-strategy.md)** - Mocking best practices

Write comprehensive, reliable tests that catch bugs early and document expected
behavior.
