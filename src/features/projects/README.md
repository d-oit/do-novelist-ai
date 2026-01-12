# Projects Feature

The Projects feature is the foundation of Novelist.ai, providing project
creation, management, and organization capabilities.

## Overview

Every novel in Novelist.ai is a **Project**. This feature handles:

- 📝 **Project Creation** - Create new novel projects with guided wizard
- 📊 **Project Management** - Organize, filter, and search projects
- 🎯 **Project Settings** - Configure project metadata and preferences
- 📈 **Project Statistics** - Track progress and writing metrics
- 🔄 **Project State** - Manage project lifecycle (draft → active → completed)

## Architecture

```
projects/
├── components/              # UI Components
│   ├── ProjectsView.tsx            # Main projects list view
│   ├── ProjectWizard.tsx           # Project creation wizard
│   ├── ProjectDashboard.tsx        # Individual project dashboard
│   ├── ProjectStats.tsx            # Statistics display
│   └── ...
│
├── hooks/                   # React Hooks
│   └── useProjects.ts              # Projects state management
│
├── services/                # Business Logic
│   ├── projectService.ts           # CRUD operations
│   └── db.ts                       # Database queries
│
└── types/                   # TypeScript Types
    └── index.ts                    # Project type definitions
```

## Key Components

### ProjectWizard

Step-by-step wizard for creating new projects.

**Features**:

- Basic information (title, description, genre)
- Advanced options (target word count, AI settings)
- Idea input with AI expansion
- Template selection

**Usage**:

```tsx
import { ProjectWizard } from '@/features/projects';

<ProjectWizard
  onComplete={project => navigate(`/projects/${project.id}`)}
  onCancel={() => navigate('/projects')}
/>;
```

### ProjectsView

Main view for browsing and managing all projects.

**Features**:

- Grid/list view toggle
- Search and filtering
- Sort options (date, title, progress)
- Quick actions (edit, delete, duplicate)

**Usage**:

```tsx
import { ProjectsView } from '@/features/projects';

<ProjectsView />;
```

### ProjectDashboard

Individual project overview and navigation.

**Features**:

- Project statistics
- Recent chapters
- Quick actions
- AI tools access

**Usage**:

```tsx
import { ProjectDashboard } from '@/features/projects';

<ProjectDashboard projectId={projectId} />;
```

## Hooks API

### useProjects

Comprehensive project management hook.

```typescript
const {
  projects, // All projects
  currentProject, // Active project
  isLoading, // Loading state
  error, // Error state

  // Actions
  createProject, // Create new project
  updateProject, // Update existing project
  deleteProject, // Delete project
  selectProject, // Set current project

  // Filtering
  filter, // Current filter settings
  setFilter, // Update filter
  searchQuery, // Search text
  setSearchQuery, // Update search

  // Computed
  filteredProjects, // Filtered and sorted projects
  stats, // Aggregate statistics
} = useProjects();
```

## Services

### projectService

CRUD operations for projects.

```typescript
import { projectService } from '@/features/projects';

// Create
const newProject = await projectService.createProject({
  title: 'My Novel',
  description: 'A story about...',
  genre: 'fantasy',
});

// Read
const project = await projectService.getProject(projectId);
const all = await projectService.getAllProjects();

// Update
await projectService.updateProject(projectId, {
  title: 'Updated Title',
});

// Delete
await projectService.deleteProject(projectId);

// Search
const results = await projectService.searchProjects('fantasy');
```

## Data Flow

```
User Action → Component → useProjects Hook → projectService → Database
                ↓                                               ↓
          State Update ←──────────────────────────────────────
```

## Database Schema

### Projects Table

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  status TEXT NOT NULL,  -- 'draft' | 'active' | 'completed'
  target_word_count INTEGER,
  current_word_count INTEGER DEFAULT 0,
  ai_model_preference TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Project Lifecycle

```
DRAFT → ACTIVE → COMPLETED
  ↓       ↓          ↓
(edit) (writing) (archived)
```

### States

- **DRAFT**: Project created but not actively worked on
- **ACTIVE**: Currently being written
- **COMPLETED**: Finished, archived but accessible

### Transitions

```typescript
// Start writing (draft → active)
await projectService.updateProject(id, { status: 'active' });

// Mark complete (active → completed)
await projectService.updateProject(id, { status: 'completed' });

// Reopen (completed → active)
await projectService.updateProject(id, { status: 'active' });
```

## Testing

### Unit Tests

- `projectService.creation.test.ts` - Project creation
- `projectService.retrieval.test.ts` - Fetching projects
- `projectService.modification.test.ts` - Updates and deletions

### Hook Tests

- `useProjects.crud.test.ts` - CRUD operations
- `useProjects.filtering.test.ts` - Search and filters
- `useProjects.initialization.test.ts` - Initial load
- `useProjects.errors.test.ts` - Error handling

### Component Tests

- `ProjectDashboard.test.tsx` - Dashboard rendering

**Run Tests**:

```bash
# All project tests
npm run test -- projects

# Specific suite
vitest run src/features/projects/hooks/__tests__/useProjects.crud.test.ts
```

## Project Statistics

Tracked metrics for each project:

- **Word Count**: Total words across all chapters
- **Chapter Count**: Number of chapters
- **Character Count**: Defined characters
- **Completion**: Progress toward target word count
- **Last Updated**: Most recent edit timestamp
- **Writing Streak**: Consecutive days written

## Common Use Cases

### Create Project from Template

```typescript
const templateProject = {
  title: 'New Novel',
  genre: 'fantasy',
  target_word_count: 80000,
  ai_model_preference: 'claude-sonnet-4',
};

const project = await projectService.createProject(templateProject);
```

### Bulk Operations

```typescript
// Delete multiple projects
await Promise.all(projectIds.map(id => projectService.deleteProject(id)));

// Update all drafts to active
const drafts = projects.filter(p => p.status === 'draft');
await Promise.all(
  drafts.map(p => projectService.updateProject(p.id, { status: 'active' })),
);
```

### Search and Filter

```typescript
const { filteredProjects, setFilter, setSearchQuery } = useProjects();

// Filter by status
setFilter({ status: 'active' });

// Search by title
setSearchQuery('fantasy');

// Combined
setFilter({ status: 'active', genre: 'sci-fi' });
setSearchQuery('space');
```

## Performance Considerations

- **Lazy Loading**: Project list paginated (20 per page)
- **Debouncing**: Search debounced 300ms
- **Caching**: Projects cached in memory
- **Optimistic Updates**: UI updates immediately, syncs to DB

## Dependencies

**External**:

- `zod` - Schema validation
- `date-fns` - Date formatting

**Internal**:

- `@/lib/database` - Database operations
- `@/lib/validation` - Input validation
- `@/lib/logging` - Error logging

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=file:./novelist.db

# Defaults
DEFAULT_PROJECT_STATUS=draft
DEFAULT_TARGET_WORD_COUNT=80000
```

### Project Defaults

Configured in `projectService.ts`:

```typescript
const DEFAULT_PROJECT: Partial<Project> = {
  status: 'draft',
  target_word_count: 80000,
  current_word_count: 0,
  ai_model_preference: 'claude-sonnet-4',
};
```

## Common Issues & Solutions

### Issue: Projects not loading

**Solution**: Check database connection

```typescript
import { db } from '@/lib/database';
const isConnected = await db.select().from(projects).limit(1);
```

### Issue: Word count not updating

**Solution**: Word count updated by chapter service, ensure chapters are saving
properly

### Issue: Duplicate project IDs

**Solution**: IDs are UUIDs, check for concurrent creation race conditions

## Future Enhancements

- [ ] Project templates library
- [ ] Collaborative projects (multi-user)
- [ ] Project import/export
- [ ] Project versioning/branching
- [ ] Cloud backup integration
- [ ] Project themes/customization

## Related Features

- **Editor** (`src/features/editor`) - Chapter editing
- **Characters** (`src/features/characters`) - Character management
- **Plot Engine** (`src/features/plot-engine`) - Plot analysis
- **Publishing** (`src/features/publishing`) - Export and publish

## Contributing

When modifying the Projects feature:

1. Ensure backward compatibility with existing projects
2. Add comprehensive tests for new functionality
3. Update database migrations if schema changes
4. Follow the established service pattern
5. Update this README with new features

## License

Part of Novelist.ai - See root LICENSE file
