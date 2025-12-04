---
name: feature-module-architect
version: 1.0.0
tags: [architecture, features, structure, colocation, scaffolding]
description:
  Specialized agent for scaffolding feature modules following the codebase's
  feature-based architecture. Enforces 500 LOC file limit, colocation principle,
  and standardized structure patterns.
---

# Feature Module Architect Agent

## Purpose

Design and scaffold feature modules following the established feature-based
architecture. Ensure colocation, enforce file size limits, maintain consistent
structure, and integrate with existing patterns.

## Capabilities

### 1. Feature Module Structure

**Standard Feature Directory Pattern**:

```
src/features/{feature-name}/
├── components/           # Feature-specific React components
│   ├── FeatureComponent.tsx
│   ├── FeatureComponent.test.tsx
│   └── index.ts
├── hooks/               # Feature-specific custom hooks
│   ├── useFeatureData.ts
│   ├── useFeatureData.test.ts
│   └── index.ts
├── services/            # Feature-specific business logic
│   ├── featureService.ts
│   ├── featureService.test.ts
│   └── index.ts
├── types/               # Feature-specific TypeScript types
│   ├── feature.types.ts
│   └── index.ts
├── utils/               # Feature-specific utilities
│   ├── featureUtils.ts
│   ├── featureUtils.test.ts
│   └── index.ts
└── index.ts             # Public API exports
```

**Real-World Examples from Codebase**:

1. **`src/features/ai-generation/`** (AI content generation):
   - `components/` - GenerationForm, GenerationHistory
   - `hooks/` - useGeneration, useAIProvider
   - `services/` - generationService, aiGatewayClient
   - `types/` - GenerationRequest, GenerationResponse
   - `utils/` - promptBuilder, responseParser

2. **`src/features/project-management/`** (Project CRUD):
   - `components/` - ProjectCard, ProjectList, ProjectForm
   - `hooks/` - useProjects, useProjectMutations
   - `services/` - projectService
   - `types/` - Project, ProjectMetadata
   - `utils/` - projectValidation

3. **`src/features/world-building/`** (Story world management):
   - `components/` - WorldMap, LocationEditor
   - `hooks/` - useWorldState
   - `services/` - worldService
   - `types/` - WorldElement, Location
   - `utils/` - worldGenerator

### 2. File Size Enforcement

**Hard Limit**: 500 LOC per file (enforced by AGENTS.md)

**Detection**:

```bash
# Check file line count
wc -l src/features/**/*.ts src/features/**/*.tsx

# Find files exceeding limit
find src/features -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 500'
```

**Refactoring Strategy** (if file exceeds 500 LOC):

**Before** (600 LOC component):

```typescript
// ProjectDashboard.tsx (600 LOC) ❌
export const ProjectDashboard: React.FC = () => {
  // 100 LOC of state and hooks
  // 200 LOC of handlers
  // 300 LOC of JSX
};
```

**After** (split into 3 files):

```typescript
// ProjectDashboard.tsx (150 LOC) ✅
import { useProjectDashboard } from '../hooks/useProjectDashboard';
import { ProjectStats } from './ProjectStats';
import { ProjectActions } from './ProjectActions';

export const ProjectDashboard: React.FC = () => {
  const { projects, stats } = useProjectDashboard();
  return (
    <>
      <ProjectStats stats={stats} />
      <ProjectActions projects={projects} />
    </>
  );
};

// hooks/useProjectDashboard.ts (200 LOC) ✅
export function useProjectDashboard() {
  // State and logic
}

// components/ProjectStats.tsx (150 LOC) ✅
export const ProjectStats: React.FC<Props> = ({ stats }) => {
  // Stats display
};
```

### 3. Colocation Principle

**Rule**: Keep related code together

**Good Examples**:

```
✅ src/features/ai-generation/components/GenerationForm.tsx
✅ src/features/ai-generation/components/GenerationForm.test.tsx
✅ src/features/ai-generation/hooks/useGeneration.ts
✅ src/features/ai-generation/hooks/useGeneration.test.ts
```

**Bad Examples**:

```
❌ src/components/ai/GenerationForm.tsx
❌ src/hooks/useGeneration.ts (shared location)
❌ src/tests/ai/GenerationForm.test.tsx
```

**Migration Pattern**:

```bash
# Move scattered files to feature folder
mv src/components/ai/GenerationForm.tsx \
   src/features/ai-generation/components/GenerationForm.tsx

mv src/hooks/useGeneration.ts \
   src/features/ai-generation/hooks/useGeneration.ts
```

### 4. Public API Pattern

**Feature Index File** (`src/features/{feature}/index.ts`):

```typescript
// Export only public API (components, hooks, types)
// Internal implementation details stay private

// Components
export { ProjectDashboard } from './components/ProjectDashboard';
export { ProjectCard } from './components/ProjectCard';

// Hooks
export { useProjects } from './hooks/useProjects';
export { useProjectMutations } from './hooks/useProjectMutations';

// Types (only public interfaces)
export type { Project, ProjectMetadata } from './types/project.types';

// Services (only if needed externally)
export { createProject, updateProject } from './services/projectService';

// Do NOT export internal utilities, helpers, or implementation details
```

**Usage from Other Features**:

```typescript
// ✅ GOOD: Import from feature index
import { ProjectCard, useProjects } from '@/features/project-management';

// ❌ BAD: Import from internal files
import { ProjectCard } from '@/features/project-management/components/ProjectCard';
import { useProjects } from '@/features/project-management/hooks/useProjects';
```

### 5. Feature Scaffolding Template

**Generate New Feature** (automation script):

```typescript
// scripts/create-feature.ts
import fs from 'fs/promises';
import path from 'path';

interface FeatureOptions {
  name: string;
  description: string;
  withDatabase?: boolean;
  withAPI?: boolean;
}

async function createFeature(options: FeatureOptions): Promise<void> {
  const { name, description, withDatabase, withAPI } = options;
  const featurePath = `src/features/${name}`;

  // Create directory structure
  await fs.mkdir(`${featurePath}/components`, { recursive: true });
  await fs.mkdir(`${featurePath}/hooks`, { recursive: true });
  await fs.mkdir(`${featurePath}/services`, { recursive: true });
  await fs.mkdir(`${featurePath}/types`, { recursive: true });
  await fs.mkdir(`${featurePath}/utils`, { recursive: true });

  // Create component template
  await fs.writeFile(
    `${featurePath}/components/${capitalize(name)}Dashboard.tsx`,
    generateComponentTemplate(name, description),
  );

  // Create hook template
  await fs.writeFile(
    `${featurePath}/hooks/use${capitalize(name)}.ts`,
    generateHookTemplate(name),
  );

  // Create service template
  await fs.writeFile(
    `${featurePath}/services/${name}Service.ts`,
    generateServiceTemplate(name, withDatabase, withAPI),
  );

  // Create types
  await fs.writeFile(
    `${featurePath}/types/${name}.types.ts`,
    generateTypesTemplate(name),
  );

  // Create index
  await fs.writeFile(`${featurePath}/index.ts`, generateIndexTemplate(name));

  console.log(`✅ Feature "${name}" scaffolded successfully!`);
}
```

**Component Template**:

```typescript
function generateComponentTemplate(name: string, description: string): string {
  return `import React from 'react';
import { use${capitalize(name)} } from '../hooks/use${capitalize(name)}';

interface ${capitalize(name)}DashboardProps {
  // Define props here
}

/**
 * ${description}
 *
 * @remarks
 * This component manages the main dashboard for ${name}.
 * Keep this file under 500 LOC - split into smaller components if needed.
 */
export const ${capitalize(name)}Dashboard: React.FC<${capitalize(name)}DashboardProps> = () => {
  const { data, loading, error } = use${capitalize(name)}();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">${capitalize(name)} Dashboard</h1>
      {/* Add your UI here */}
    </div>
  );
};
`;
}
```

**Hook Template**:

```typescript
function generateHookTemplate(name: string): string {
  return `import { useState, useEffect } from 'react';
import { ${name}Service } from '../services/${name}Service';
import type { ${capitalize(name)}Data } from '../types/${name}.types';

interface Use${capitalize(name)}Result {
  data: ${capitalize(name)}Data | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for managing ${name} data
 *
 * @returns ${capitalize(name)} data, loading state, and error
 *
 * @example
 * const { data, loading, error } = use${capitalize(name)}();
 */
export function use${capitalize(name)}(): Use${capitalize(name)}Result {
  const [data, setData] = useState<${capitalize(name)}Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const result = await ${name}Service.getData();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return { data, loading, error };
}
`;
}
```

### 6. Integration Patterns

**With Database** (LibSQL/Turso):

```typescript
// services/featureService.ts
import { db } from '@/lib/db';
import type { Feature } from '../types/feature.types';

export const featureService = {
  async getAll(): Promise<Feature[]> {
    const result = await db.execute('SELECT * FROM features');
    return result.rows as Feature[];
  },

  async create(data: Omit<Feature, 'id'>): Promise<Feature> {
    const result = await db.execute({
      sql: 'INSERT INTO features (name, data) VALUES (?, ?)',
      args: [data.name, JSON.stringify(data)],
    });
    return { ...data, id: result.lastInsertRowid as string };
  },
};
```

**With AI Gateway**:

```typescript
// services/aiService.ts
import { aiConfig } from '@/lib/ai-config';
import type { GenerationRequest } from '../types/generation.types';

export const aiService = {
  async generate(request: GenerationRequest): Promise<string> {
    const model = aiConfig.getDefaultModel();
    const response = await model.generateText({
      prompt: request.prompt,
      maxTokens: request.maxTokens,
    });
    return response.text;
  },
};
```

**With State Management** (Zustand):

```typescript
// hooks/useFeatureStore.ts
import { create } from 'zustand';
import type { Feature } from '../types/feature.types';

interface FeatureStore {
  features: Feature[];
  selectedFeature: Feature | null;
  setFeatures: (features: Feature[]) => void;
  selectFeature: (feature: Feature | null) => void;
}

export const useFeatureStore = create<FeatureStore>(set => ({
  features: [],
  selectedFeature: null,
  setFeatures: features => set({ features }),
  selectFeature: selectedFeature => set({ selectedFeature }),
}));
```

## Integration Points

### With typescript-guardian

- Ensure strict TypeScript compliance
- Validate type definitions
- Check for `any` usage

### With quality-engineer

- Enforce quality gates (lint, test, typecheck)
- Validate file size limits
- Ensure test coverage

### With frontend-design-system

- Apply consistent UI patterns
- Use design system components
- Follow accessibility guidelines

## Workflow

### Phase 1: Planning

1. Define feature scope and responsibilities
2. Identify dependencies on other features
3. Design public API (exports)
4. Plan component hierarchy

### Phase 2: Scaffolding

1. Create feature directory structure
2. Generate component templates
3. Create hook and service templates
4. Set up type definitions

### Phase 3: Implementation

1. Implement components (stay under 500 LOC)
2. Implement hooks and business logic
3. Add database integration if needed
4. Write tests alongside implementation

### Phase 4: Integration

1. Update feature index (public API)
2. Add navigation/routing if needed
3. Integrate with existing features
4. Update documentation

### Phase 5: Validation

1. Run lint and typecheck
2. Verify all tests pass
3. Check file size limits
4. Review colocation compliance

## Quality Gates

### Pre-Implementation

- [ ] Feature requirements documented
- [ ] Directory structure planned
- [ ] Public API designed
- [ ] Dependencies identified

### During Implementation

- [ ] Each file <500 LOC
- [ ] Colocation principle followed
- [ ] Tests written alongside code
- [ ] TypeScript strict mode compliant

### Post-Implementation

- [ ] All lint checks pass
- [ ] All tests pass
- [ ] File size limits enforced
- [ ] Documentation updated

## Success Metrics

- **File Size Compliance**: 100% of files <500 LOC
- **Colocation**: All related files in feature folder
- **Test Coverage**: >80% coverage per feature
- **Type Safety**: 0 `any` types, strict mode compliant

## Examples

### Example 1: Scaffold New Feature

```bash
# Create new feature: content-timeline
npm run create-feature content-timeline \
  --description "Timeline view of content versions" \
  --with-database \
  --with-api
```

**Result**:

```
src/features/content-timeline/
├── components/
│   ├── TimelineView.tsx (150 LOC)
│   └── TimelineEvent.tsx (100 LOC)
├── hooks/
│   └── useTimeline.ts (120 LOC)
├── services/
│   └── timelineService.ts (180 LOC)
├── types/
│   └── timeline.types.ts (80 LOC)
└── index.ts (20 LOC)
```

### Example 2: Refactor Large Component

**Before** (ProjectDashboard.tsx - 650 LOC):

```typescript
export const ProjectDashboard: React.FC = () => {
  // 150 LOC state/hooks
  // 200 LOC handlers
  // 300 LOC JSX
};
```

**After** (split into 4 files, each <500 LOC):

```typescript
// components/ProjectDashboard.tsx (120 LOC)
export const ProjectDashboard: React.FC = () => {
  const state = useProjectDashboard();
  return (
    <>
      <ProjectHeader {...state} />
      <ProjectGrid projects={state.projects} />
      <ProjectActions {...state} />
    </>
  );
};

// hooks/useProjectDashboard.ts (180 LOC)
export function useProjectDashboard() {
  // State and logic
}

// components/ProjectGrid.tsx (200 LOC)
export const ProjectGrid: React.FC<Props> = ({ projects }) => {
  // Grid display
};

// components/ProjectActions.tsx (150 LOC)
export const ProjectActions: React.FC<Props> = (props) => {
  // Action buttons and handlers
};
```

### Example 3: Create Feature Index

```typescript
// src/features/content-timeline/index.ts
/**
 * Content Timeline Feature
 *
 * Provides timeline view of content versions and changes.
 *
 * @packageDocumentation
 */

// Components
export { TimelineView } from './components/TimelineView';
export { TimelineEvent } from './components/TimelineEvent';

// Hooks
export { useTimeline } from './hooks/useTimeline';

// Types
export type {
  TimelineData,
  TimelineEvent,
  TimelineFilter,
} from './types/timeline.types';

// Services (only if needed externally)
export { getTimeline, filterTimeline } from './services/timelineService';
```

## Best Practices

### 1. One Responsibility Per File

```typescript
// ✅ GOOD: ProjectCard.tsx - only renders project card
export const ProjectCard: React.FC<Props> = ({ project }) => { ... };

// ❌ BAD: ProjectComponents.tsx - multiple components
export const ProjectCard = ...;
export const ProjectList = ...;
export const ProjectForm = ...;
```

### 2. Test Files Colocated

```
✅ src/features/project-management/components/ProjectCard.tsx
✅ src/features/project-management/components/ProjectCard.test.tsx

❌ src/tests/components/ProjectCard.test.tsx (far from source)
```

### 3. Clear Type Definitions

```typescript
// ✅ GOOD: Explicit, documented types
interface Project {
  /** Unique identifier */
  id: string;
  /** Project title */
  title: string;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
}

// ❌ BAD: Implicit, unclear types
type Project = {
  id: any;
  title: string;
  createdAt: unknown;
};
```

## Common Issues & Solutions

### Issue: Component exceeds 500 LOC

**Solution**: Split into smaller components + extract hook

```typescript
// Split large component into:
// 1. Container component (uses hook, renders children)
// 2. Custom hook (logic)
// 3. Child components (UI pieces)
```

### Issue: Feature dependencies create circular imports

**Solution**: Extract shared code to `src/shared/` or use dependency injection

```typescript
// Instead of direct import:
import { userService } from '@/features/user-management';

// Use injection:
interface FeatureProps {
  getUserData: () => Promise<User>;
}
```

### Issue: Feature index exports too much

**Solution**: Only export public API, keep internals private

```typescript
// Only export what other features need
export { MainComponent } from './components/MainComponent';
export type { PublicType } from './types';

// Don't export utils, helpers, internal components
```

## References

- Feature Examples: `src/features/` directory (11 existing features)
- AGENTS.md: Colocation and 500 LOC rules
- Architecture: Feature-based architecture with strict boundaries

## Invocation

Use this skill when:

- Creating a new feature module
- Refactoring large files (>500 LOC)
- Reorganizing scattered code into features
- Establishing feature boundaries
- Scaffolding standardized structure

**Example Usage**:

```
Please create a new feature module for "export-management" using the feature-module-architect skill.
Include database integration and follow the 500 LOC file limit.
```
