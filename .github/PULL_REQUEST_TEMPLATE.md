## Pull Request Checklist - Zero Trust Security Requirements

### Pre-Submission ✓

#### Code Quality
- [ ] Code follows project style guidelines (ESLint passes with 0 warnings)
- [ ] TypeScript compilation succeeds (`pnpm exec tsc --noEmit`)
- [ ] No console.log, debugger, or console.* statements in production code
- [ ] All new code has appropriate error handling
- [ ] No TODO comments without corresponding issue

#### Security
- [ ] No secrets, API keys, or credentials in code
- [ ] All user inputs are validated and sanitized
- [ ] No deprecated or vulnerable dependencies
- [ ] No hardcoded URLs or configuration values
- [ ] XSS, CSRF, and injection vulnerabilities checked

#### Testing
- [ ] Unit tests added for new functionality
- [ ] Integration tests updated if needed
- [ ] E2E tests pass (if applicable)
- [ ] Test coverage maintained or improved
- [ ] Playwright tests updated (if UI changes)

#### Documentation
- [ ] Comments explain complex logic
- [ ] API changes documented
- [ ] README updated if needed
- [ ] SECURITY.md updated if security implications

#### Compliance
- [ ] SBOM updated (if dependencies changed)
- [ ] License headers present (if applicable)
- [ ] Accessibility requirements met (if UI changes)
- [ ] Performance impact assessed

### Post-Submission Requirements

#### CI/CD Status
- [ ] All CI checks pass:
  - [ ] verify-identity
  - [ ] scan-secrets
  - [ ] verify-dependencies
  - [ ] security-analysis
  - [ ] build
  - [ ] test
  - [ ] release-gate

#### Code Review
- [ ] Security team review completed
- [ ] Dev team review completed (minimum 2 reviewers)
- [ ] All comments addressed
- [ ] No unresolved discussions

#### Security Validation
- [ ] No critical or high severity vulnerabilities
- [ ] Dependencies verified and signed
- [ ] Supply chain scan passed
- [ ] SAST scan passed with no issues

### Release Information

**Is this a production release?**
- [ ] YES - Tag push (vX.Y.Z)
- [ ] YES - Main branch merge
- [ ] NO - Feature branch

**Release Type:**
- [ ] Major (X.0.0) - Breaking changes
- [ ] Minor (X.Y.0) - New features, backward compatible
- [ ] Patch (X.Y.Z) - Bug fixes, backward compatible

**Backwards Compatibility:**
- [ ] Fully backward compatible
- [ ] Minor breaking changes documented
- [ ] Major breaking changes (requires major version bump)

### Security Verification

**Commit Information:**
- Commit SHA: `{{ github.sha }}`
- Branch: `{{ github.ref_name }}`
- Signed: [ ] YES [ ] NO (GPG signing required for production)

**Dependency Changes:**
- New dependencies added: [ ] List
- Dependencies updated: [ ] List
- Dependencies removed: [ ] List

**Security Implications:**
- [ ] No security implications
- [ ] Security team has reviewed
- [ ] New security measures added

### Post-Merge

- [ ] Delete feature branch
- [ ] Update changelog
- [ ] Close related issues
- [ ] Notify relevant stakeholders
- [ ] Monitor deployment

---

### Security Notice

⚠️ **IMPORTANT**: This repository follows Zero Trust principles. All code is scanned for security vulnerabilities, dependencies are verified, and builds are cryptographically signed. Any security issues will block the merge until resolved.

### Need Help?

- Security Team: @security-team or security@novelist.ai
- Dev Team: @dev-team
- Documentation: See SECURITY.md and .github/SECURITY.md
