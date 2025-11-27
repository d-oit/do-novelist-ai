# SRP Guidelines

## Purpose
Single Responsibility Principle enforcement for Novelist.ai codebase.

## Rules
1. **Component SRP**
   - UI: render only
   - Hooks: logic only
   - Services: external I/O only

2. **Examples**
   - Good: useGoapEngine - GOAP logic only
   - Bad: CharacterManager renders + saves + validates

3. **File Organization**
   - One class/function per responsibility
   - Extract >100 LOC methods

## Validation
- Cyclomatic complexity <10
- Max 3 responsibilities per file

## Exceptions
- Entry points: orchestrate SRP units