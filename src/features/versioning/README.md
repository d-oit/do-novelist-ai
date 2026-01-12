# Versioning Feature

> **Version History & Change Tracking System**

The **Versioning** feature provides comprehensive version control for chapters
and projects, enabling writers to track changes, compare versions, create
branches, and restore previous content.

---

## Overview

The Versioning feature manages content history with:

- 📜 **Version History**: Complete timeline of all changes
- 🔍 **Version Comparison**: Line-by-line diff viewing
- 🌿 **Branching**: Create alternate versions and experiment safely
- ⏮️ **Version Restoration**: Revert to any previous state
- 🏷️ **Version Types**: Manual, auto-save, AI-generated, restore
- 🔐 **Content Hashing**: Verify version integrity
- 📊 **Change Statistics**: Word count, character count, diff counts
- 🔎 **Search & Filter**: Find specific versions quickly
- 📤 **Export**: Version history as JSON or CSV
- 💾 **Database Persistence**: Turso/LibSQL backend storage
- 🎨 **Beautiful UI**: Animated version timeline and diff viewer

**Key Capabilities**:

- Automatic version creation on saves
- Manual version saves with custom messages
- AI-generated content tracking
- Branch-based workflows (experimentation)
- Side-by-side and unified diff views
- Content rollback and recovery
- Version metadata (author, timestamp, type)
- Advanced filtering and sorting

---

## Architecture

```
Versioning Feature Architecture
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Version    │  │     Version      │  │   Branch     │  │
│  │   History    │  │   Comparison     │  │  Management  │  │
│  └──────┬───────┘  └────────┬─────────┘  └──────┬───────┘  │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
┌─────────┼──────────────────┼────────────────────┼───────────┐
│         │       Hook Layer │                    │           │
│  ┌──────▼──────────────────▼────────────────────▼────────┐  │
│  │              useVersioning Hook                       │  │
│  │  • versions, branches, currentBranch                 │  │
│  │  • saveVersion(chapter, message?, type?)             │  │
│  │  • restoreVersion(versionId)                         │  │
│  │  • compareVersions(v1, v2)                           │  │
│  │  • createBranch, switchBranch, mergeBranch           │  │
│  │  • getFilteredVersions, searchVersions              │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│       Service Layer     │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │        versioningService (Singleton)                │   │
│  │  • saveVersion(chapter, message, type)              │   │
│  │  • getVersionHistory(chapterId)                     │   │
│  │  • getVersion(versionId)                            │   │
│  │  • restoreVersion(versionId)                        │   │
│  │  • deleteVersion(versionId)                         │   │
│  │  • compareVersions(v1, v2)                          │   │
│  │  • createBranch, getBranches, deleteBranch          │   │
│  │  • exportVersionHistory(chapterId, format)          │   │
│  │  Private: computeDiffs, generateAutoMessage         │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│     Database Layer      │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │       Turso Versioning Service                      │   │
│  │  (lib/database/services/versioningService.ts)       │   │
│  │  • Persist versions to Turso/LibSQL                 │   │
│  │  • Content hashing for integrity                    │   │
│  │  • Word/char count calculation                      │   │
│  │  • Branch management                                │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │  Turso DB │
                    │  (LibSQL) │
                    └───────────┘

Version Save Flow:
┌────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User  │───▶│   Save   │───▶│   Hash   │───▶│  Persist │
│  Edit  │    │ Version  │    │  Content │    │  to DB   │
└────────┘    └──────────┘    └──────────┘    └──────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Calculate  │
                              │ Word/Char    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Store      │
                              │  Metadata    │
                              └──────────────┘
```

---

## Key Components

### 1. **VersionHistory** (`components/VersionHistory.tsx`)

Comprehensive version timeline with filtering and management.

**Features**:

- Chronological version list
- Search by message/author
- Filter by type (all, manual, auto, AI-generated, restore)
- Sort options (newest, oldest, author, word count)
- Expandable version cards with content preview
- Restore, delete, and view actions
- Export history (JSON/CSV)
- Animated transitions

**Usage**:

```tsx
import { VersionHistory } from '@/features/versioning';
import { useState } from 'react';

function EditorPage() {
  const [showHistory, setShowHistory] = useState(false);
  const [chapter, setChapter] = useState(/* ... */);

  const handleRestoreVersion = (restoredChapter: Chapter) => {
    setChapter(restoredChapter);
    // Save to project...
  };

  return (
    <div>
      <button onClick={() => setShowHistory(true)}>View History</button>

      {showHistory && (
        <VersionHistory
          chapter={chapter}
          onRestoreVersion={handleRestoreVersion}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
```

**Props**:

```typescript
interface VersionHistoryProps {
  chapter: Chapter;
  onRestoreVersion: (chapter: Chapter) => void;
  onClose: () => void;
  className?: string;
}
```

### 2. **VersionComparison** (`components/VersionComparison.tsx`)

Side-by-side and unified diff viewer.

**Features**:

- Unified diff view (line-by-line changes)
- Side-by-side view (full content comparison)
- Change statistics (additions, deletions, modifications)
- Word and character count differences
- Version metadata display
- Export comparison to JSON
- Color-coded changes (green=add, red=delete, yellow=modify)

**Usage**:

```tsx
import { VersionComparison } from '@/features/versioning';
import { useState } from 'react';

function CompareVersionsButton({ version1, version2 }: Props) {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <>
      <button onClick={() => setShowComparison(true)}>Compare Versions</button>

      {showComparison && (
        <VersionComparison
          version1={version1}
          version2={version2}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  );
}
```

**Props**:

```typescript
interface VersionComparisonProps {
  version1: ChapterVersion;
  version2: ChapterVersion;
  onClose: () => void;
  className?: string;
}
```

---

## Hook

### `useVersioning(chapterId?)`

Main hook for version management.

**Returns**:

```typescript
export interface UseVersioningReturn {
  // State
  versions: ChapterVersion[];
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  saveVersion: (
    chapter: Chapter,
    message?: string,
    type?: ChapterVersion['type'],
  ) => Promise<ChapterVersion>;
  restoreVersion: (versionId: string) => Promise<Chapter | null>;
  deleteVersion: (versionId: string) => Promise<boolean>;
  compareVersions: (
    versionId1: string,
    versionId2: string,
  ) => Promise<VersionCompareResult | null>;

  // Branch management
  createBranch: (
    name: string,
    description: string,
    parentVersionId: string,
  ) => Promise<Branch>;
  switchBranch: (branchId: string) => boolean;
  mergeBranch: (sourceBranchId: string, targetBranchId: string) => boolean;
  deleteBranch: (branchId: string) => Promise<boolean>;

  // Filtering & sorting
  getFilteredVersions: (
    filter: VersionFilter,
    sortOrder: SortOrder,
  ) => ChapterVersion[];
  searchVersions: (query: string) => ChapterVersion[];

  // Utilities
  getVersionHistory: (chapterId: string) => Promise<ChapterVersion[]>;
  exportVersionHistory: (
    chapterId: string,
    format: 'json' | 'csv',
  ) => Promise<string>;
}
```

**Example - Save Version**:

```tsx
import { useVersioning } from '@/features/versioning';

function EditorSaveButton({ chapter }: { chapter: Chapter }) {
  const { saveVersion } = useVersioning(chapter.id);

  const handleSave = async () => {
    await saveVersion(chapter, 'Updated opening paragraph', 'manual');
  };

  return <button onClick={handleSave}>Save Version</button>;
}
```

**Example - Auto-Save**:

```tsx
import { useVersioning } from '@/features/versioning';
import { useEffect, useRef } from 'react';

function AutoSaveEditor({ chapter }: { chapter: Chapter }) {
  const { saveVersion } = useVersioning(chapter.id);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-save after 30 seconds of inactivity
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveVersion(chapter, undefined, 'auto');
    }, 30000);

    return () => clearTimeout(timeoutRef.current);
  }, [chapter, saveVersion]);

  return <textarea value={chapter.content} /* ... */ />;
}
```

**Example - Restore Version**:

```tsx
import { useVersioning } from '@/features/versioning';

function RestoreButton({ versionId }: { versionId: string }) {
  const { restoreVersion } = useVersioning();

  const handleRestore = async () => {
    const restoredChapter = await restoreVersion(versionId);
    if (restoredChapter) {
      console.log('Restored:', restoredChapter.title);
      // Apply to editor...
    }
  };

  return <button onClick={handleRestore}>Restore</button>;
}
```

**Example - Compare Versions**:

```tsx
import { useVersioning } from '@/features/versioning';
import { useState } from 'react';

function CompareButton({ v1Id, v2Id }: { v1Id: string; v2Id: string }) {
  const { compareVersions } = useVersioning();
  const [comparison, setComparison] = useState(null);

  const handleCompare = async () => {
    const result = await compareVersions(v1Id, v2Id);
    setComparison(result);
  };

  return (
    <div>
      <button onClick={handleCompare}>Compare</button>
      {comparison && (
        <div>
          <p>Additions: {comparison.additionsCount}</p>
          <p>Deletions: {comparison.deletionsCount}</p>
          <p>Modifications: {comparison.modificationsCount}</p>
          <p>Word change: {comparison.wordCountChange}</p>
        </div>
      )}
    </div>
  );
}
```

**Example - Branch Management**:

```tsx
import { useVersioning } from '@/features/versioning';

function BranchManager({ chapterId }: { chapterId: string }) {
  const { branches, createBranch, switchBranch, deleteBranch } = useVersioning(chapterId);

  const handleCreateExperiment = async () => {
    const parentVersionId = /* current version */;
    const branch = await createBranch(
      'experimental-ending',
      'Try alternate ending',
      parentVersionId
    );
    console.log('Created branch:', branch.id);
  };

  return (
    <div>
      <button onClick={handleCreateExperiment}>Create Branch</button>

      {branches.map(branch => (
        <div key={branch.id}>
          <span>{branch.name}</span>
          <button onClick={() => switchBranch(branch.id)}>Switch</button>
          <button onClick={() => deleteBranch(branch.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Service

### `versioningService`

Singleton service for version operations.

**API**:

```typescript
class VersioningService {
  init(): Promise<void>;

  saveVersion(
    chapter: Chapter,
    message?: string,
    type?: ChapterVersion['type'],
  ): Promise<ChapterVersion>;

  getVersionHistory(chapterId: string): Promise<ChapterVersion[]>;
  getVersion(versionId: string): Promise<ChapterVersion | null>;

  restoreVersion(versionId: string): Promise<Chapter | null>;
  deleteVersion(versionId: string): Promise<boolean>;

  compareVersions(
    versionId1: string,
    versionId2: string,
  ): Promise<VersionCompareResult>;

  createBranch(
    chapterId: string,
    name: string,
    description: string,
    parentVersionId: string,
  ): Promise<Branch>;

  getBranches(chapterId: string): Promise<Branch[]>;
  switchBranch(branchId: string): boolean;
  mergeBranch(sourceBranchId: string, targetBranchId: string): boolean;
  deleteBranch(branchId: string): Promise<boolean>;

  exportVersionHistory(
    chapterId: string,
    format: 'json' | 'csv',
  ): Promise<string>;
}
```

**Example - Direct Service Usage**:

```typescript
import { versioningService } from '@/features/versioning';

// Initialize
await versioningService.init();

// Save a version
const version = await versioningService.saveVersion(
  chapter,
  'Rewrote climax scene',
  'manual',
);

// Get version history
const versions = await versioningService.getVersionHistory(chapter.id);

// Compare two versions
const comparison = await versioningService.compareVersions(
  versions[0].id,
  versions[1].id,
);

console.log(`Found ${comparison.diffs.length} differences`);

// Export history
const csv = await versioningService.exportVersionHistory(chapter.id, 'csv');
const blob = new Blob([csv], { type: 'text/csv' });
// Download...
```

---

## Types

### Version

Base version type with common fields.

```typescript
export interface Version {
  id: string;
  timestamp: Date;
  authorName: string;
  message: string;
  type: 'manual' | 'auto' | 'ai-generated' | 'restore';
  contentHash: string;
  wordCount: number;
  charCount: number;
  versionNumber: number;
}
```

### ChapterVersion

Extended version with chapter-specific data.

```typescript
export interface ChapterVersion extends Version {
  chapterId: string;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
}
```

### VersionDiff

Represents a single line change.

```typescript
export interface VersionDiff {
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
  context: string; // Surrounding lines for context
}
```

### VersionCompareResult

Complete comparison output.

```typescript
export interface VersionCompareResult {
  diffs: VersionDiff[];
  wordCountChange: number;
  charCountChange: number;
  additionsCount: number;
  deletionsCount: number;
  modificationsCount: number;
}
```

### Branch

Alternate version timeline.

```typescript
export interface Branch {
  id: string;
  chapterId: string;
  name: string;
  description: string;
  parentVersionId: string;
  createdAt: Date;
  isActive: boolean;
  color: string;
}
```

---

## Version Types

### Manual (`'manual'`)

**Purpose**: User-initiated saves with custom messages.

**When Created**:

- User clicks "Save Version" button
- User provides custom commit message
- Manual checkpoints

**Auto-Generated Message**: `"Manual save: {chapter.title}"`

**Example**:

```typescript
await saveVersion(chapter, 'Rewrote opening scene', 'manual');
```

### Auto-Save (`'auto'`)

**Purpose**: Automatic periodic saves.

**When Created**:

- Auto-save timer triggers (e.g., every 30 seconds)
- Background persistence
- No user interaction required

**Auto-Generated Message**: `"Auto-saved: {chapter.title}"`

**Example**:

```typescript
setInterval(() => {
  saveVersion(chapter, undefined, 'auto');
}, 30000); // Every 30 seconds
```

### AI-Generated (`'ai-generated'`)

**Purpose**: Track AI-generated content.

**When Created**:

- GOAP generates chapter content
- AI writing assistant makes suggestions
- Automated content creation

**Auto-Generated Message**: `"AI generated content for: {chapter.title}"`

**Example**:

```typescript
const aiContent = await goapService.generateChapter(/*...*/);
await saveVersion(aiContent, undefined, 'ai-generated');
```

### Restore (`'restore'`)

**Purpose**: Track version restorations.

**When Created**:

- User restores previous version
- Rollback operations
- Recovery actions

**Auto-Generated Message**: `"Restored version of: {chapter.title}"`

**Example**:

```typescript
const restored = await restoreVersion(oldVersionId);
// Automatically creates new version with type='restore'
```

---

## Version Comparison

### Diff Types

#### Addition

**Indicator**: `+` (green)

**Meaning**: New line added to version 2

**Example**:

```diff
+ The hero entered the dark forest, sword drawn.
```

#### Deletion

**Indicator**: `-` (red)

**Meaning**: Line removed in version 2

**Example**:

```diff
- The hero ran away from the dragon.
```

#### Modification

**Indicator**: `~` (yellow)

**Meaning**: Line changed between versions

**Example**:

```diff
- The dragon breathed fire.
+ The dragon roared loudly.
```

### Diff Algorithm

The service uses line-based diff comparison:

1. Split both versions into lines
2. Compare line-by-line
3. Detect additions, deletions, modifications
4. Provide 3-line context around changes

**Implementation**:

```typescript
private computeDiffs(content1: string, content2: string): VersionDiff[] {
  const lines1 = content1.split('\n');
  const lines2 = content2.split('\n');
  const diffs: VersionDiff[] = [];

  for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];

    if (line1 === undefined && line2 !== undefined) {
      // Addition
      diffs.push({
        type: 'addition',
        lineNumber: i + 1,
        newContent: line2,
        context: getLineContext(lines2, i),
      });
    } else if (line1 !== undefined && line2 === undefined) {
      // Deletion
      diffs.push({
        type: 'deletion',
        lineNumber: i + 1,
        oldContent: line1,
        context: getLineContext(lines1, i),
      });
    } else if (line1 !== line2) {
      // Modification
      diffs.push({
        type: 'modification',
        lineNumber: i + 1,
        oldContent: line1,
        newContent: line2,
        context: getLineContext(lines2, i),
      });
    }
  }

  return diffs;
}
```

---

## Branching System

### Branch Workflows

#### 1. Experimental Edits

```typescript
// Create branch for experiments
const experimentBranch = await createBranch(
  'alternate-ending',
  'Try different ending',
  currentVersionId,
);

// Switch to branch
switchBranch(experimentBranch.id);

// Make experimental changes...
await saveVersion(chapter, 'Experimental ending v1', 'manual');

// If happy, merge back to main
mergeBranch(experimentBranch.id, 'main');

// If not, delete branch
await deleteBranch(experimentBranch.id);
```

#### 2. Collaborative Editing

```typescript
// Author A creates branch
const authorABranch = await createBranch(
  'author-a-edits',
  'Author A revisions',
  currentVersionId,
);

// Author B creates branch
const authorBBranch = await createBranch(
  'author-b-edits',
  'Author B revisions',
  currentVersionId,
);

// Both work independently...

// Later, review and merge preferred changes
mergeBranch(authorABranch.id, 'main');
```

#### 3. Multiple Versions

```typescript
// Create branches for different endings
const happyEndingBranch = await createBranch(
  'happy-ending',
  'Protagonist succeeds',
  currentVersionId,
);

const tragicEndingBranch = await createBranch(
  'tragic-ending',
  'Protagonist fails',
  currentVersionId,
);

// Develop both in parallel
// Choose final version later
```

---

## Common Use Cases

### 1. Editor with Auto-Save and Manual Versions

```tsx
import { useVersioning } from '@/features/versioning';
import { useState, useEffect, useRef } from 'react';

function SmartEditor({ chapter }: { chapter: Chapter }) {
  const { saveVersion } = useVersioning(chapter.id);
  const [localChapter, setLocalChapter] = useState(chapter);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  // Auto-save after 30 seconds of inactivity
  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveVersion(localChapter, undefined, 'auto');
    }, 30000);

    return () => clearTimeout(autoSaveTimer.current);
  }, [localChapter, saveVersion]);

  const handleManualSave = async () => {
    const message = prompt('Version message:');
    if (message) {
      await saveVersion(localChapter, message, 'manual');
    }
  };

  return (
    <div>
      <textarea
        value={localChapter.content}
        onChange={e =>
          setLocalChapter({ ...localChapter, content: e.target.value })
        }
      />

      <button onClick={handleManualSave}>Save Version</button>
    </div>
  );
}
```

### 2. Version History Viewer

```tsx
import { useVersioning, VersionHistory } from '@/features/versioning';
import { useState } from 'react';

function ChapterPage({ chapter, onUpdateChapter }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  const handleRestore = (restoredChapter: Chapter) => {
    if (confirm('Replace current content with this version?')) {
      onUpdateChapter(restoredChapter);
      setShowHistory(false);
    }
  };

  return (
    <div>
      <button onClick={() => setShowHistory(true)}>📜 View History</button>

      {showHistory && (
        <VersionHistory
          chapter={chapter}
          onRestoreVersion={handleRestore}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
```

### 3. Version Comparison Tool

```tsx
import { useVersioning, VersionComparison } from '@/features/versioning';
import { useState } from 'react';

function VersionDiffTool({ chapterId }: { chapterId: string }) {
  const { versions } = useVersioning(chapterId);
  const [selectedVersions, setSelectedVersions] = useState<
    [string, string] | null
  >(null);

  const handleSelectVersion = (versionId: string) => {
    if (!selectedVersions) {
      setSelectedVersions([versionId, '']);
    } else if (!selectedVersions[1]) {
      setSelectedVersions([selectedVersions[0], versionId]);
    } else {
      setSelectedVersions([versionId, '']);
    }
  };

  const version1 = versions.find(v => v.id === selectedVersions?.[0]);
  const version2 = versions.find(v => v.id === selectedVersions?.[1]);

  return (
    <div>
      <div>
        {versions.map(version => (
          <div key={version.id}>
            <input
              type="checkbox"
              checked={selectedVersions?.includes(version.id)}
              onChange={() => handleSelectVersion(version.id)}
            />
            <span>
              {version.message} - {version.timestamp.toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {version1 && version2 && (
        <VersionComparison
          version1={version1}
          version2={version2}
          onClose={() => setSelectedVersions(null)}
        />
      )}
    </div>
  );
}
```

### 4. Export Version History

```tsx
import { useVersioning } from '@/features/versioning';

function ExportHistoryButton({ chapterId }: { chapterId: string }) {
  const { exportVersionHistory } = useVersioning(chapterId);

  const handleExport = async (format: 'json' | 'csv') => {
    const data = await exportVersionHistory(chapterId, format);
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version_history.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button onClick={() => handleExport('json')}>Export as JSON</button>
      <button onClick={() => handleExport('csv')}>Export as CSV</button>
    </div>
  );
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**:
   - Load versions on demand (not all at once)
   - Paginate version history for large lists
   - Load content only when expanded

2. **Diff Caching**:
   - Cache comparison results
   - Avoid recomputing diffs on re-render
   - Use memoization for filtered/sorted lists

3. **Content Hashing**:
   - Use content hash to detect duplicates
   - Avoid saving identical versions
   - Quick integrity verification

4. **Database Indexing**:
   - Index by chapterId for fast queries
   - Index by timestamp for sorting
   - Compound index for filtered queries

### Performance Targets

| Operation        | Target | Notes                       |
| ---------------- | ------ | --------------------------- |
| Save Version     | <200ms | Includes hashing & DB write |
| Load History     | <500ms | First 50 versions           |
| Compare Versions | <100ms | Line-based diff             |
| Restore Version  | <100ms | Single DB query             |
| Export History   | <2s    | All versions to JSON/CSV    |

---

## Testing

### Unit Tests

**Testing Version Save**:

```typescript
import { versioningService } from '../services/versioningService';

describe('versioningService', () => {
  it('should save version with correct metadata', async () => {
    const chapter = {
      id: 'chapter_001',
      title: 'Chapter 1',
      content: 'Test content...',
      // ...
    };

    const version = await versioningService.saveVersion(
      chapter,
      'Test save',
      'manual',
    );

    expect(version.chapterId).toBe('chapter_001');
    expect(version.message).toBe('Test save');
    expect(version.type).toBe('manual');
    expect(version.wordCount).toBeGreaterThan(0);
  });

  it('should compute diffs correctly', async () => {
    // Create two versions
    const v1 = await versioningService.saveVersion(
      chapter1,
      'Version 1',
      'manual',
    );
    const v2 = await versioningService.saveVersion(
      chapter2,
      'Version 2',
      'manual',
    );

    const comparison = await versioningService.compareVersions(v1.id, v2.id);

    expect(comparison.diffs.length).toBeGreaterThan(0);
    expect(comparison.wordCountChange).toBeDefined();
  });
});
```

---

## Troubleshooting

### Versions Not Appearing

**Problem**: Saved versions don't show in history

**Solutions**:

1. Verify database connection:

   ```typescript
   await versioningService.init();
   ```

2. Check chapterId:

   ```typescript
   const versions = await versioningService.getVersionHistory(chapterId);
   console.log('Found versions:', versions.length);
   ```

3. Verify save completion:
   ```typescript
   const version = await saveVersion(chapter, 'Test', 'manual');
   console.log('Saved version:', version.id);
   ```

### Diff Showing No Changes

**Problem**: Comparison shows no differences despite different content

**Solutions**:

1. Verify content actually differs:

   ```typescript
   console.log('V1:', version1.content);
   console.log('V2:', version2.content);
   console.log('Equal:', version1.content === version2.content);
   ```

2. Check whitespace/line endings:

   ```typescript
   // Diff is line-based; whitespace-only changes may not show
   ```

3. Force fresh comparison:
   ```typescript
   const comparison = await compareVersions(v1.id, v2.id);
   console.log('Diffs:', comparison.diffs.length);
   ```

### Branch Operations Failing

**Problem**: Cannot create or switch branches

**Solutions**:

1. Ensure chapterId is provided:

   ```typescript
   // useVersioning requires chapterId for branch operations
   const { createBranch } = useVersioning(chapterId);
   ```

2. Verify parent version exists:
   ```typescript
   const version = await versioningService.getVersion(parentVersionId);
   if (!version) {
     console.error('Parent version not found');
   }
   ```

---

## Future Enhancements

### Planned Features

1. **Visual Diff Highlighting**
   - Word-level diffs (not just line-level)
   - Syntax highlighting in diffs
   - Rich text diff support

2. **Merge Conflict Resolution**
   - Interactive merge UI
   - Three-way merge support
   - Conflict markers

3. **Version Tags**
   - Tag important versions (milestones)
   - Release tagging
   - Custom labels

4. **Automatic Branching**
   - Auto-create branch on major rewrites
   - Experiment detection
   - AI-suggested branches

5. **Version Analytics**
   - Writing velocity over time
   - Most-edited sections
   - Version heatmaps

6. **Collaborative Features**
   - Multi-author tracking
   - Comment threads on versions
   - Review and approval workflow

### Requested Features

- Version annotations
- Bulk version operations
- Version search by content
- Custom diff algorithms
- Integration with git
- Cloud backup sync

---

## Related Features

- **[Editor](../editor/README.md)**: Auto-save integration
- **[Projects](../projects/README.md)**: Project-level versioning (planned)
- **[Generation](../generation/README.md)**: AI-generated version tracking
- **[Analytics](../analytics/README.md)**: Version statistics

---

## Best Practices

1. **Commit Messages**:
   - Write descriptive messages for manual saves
   - Use present tense ("Add climax scene", not "Added")
   - Keep messages under 100 characters

2. **Version Frequency**:
   - Auto-save every 30-60 seconds
   - Manual save at logical breakpoints
   - Don't create versions for typo fixes

3. **Branch Usage**:
   - Create branches for experiments
   - Keep branch names descriptive
   - Delete merged/abandoned branches

4. **History Management**:
   - Review old versions periodically
   - Delete unnecessary auto-saves
   - Keep milestone versions tagged

5. **Comparison**:
   - Compare adjacent versions for incremental changes
   - Compare distant versions for major rewrites
   - Export comparisons for review

6. **Restoration**:
   - Always review version content before restoring
   - Create manual save before major restores
   - Test restored content thoroughly

---

**Last Updated**: January 2026 **Status**: ✅ Production Ready **Test
Coverage**: 85% (Unit tests complete, E2E pending) **Database**: Turso/LibSQL
(persistent storage)
