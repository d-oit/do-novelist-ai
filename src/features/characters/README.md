# Characters Feature

The Characters feature provides comprehensive character management for
novelists, including character creation, relationship tracking, validation, and
development arc monitoring.

## Overview

The Characters feature helps authors:

- 👤 **Create Characters** - Define detailed character profiles
- 🔗 **Track Relationships** - Map character connections and dynamics
- ✅ **Validate Consistency** - Ensure character traits remain consistent
- 📊 **Monitor Development** - Track character arcs and growth
- 🎭 **Manage Roles** - Organize protagonist, antagonist, supporting cast
- 🔍 **Filter & Search** - Find characters by traits, roles, or relationships

## Architecture

```
characters/
├── components/              # UI Components
│   ├── CharacterManager.tsx        # Main character management interface
│   ├── CharacterCard.tsx           # Individual character card
│   ├── CharacterEditor.tsx         # Character creation/editing form
│   ├── CharacterGrid.tsx           # Grid view of all characters
│   ├── CharacterFilters.tsx        # Filter and search controls
│   └── CharacterStats.tsx          # Character statistics display
│
├── hooks/                   # React Hooks
│   ├── useCharacters.ts            # Character state management
│   └── useCharacterValidation.ts   # Validation logic
│
├── services/                # Business Logic
│   └── characterService.ts         # CRUD operations
│
└── types/                   # TypeScript Types
    └── index.ts                    # Character type definitions
```

## Key Components

### CharacterManager

Main interface for browsing and managing all characters.

**Features**:

- Grid and list view toggle
- Search and filtering
- Bulk operations (delete, export)
- Character creation wizard
- Sorting options
- Quick stats overview

**Usage**:

```tsx
import { CharacterManager } from '@/features/characters';

<CharacterManager
  projectId={projectId}
  onCharacterSelect={char => setSelected(char)}
  initialView="grid" // or "list"
/>;
```

---

### CharacterCard

Displays individual character summary.

**Features**:

- Avatar/profile image
- Name and role display
- Key traits summary
- Relationship count
- Quick actions (edit, delete, view)
- Status indicators (active, archived)

**Usage**:

```tsx
import { CharacterCard } from '@/features/characters';

<CharacterCard
  character={character}
  onClick={() => openEditor(character.id)}
  onDelete={() => handleDelete(character.id)}
  showRelationships={true}
/>;
```

---

### CharacterEditor

Form for creating and editing character details.

**Features**:

- Multi-step wizard or single-page form
- Real-time validation
- Image upload for avatar
- Trait management (add/remove)
- Relationship editor
- Character arc planning
- Role assignment
- Notes and backstory

**Usage**:

```tsx
import { CharacterEditor } from '@/features/characters';

<CharacterEditor
  projectId={projectId}
  characterId={characterId} // undefined for new character
  onSave={character => handleSave(character)}
  onCancel={() => setEditing(false)}
  mode="wizard" // or "form"
/>;
```

**Validation Rules**:

- ✅ Name required (1-100 characters)
- ✅ Role required (protagonist, antagonist, supporting, minor)
- ✅ At least one trait for major characters
- ✅ Description recommended (not required)
- ✅ Unique names within project (warning, not blocking)

---

### CharacterGrid

Grid layout for displaying multiple characters.

**Features**:

- Responsive grid (2-6 columns)
- Lazy loading
- Drag-to-reorder
- Multi-select
- Empty state handling
- Loading skeletons

**Usage**:

```tsx
import { CharacterGrid } from '@/features/characters';

<CharacterGrid
  characters={characters}
  onCharacterClick={char => viewDetails(char)}
  columns={4}
  sortBy="name" // or "role", "createdAt"
/>;
```

---

### CharacterFilters

Search and filter controls.

**Features**:

- Text search (name, description, traits)
- Role filter (all, protagonist, antagonist, etc.)
- Trait filter (select multiple)
- Relationship filter
- Sort options
- Clear all filters

**Usage**:

```tsx
import { CharacterFilters } from '@/features/characters';

<CharacterFilters
  filters={filters}
  onFilterChange={newFilters => setFilters(newFilters)}
  availableTraits={uniqueTraits}
  availableRoles={roles}
/>;
```

---

### CharacterStats

Statistical overview of characters.

**Features**:

- Total character count
- Role distribution chart
- Relationship network summary
- Most connected characters
- Character arc completion

**Usage**:

```tsx
import { CharacterStats } from '@/features/characters';

<CharacterStats projectId={projectId} showCharts={true} />;
```

---

## Hooks API

### useCharacters

Comprehensive character management hook.

```typescript
const {
  // Data
  characters,        // All characters
  character,         // Single character (if characterId provided)
  isLoading,         // Loading state
  error,             // Error state

  // Filtering
  filteredCharacters,  // Characters after applying filters
  filters,           // Current filters
  setFilters,        // Update filters
  clearFilters,      // Reset filters

  // Actions
  createCharacter,   // Create new character
  updateCharacter,   // Update existing character
  deleteCharacter,   // Delete character
  bulkDelete,        // Delete multiple characters

  // Relationships
  addRelationship,   // Add character relationship
  removeRelationship, // Remove relationship
  getRelationships,  // Get all relationships for character

  // Validation
  validateCharacter, // Validate character data
  checkConsistency,  // Check for inconsistencies in story

  // Stats
  stats              // Character statistics
} = useCharacters(projectId, characterId?);
```

**Example - Create Character**:

```typescript
const { createCharacter } = useCharacters(projectId);

const newCharacter = await createCharacter({
  name: 'Jane Doe',
  role: 'protagonist',
  description: 'A brave detective...',
  traits: ['intelligent', 'determined', 'empathetic'],
  backstory: 'Grew up in...',
});
```

**Example - Filter Characters**:

```typescript
const { characters, setFilters, filteredCharacters } = useCharacters(projectId);

// Filter by role
setFilters({ role: 'protagonist' });

// Filter by traits
setFilters({ traits: ['brave', 'intelligent'] });

// Search by name
setFilters({ search: 'john' });

// Combined filters
setFilters({
  role: 'supporting',
  traits: ['loyal'],
  search: 'guard',
});

console.log('Filtered:', filteredCharacters);
```

---

### useCharacterValidation

Validates character consistency and provides warnings.

```typescript
const {
  // Validation
  validate, // Validate character data
  isValid, // Overall validity
  errors, // Validation errors
  warnings, // Non-blocking warnings

  // Consistency Checking
  checkConsistency, // Check character across chapters
  inconsistencies, // Found inconsistencies

  // Actions
  clearValidation, // Clear validation state
  refreshValidation, // Re-run validation
} = useCharacterValidation(characterId);
```

**Example - Validate Character**:

```typescript
const { validate, isValid, errors } = useCharacterValidation(characterId);

const result = await validate({
  name: 'John',
  role: 'protagonist',
  traits: ['brave', 'contradictory-trait'],
  description: '',
});

if (!isValid) {
  console.log('Errors:', errors);
  // [{ field: 'description', message: 'Description recommended for protagonist' }]
}
```

**Example - Check Consistency**:

```typescript
const { checkConsistency, inconsistencies } =
  useCharacterValidation(characterId);

await checkConsistency();

// Find where character behavior doesn't match defined traits
if (inconsistencies.length > 0) {
  inconsistencies.forEach(issue => {
    console.log(`Chapter ${issue.chapterId}: ${issue.description}`);
    // "Chapter 5: Character acts cowardly despite 'brave' trait"
  });
}
```

---

## Services

### characterService

CRUD operations for characters.

```typescript
import { characterService } from '@/features/characters';

// Create
const character = await characterService.createCharacter({
  projectId,
  name: 'Alice',
  role: 'protagonist',
  traits: ['brave', 'intelligent'],
});

// Read
const char = await characterService.getCharacter(characterId);
const all = await characterService.getCharacters(projectId);

// Update
await characterService.updateCharacter(characterId, {
  traits: ['brave', 'intelligent', 'compassionate'],
});

// Delete
await characterService.deleteCharacter(characterId);

// Relationships
await characterService.addRelationship({
  character1Id: 'alice-id',
  character2Id: 'bob-id',
  type: 'friend',
  description: 'Close childhood friends',
});

// Search
const results = await characterService.searchCharacters(projectId, 'detective');
```

---

## Data Flow

```
User Action → Component → useCharacters Hook → characterService → Database
                ↓                                                    ↓
          Local State ←────────────────────────────────────────────
                ↓
        Validation Check (useCharacterValidation)
                ↓
          Update UI
```

---

## Database Schema

### Characters Table

```sql
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,              -- 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  description TEXT,
  backstory TEXT,
  traits JSON,                      -- Array of trait strings
  physical_description TEXT,
  personality TEXT,
  goals JSON,                       -- Array of goal objects
  avatar_url TEXT,
  status TEXT DEFAULT 'active',    -- 'active' | 'archived' | 'dead'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Character Relationships Table

```sql
CREATE TABLE character_relationships (
  id TEXT PRIMARY KEY,
  character1_id TEXT NOT NULL,
  character2_id TEXT NOT NULL,
  type TEXT NOT NULL,              -- 'friend' | 'enemy' | 'family' | 'romantic' | 'rival' | 'mentor'
  description TEXT,
  strength INTEGER DEFAULT 5,      -- 1-10
  is_reciprocal BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (character1_id) REFERENCES characters(id),
  FOREIGN KEY (character2_id) REFERENCES characters(id)
);
```

### Character Arcs Table

```sql
CREATE TABLE character_arcs (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  arc_type TEXT NOT NULL,          -- 'positive' | 'negative' | 'flat' | 'transformation'
  start_state TEXT,
  end_state TEXT,
  key_moments JSON,                -- Array of {chapterId, description}
  completion_percentage INTEGER DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);
```

---

## Character Types

### Character Roles

```typescript
type CharacterRole =
  | 'protagonist' // Main character
  | 'antagonist' // Primary opposition
  | 'supporting' // Secondary important characters
  | 'minor'; // Background characters

interface Character {
  id: string;
  projectId: string;
  name: string;
  role: CharacterRole;
  description?: string;
  backstory?: string;
  traits: string[];
  physicalDescription?: string;
  personality?: string;
  goals?: CharacterGoal[];
  avatarUrl?: string;
  status: 'active' | 'archived' | 'dead';
  createdAt: number;
  updatedAt: number;
}
```

### Character Traits

Common trait categories:

- **Personality**: brave, shy, confident, anxious, charismatic
- **Intellectual**: intelligent, creative, analytical, curious
- **Moral**: honest, deceitful, loyal, treacherous, compassionate
- **Social**: friendly, aloof, manipulative, empathetic
- **Physical**: strong, agile, clumsy, graceful

### Relationship Types

```typescript
type RelationshipType =
  | 'friend'
  | 'enemy'
  | 'family'
  | 'romantic'
  | 'rival'
  | 'mentor'
  | 'neutral';

interface CharacterRelationship {
  id: string;
  character1Id: string;
  character2Id: string;
  type: RelationshipType;
  description?: string;
  strength: number; // 1-10
  isReciprocal: boolean;
  evolution?: RelationshipEvolution[];
}
```

---

## Character Validation

### Validation Levels

**Errors** (blocking):

- Missing required fields (name, role)
- Invalid data types
- Circular relationships
- Duplicate character names (same project)

**Warnings** (non-blocking):

- Missing description for major characters
- No traits defined
- Contradictory traits
- Unbalanced relationship networks
- Character appears in chapters but not defined

**Consistency Checks**:

- Character behavior matches defined traits
- Relationships reflected in story
- Character arc progression logical
- Physical descriptions consistent

### Example Validation

```typescript
const validation: CharacterValidationResult = {
  isValid: false,
  errors: [{ field: 'name', message: 'Name is required' }],
  warnings: [
    {
      field: 'description',
      message: 'Description recommended for protagonist',
    },
    { field: 'traits', message: 'Consider adding personality traits' },
  ],
  consistencyIssues: [
    {
      chapterId: 'ch5',
      issue: 'Character acts cowardly despite "brave" trait',
      severity: 'moderate',
    },
  ],
};
```

---

## Character Arc Types

### Positive Change Arc

Character overcomes flaws and grows.

- **Start**: Flawed but sympathetic
- **Middle**: Trials and challenges
- **End**: Improved, achieved goals

### Negative Change Arc

Character's flaws consume them.

- **Start**: Flawed character
- **Middle**: Poor choices compound
- **End**: Tragic fall or corruption

### Flat Arc

Character stays consistent, changes world.

- **Start**: Already complete values
- **Middle**: Tests these values
- **End**: Influences others

### Transformation Arc

Complete character reinvention.

- **Start**: One identity
- **Middle**: Identity crisis
- **End**: New self emerged

---

## Testing

### Unit Tests

- `useCharacters.test.ts` - Character management hook
- `characterService.test.ts` - CRUD operations
- `useCharacterValidation.test.ts` - Validation logic

### Component Tests

- `CharacterCard.test.tsx` - Character card rendering
- `CharacterEditor.test.tsx` - Form validation and submission
- `CharacterManager.test.tsx` - Character list interactions

**Run Tests**:

```bash
# All character tests
npm run test -- characters

# Specific test
vitest run src/features/characters/hooks/__tests__/useCharacters.test.ts
```

---

## Common Use Cases

### Create Protagonist

```typescript
const { createCharacter } = useCharacters(projectId);

await createCharacter({
  name: 'Emma Stone',
  role: 'protagonist',
  description: 'A determined archaeologist',
  traits: ['intelligent', 'brave', 'curious', 'stubborn'],
  goals: [
    { description: 'Find the lost temple', status: 'in_progress' },
    { description: 'Prove her theory', status: 'pending' },
  ],
  backstory: 'Lost her mentor in a previous expedition...',
});
```

### Add Relationship

```typescript
const { addRelationship } = useCharacters(projectId);

await addRelationship({
  character1Id: emmaId,
  character2Id: johnId,
  type: 'romantic',
  description: 'Childhood friends who reconnect',
  strength: 7,
  isReciprocal: true,
});
```

### Track Character Arc

```typescript
const arc: CharacterArc = {
  characterId: emmaId,
  arcType: 'positive',
  startState: 'Insecure about her abilities',
  endState: 'Confident leader',
  keyMoments: [
    { chapterId: 'ch3', description: 'First major discovery' },
    { chapterId: 'ch7', description: 'Saves team from disaster' },
    { chapterId: 'ch12', description: "Confronts mentor's death" },
  ],
  completionPercentage: 60,
};
```

---

## Performance Considerations

- **Lazy Loading**: Character list virtualized for large casts
- **Debounced Search**: Search input debounced 300ms
- **Cached Relationships**: Relationship network cached
- **Image Optimization**: Avatar images compressed and cached

---

## Configuration

### Environment Variables

```env
# Image upload (optional)
CHARACTER_AVATAR_BUCKET=character-avatars
MAX_AVATAR_SIZE_MB=2

# Validation
STRICT_CHARACTER_VALIDATION=false
```

### Character Limits

```typescript
const LIMITS = {
  maxCharactersPerProject: 1000,
  maxTraitsPerCharacter: 20,
  maxRelationshipsPerCharacter: 50,
  maxNameLength: 100,
  maxDescriptionLength: 5000,
};
```

---

## Common Issues & Solutions

### Issue: Character relationships not showing

**Solution**: Ensure relationship is created with valid character IDs

```typescript
const { getRelationships } = useCharacters(projectId);
const relationships = await getRelationships(characterId);
console.log('Relationships:', relationships);
```

### Issue: Validation warnings persist

**Solution**: Update character with recommended fields

```typescript
await updateCharacter(characterId, {
  description: 'Updated description',
  traits: ['brave', 'intelligent'],
});
```

---

## Future Enhancements

- [ ] Character voice consistency analysis (AI-powered)
- [ ] Character templates library
- [ ] Relationship timeline visualization
- [ ] Character interview generator (AI questions)
- [ ] Character comparison tool
- [ ] Export character sheets (PDF)
- [ ] Character mood tracking across chapters
- [ ] Voice actor casting suggestions

---

## Related Features

- **Plot Engine** (`src/features/plot-engine`) - Character relationship graph
- **Editor** (`src/features/editor`) - Character mentions in chapters
- **Semantic Search** (`src/features/semantic-search`) - Find character
  references
- **World Building** (`src/features/world-building`) - Character origins and
  locations

---

## Contributing

When modifying Characters:

1. Maintain backward compatibility with existing characters
2. Validate all input rigorously
3. Test relationship integrity
4. Consider character export/import compatibility
5. Update validation rules carefully
6. Add comprehensive tests

---

## License

Part of Novelist.ai - See root LICENSE file
