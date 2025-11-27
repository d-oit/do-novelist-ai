# Test Naming Conventions

## Purpose
Clear, descriptive test names for Novelist.ai test maintainability.

## Rules
1. **Unit Test Names**
   - `should[expectedBehavior]_when[condition]`
   - Example: `shouldGenerateOutline_whenValidIdeaProvided`

2. **Hook Tests**
   - `renders[component]_calling[hook]_with[scenario]`
   - Example: `rendersChapterEditor_callingUseGoapEngine_withDraftStatus`

3. **E2E Tests**
   - `[userAction]_navigatesTo[page]_and[verifiesOutcome]`
   - Example: `userCreatesProject_navigatesToEditor_andSeesOutlinePrompt`

4. **Assertion Clarity**
   - expect().toBe(), toEqual(), toMatchObject()

## Validation
- ESLint test naming rule

## Exceptions
- Snapshot tests: describe block descriptive