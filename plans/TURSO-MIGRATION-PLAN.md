# Turso Migration Plan - localStorage to LibSQL/Turso

## Overview

Migrate all localStorage usage to Turso (local file or cloud) database for persistent storage.

## Current State Analysis

### localStorage Usages Found (204+ occurrences):

1. **Core Database Config** (`src/lib/db.ts`)
   - `novelist_db_config` - DB connection configuration
   - `novelist_local_projects` - Project data fallback

2. **AI Preferences** (`src/lib/db/ai-preferences.ts`)
   - `novelist_ai_preferences_*` - User AI settings
   - `novelist_ai_preferences_capabilities` - Provider capabilities
   - `novelist_ai_preferences_analytics` - Usage analytics
   - `novelist_ai_preferences_health` - Provider health

3. **User Identity** (`src/lib/utils.ts`)
   - `novelist_user_id` - Anonymous user ID
   - `novelist_device_id` - Device identifier

4. **Services Using localStorage**:
   - `openrouter-models-service.ts` - Model cache
   - `project-service.ts` - Project fallback storage
   - `writing-assistant-service.ts` - User/device ID
   - `versioning-service.ts` - Settings storage
   - `UserContext.tsx` - Theme settings

## Migration Tasks

### Task 1: Core Database Schema Extension
Add new tables for data currently in localStorage:
- `user_settings` table
- `model_cache` table
- `device_registry` table

### Task 2: Database Service Layer
Create unified database service that:
- Supports both local (file:novelist.db) and cloud (Turso) modes
- Removes all localStorage dependencies
- Provides migration utilities

### Task 3: User Identity Service
Migrate user/device ID storage to database.

### Task 4: OpenRouter Models Cache
Replace localStorage cache with database table.

### Task 5: Settings Storage
Migrate theme/preferences to database.

### Task 6: Test Updates
Update all tests to use database mocks instead of localStorage.

### Task 7: Build & Lint Verification
Ensure all changes pass build, lint, and tests.

## Agent Assignment

| Agent | Task | Files |
|-------|------|-------|
| Agent 1 | Schema + Migration | `src/lib/database/schemas/`, migrations |
| Agent 2 | Core DB Service | `src/lib/db.ts`, `src/lib/database/` |
| Agent 3 | User Identity | `src/lib/utils.ts`, user services |
| Agent 4 | OpenRouter Cache | `src/services/openrouter-models-service.ts` |
| Agent 5 | AI Preferences | `src/lib/db/ai-preferences.ts` |
| Agent 6 | Project Service | `src/lib/database/services/project-service.ts` |
| Agent 7 | Writing Assistant | `src/lib/database/services/writing-assistant-service.ts` |
| Agent 8 | Versioning Service | `src/lib/database/services/versioning-service.ts` |
| Agent 9 | User Context | `src/contexts/UserContext.tsx` |
| Agent 10 | Test Updates | All test files with localStorage mocks |

## Success Criteria

- [ ] Zero localStorage usage in production code
- [ ] All tests pass
- [ ] Build completes without errors
- [ ] Lint passes with no warnings
- [ ] GitHub Actions CI passes
