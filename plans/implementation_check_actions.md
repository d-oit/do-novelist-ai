# Fix GitHub Action Issues

## Goal Description

Fix YAML lint issues in GitHub Actions to ensure clean CI runs.

## User Review Required

- [ ] Confirm disabling `truthy` rule in `yamllint` is acceptable (standard for
      GHA).
- [ ] Confirm adding `---` document start marker to all YAML files.

## Proposed Changes

### GitHub Workflows

#### [MODIFY] [.github/workflows/yaml-lint.yml](file:///d:/git/do-novelist-ai/.github/workflows/yaml-lint.yml)

- Update `yamllint` command to disable `truthy` rule (allows `on:` without
  quotes).
- Add `---` at the start of the file.

#### [MODIFY] [.github/dependabot.yml](file:///d:/git/do-novelist-ai/.github/dependabot.yml)

- Add `---` at the start of the file.

#### [MODIFY] All checks in [.github/workflows/](file:///d:/git/do-novelist-ai/.github/workflows/)

- Add `---` at the start of all workflow files to satisfy `document-start` rule.

## Verification Plan

### Automated Tests

- Run
  `python -m yamllint -d "{extends: default, rules: {line-length: {max: 120}, indentation: {spaces: 2}, truthy: disable}}" .github/`
  locally.
- Verify exit code is 0.
