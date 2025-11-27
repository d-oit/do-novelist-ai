# Enhanced TypeScript Integration

This directory contains a comprehensive type system with runtime validation, providing both compile-time and runtime type safety for the Novelist.ai GOAP eBook Engine.

## 🏗️ Architecture Overview

```
src/types/
├── index.ts          # Main entry point, re-exports all types
├── schemas.ts        # Zod schemas with validation rules
├── utils.ts          # TypeScript utility types and helpers
├── guards.ts         # Runtime type guards and validation
└── __tests__/        # Comprehensive test suite
```

## 🔧 Core Components

### 1. Zod Schemas (`schemas.ts`)

Provides runtime validation with automatic TypeScript inference:

```typescript
import { ProjectSchema, validateData, type Project } from './schemas';

// Runtime validation with detailed error reporting
const result = validateData(ProjectSchema, unknownData);
if (result.success) {
  // TypeScript knows this is a valid Project
  console.log(result.data.title);
} else {
  // Detailed validation errors
  console.error(result.error, result.issues);
}
```

**Key Features:**
- ✅ Enhanced validation rules beyond basic types
- ✅ Cross-field validation (e.g., completed chapters ≤ total chapters)
- ✅ Branded types for IDs and special values
- ✅ Comprehensive defaults for optional fields
- ✅ Detailed error messages with field paths

### 2. Type Guards (`guards.ts`)

Runtime type checking and validation:

```typescript
import { isProject, isProjectId, createProjectId } from './guards';

// Type-safe ID creation
const projectId = createProjectId(); // Returns branded ProjectId type

// Runtime type checking
if (isProject(unknownData)) {
  // TypeScript knows unknownData is a Project
  console.log(unknownData.title);
}

// Safe type assertions
assertType(data, isProject, 'Expected valid project');
```

**Key Features:**
- ✅ Schema-based type guards for all domain types
- ✅ Branded type validation (ProjectId, ChapterId, etc.)
- ✅ Utility type guards for common checks
- ✅ Type assertion helpers with custom error messages
- ✅ Enum validation utilities

### 3. Utility Types (`utils.ts`)

Advanced TypeScript patterns and helpers:

```typescript
import { RequireKeys, OptionalKeys, DeepPartial } from './utils';

// Make specific keys required
type ProjectWithTitle = RequireKeys<Project, 'title' | 'id'>;

// Deep partial for complex updates
type ProjectUpdate = DeepPartial<Project>;

// Branded types for enhanced safety
type ProjectId = Brand<string, 'ProjectId'>;
```

**Key Features:**
- ✅ Advanced utility types (RequireKeys, OptionalKeys, etc.)
- ✅ Branded types for enhanced type safety
- ✅ API response and state management types
- ✅ Component prop utilities
- ✅ Event system types

### 4. Validation Service (`../lib/validation.ts`)

High-level validation with business logic:

```typescript
import { validationService, validate } from '../lib/validation';

// Create project with full validation
const result = validationService.validateCreateProject(formData);
if (result.success) {
  // Complete project with all defaults applied
  const project = result.data;
}

// Quick validation helpers
const projectResult = validate.project(data);
const chapterResult = validate.chapter(data);
```

**Key Features:**
- ✅ Business logic validation beyond schema checks
- ✅ Project integrity validation
- ✅ Content sanitization and formatting
- ✅ Analytics calculation
- ✅ Convenience functions for common operations

## 🚀 Usage Examples

### Creating a New Project

```typescript
import { 
  type CreateProject, 
  validationService,
  CreateProjectSchema 
} from '@/types';

const formData: CreateProject = {
  title: 'My Novel',
  style: 'Science Fiction',
  idea: 'A story about space exploration...',
  genre: ['science_fiction', 'adventure'],
  targetAudience: 'adult',
  language: 'en',
  targetWordCount: 75000
};

// Validate and create project
const result = validationService.validateCreateProject(formData);
if (result.success) {
  // result.data is a complete Project with all defaults
  await saveProject(result.data);
}
```

### Validating Chapters

```typescript
import { type Chapter, validate } from '@/types';

const chapterData = {
  id: 'proj_123_ch_manual_456',
  title: 'Chapter 1',
  content: 'Chapter content...',
  // ... other fields
};

const result = validate.chapter(chapterData, 'proj_123');
if (result.success) {
  // Type-safe chapter operations
  updateChapter(result.data);
}
```

### Runtime Type Checking

```typescript
import { isProject, isChapter } from '@/types';

function processData(data: unknown) {
  if (isProject(data)) {
    // TypeScript knows data is Project
    console.log(`Project: ${data.title}`);
    data.chapters.forEach(chapter => {
      // chapter is typed as Chapter
      console.log(`Chapter: ${chapter.title}`);
    });
  }
}
```

### Component Integration

```typescript
import React from 'react';
import { type Project, type UpdateProject, validate } from '@/types';

interface ProjectEditorProps {
  project: Project;
  onUpdate: (updates: UpdateProject) => void;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onUpdate }) => {
  const handleTitleChange = (title: string) => {
    const updates = { title };
    const result = validate.updateProject(updates);
    
    if (result.success) {
      onUpdate(result.data);
    }
  };
  
  // Component implementation...
};
```

## 🧪 Testing

Comprehensive test suite covering all aspects:

```bash
# Run all type-related tests
npm test src/types
npm test src/lib/validation.test.ts

# Type checking
npx tsc --noEmit
```

**Test Coverage:**
- ✅ Schema validation with edge cases
- ✅ Type guard accuracy
- ✅ Business logic validation
- ✅ Error handling and messages
- ✅ Integration scenarios

## 🔍 Type Safety Features

### 1. Branded Types

Enhanced type safety for IDs and special values:

```typescript
// These prevent mixing up different types of IDs
type ProjectId = Brand<string, 'ProjectId'>;
type ChapterId = Brand<string, 'ChapterId'>;

// Compiler prevents this error:
function loadChapter(chapterId: ChapterId) { /* ... */ }
const projectId: ProjectId = 'proj_123';
loadChapter(projectId); // ❌ Type error!
```

### 2. Exhaustive Enum Checking

```typescript
function getStyleColor(style: WritingStyle): string {
  switch (style) {
    case 'Science Fiction':
      return 'blue';
    case 'Fantasy':
      return 'purple';
    // ❌ TypeScript error if any style is missing
    default:
      const _exhaustive: never = style;
      throw new Error(`Unhandled style: ${style}`);
  }
}
```

### 3. Conditional Types

```typescript
// Different return types based on input
type ApiResult<T> = T extends Project 
  ? { project: T; chapters: Chapter[] }
  : { error: string };
```

### 4. Template Literal Types

```typescript
// Type-safe ID patterns
type ProjectId = `proj_${number}`;
type ChapterId = `${ProjectId}_ch_${string}_${number}`;
```

## 📚 Best Practices

### 1. Always Validate External Data

```typescript
// ❌ Don't trust external data
function processProject(data: any) {
  return data.title.toUpperCase(); // Runtime error if title is undefined
}

// ✅ Always validate first
function processProject(data: unknown) {
  const result = validate.project(data);
  if (result.success) {
    return result.data.title.toUpperCase(); // Type-safe!
  }
  throw new Error('Invalid project data');
}
```

### 2. Use Type Guards for Unknown Data

```typescript
// ❌ Type assertions are dangerous
const project = data as Project;

// ✅ Use type guards instead
if (isProject(data)) {
  // TypeScript knows data is Project
  console.log(data.title);
}
```

### 3. Prefer Validation Service for Business Logic

```typescript
// ❌ Manual validation
if (project.chapters.length !== project.worldState.chaptersCount) {
  throw new Error('Inconsistent chapter count');
}

// ✅ Use validation service
const result = validationService.validateProjectIntegrity(project);
if (!result.success) {
  console.error(result.error, result.issues);
}
```

### 4. Use Branded Types for Important Values

```typescript
// ❌ Plain strings can be mixed up
function deleteProject(id: string) { /* ... */ }
deleteProject('some random string'); // Oops!

// ✅ Branded types prevent mistakes
function deleteProject(id: ProjectId) { /* ... */ }
deleteProject('some random string'); // ❌ Type error!
```

## 🔄 Migration Guide

### From Basic Types to Enhanced System

1. **Update Imports:**
   ```typescript
   // Old
   import { Project, Chapter } from '../types';
   
   // New
   import { type Project, type Chapter, validate } from '@/types';
   ```

2. **Add Validation:**
   ```typescript
   // Old
   function updateProject(data: Project) {
     // Direct usage
   }
   
   // New
   function updateProject(data: unknown) {
     const result = validate.project(data);
     if (result.success) {
       // Type-safe usage
     }
   }
   ```

3. **Use Type Guards:**
   ```typescript
   // Old
   if (data && typeof data === 'object') {
     // Unsafe assumptions
   }
   
   // New
   if (isProject(data)) {
     // Type-safe operations
   }
   ```

## 🎯 Benefits

- **Compile-time Safety**: Catch type errors during development
- **Runtime Validation**: Ensure data integrity at runtime  
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Self-Documenting**: Types serve as living documentation
- **Reduced Bugs**: Prevent common type-related errors
- **Enhanced Developer Experience**: Clear error messages and validation

## 📈 Performance Considerations

- **Schema Validation**: Use sparingly for external data boundaries
- **Type Guards**: Lightweight runtime checks
- **Branded Types**: Zero runtime overhead
- **Validation Caching**: Results can be memoized for repeated validations

This enhanced type system provides a robust foundation for building scalable, maintainable, and type-safe applications while maintaining excellent developer experience.