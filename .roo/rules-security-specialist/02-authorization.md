# Authorization Rules

## Purpose
Access control rules for Novelist.ai features and data.

## Rules
1. **Feature Permissions**
   - Publish: chaptersCompleted === targetChapters
   - Edit: project.owner === userId

2. **Data Access**
   - Own projects only
   - Zod guards on all inputs

3. **Role-Based**
   - Owner: full access
   - Viewer: read-only (future)

## Validation
- Runtime checks in services
- No client-side bypass

## Exceptions
- Local dev: bypass enabled