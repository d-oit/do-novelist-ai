# World Building Feature

The World Building feature provides comprehensive tools for creating and
managing fictional worlds, including locations, cultures, lore, timelines, and
consistency tracking.

## Overview

The World Building feature helps authors:

- 🗺️ **Locations** - Create and organize geographic locations and settings
- 🏛️ **Cultures** - Define cultures, customs, and societal structures
- 📚 **Lore** - Document history, mythology, and world rules
- 🗓️ **Timeline** - Track historical events and world chronology
- 🔗 **Relationships** - Map connections between world elements
- ✅ **Consistency** - Validate world-building consistency across chapters
- 🎨 **Visual Maps** - Create and manage world maps (future)
- 📊 **Research** - Track research sources and references

## Architecture

```
world-building/
├── components/              # UI Components
│   ├── WorldBuildingDashboard.tsx  # Main dashboard
│   ├── WorldElementEditor.tsx      # Create/edit world elements
│   ├── LocationManager.tsx         # Location management
│   └── CultureManager.tsx          # Culture management
│
├── hooks/                   # React Hooks
│   ├── useWorldBuilding.ts         # World building state
│   └── useWorldBuildingValidation.ts # Consistency validation
│
├── services/                # Business Logic
│   ├── worldBuildingService.ts     # CRUD operations
│   └── worldBuildingDb.ts          # Database operations
│
└── types/                   # TypeScript Types
    └── index.ts                    # World building types
```

## Key Components

### WorldBuildingDashboard

Main interface for browsing and managing all world elements.

**Features**:

- Grid and list view toggle
- Filter by element type (location, culture, lore)
- Search across all elements
- Quick stats overview
- Recent edits
- Consistency warnings
- Export world guide

**Usage**:

```tsx
import { WorldBuildingDashboard } from '@/features/world-building';

<WorldBuildingDashboard
  projectId={projectId}
  onElementSelect={element => editElement(element)}
  initialView="grid"
/>;
```

---

### LocationManager

Manage geographic locations and settings.

**Features**:

- Location creation with templates
- Hierarchical organization (continent → country → city)
- Parent-child relationships
- Climate and geography details
- Notable features
- Related characters and chapters
- Location map pins (future)

**Usage**:

```tsx
import { LocationManager } from '@/features/world-building';

<LocationManager
  projectId={projectId}
  onLocationCreate={location => handleCreate(location)}
  showHierarchy={true}
/>;
```

**Location Types**:

- **Continent**: Large landmass
- **Country**: Nation or kingdom
- **Region**: Province or territory
- **City**: Urban settlement
- **Town**: Small settlement
- **Village**: Rural settlement
- **Landmark**: Notable location
- **Building**: Specific structure
- **Natural**: Natural feature (forest, mountain, river)

**Example Location**:

```typescript
const location: Location = {
  id: 'loc-1',
  projectId,
  name: 'Silvermoon City',
  type: 'city',
  parentId: 'region-north', // Hierarchical relationship
  description: 'A bustling port city known for trade',
  geography: 'Coastal, surrounded by cliffs',
  climate: 'Temperate, mild winters',
  population: 50000,
  government: 'Merchant council',
  notableFeatures: ['Grand Harbor', 'Crystal Lighthouse'],
  economy: 'Trade, fishing, shipbuilding',
  culture: ['culture-coastal'],
  charactersFrom: ['char-1', 'char-3'],
  appearInChapters: ['ch2', 'ch5', 'ch8'],
};
```

---

### CultureManager

Define and manage cultures, customs, and societies.

**Features**:

- Culture creation with templates
- Social structure definition
- Customs and traditions
- Language and naming conventions
- Religion and beliefs
- Technology level
- Related locations and characters
- Cultural conflicts

**Usage**:

```tsx
import { CultureManager } from '@/features/world-building';

<CultureManager
  projectId={projectId}
  onCultureCreate={culture => handleCreate(culture)}
/>;
```

**Culture Attributes**:

```typescript
interface Culture {
  id: string;
  projectId: string;
  name: string;
  type: CultureType;  // 'tribal' | 'feudal' | 'democratic' | 'theocratic' | etc.
  description: string;
  socialStructure: {
    classes: string[];
    mobility: 'rigid' | 'moderate' | 'fluid';
    power structure: string;
  };
  customs: {
    greetings: string;
    dining: string;
    ceremonies: string[];
  };
  language: {
    name: string;
    namingPattern: string;
    commonPhrases: Record<string, string>;
  };
  religion: {
    beliefs: string[];
    deities: string[];
    practices: string[];
  };
  technology: {
    level: 'primitive' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'futuristic';
    specializations: string[];
  };
  values: string[];
  locations: string[];  // Location IDs
  characters: string[];  // Character IDs
}
```

---

### WorldElementEditor

Universal editor for creating and editing any world element.

**Features**:

- Type-specific forms (location, culture, lore)
- Rich text editor for descriptions
- Tag management
- Image upload (concept art)
- Related element linking
- Version history
- Consistency checking

**Usage**:

```tsx
import { WorldElementEditor } from '@/features/world-building';

<WorldElementEditor
  elementType="location"
  elementId={elementId} // undefined for new element
  projectId={projectId}
  onSave={element => handleSave(element)}
  onCancel={() => setEditing(false)}
/>;
```

**Supported Element Types**:

- `location` - Geographic location
- `culture` - Cultural group
- `lore` - Historical/mythological entry
- `timeline_event` - Historical event
- `research` - Research note/source

---

## Hooks API

### useWorldBuilding

Comprehensive world-building state management.

```typescript
const {
  // Data
  elements, // All world elements
  locations, // Filtered locations
  cultures, // Filtered cultures
  loreEntries, // Filtered lore
  isLoading, // Loading state
  error, // Error state

  // Filtering
  filters, // Current filters
  setFilters, // Update filters
  filteredElements, // Elements after filtering

  // Actions
  createElement, // Create new element
  updateElement, // Update existing element
  deleteElement, // Delete element
  linkElements, // Create relationship between elements

  // Hierarchy
  getLocationHierarchy, // Get location tree
  getCultureMembers, // Get characters/locations in culture

  // Validation
  validateConsistency, // Check for inconsistencies
  inconsistencies, // Found issues

  // Stats
  stats, // World-building statistics
} = useWorldBuilding(projectId);
```

**Example - Create Location**:

```typescript
const { createElement, getLocationHierarchy } = useWorldBuilding(projectId);

// Create location
const newLocation = await createElement({
  type: 'location',
  name: 'Dragon's Peak',
  locationType: 'mountain',
  parentId: 'region-central',
  description: 'A volcanic mountain home to ancient dragons',
  climate: 'Hot, ash-filled air',
  notableFeatures: ['Active volcano', 'Dragon nests', 'Ancient ruins']
});

// View hierarchy
const hierarchy = await getLocationHierarchy();
console.log(hierarchy);
/*
{
  name: 'World',
  children: [
    {
      name: 'Central Region',
      children: [
        { name: 'Dragon\'s Peak', children: [] }
      ]
    }
  ]
}
*/
```

**Example - Filter Elements**:

```typescript
const { setFilters, filteredElements } = useWorldBuilding(projectId);

// Filter by type
setFilters({ type: 'location' });

// Filter by tags
setFilters({ tags: ['magical', 'dangerous'] });

// Search
setFilters({ search: 'dragon' });

// Combined
setFilters({
  type: 'location',
  tags: ['city'],
  search: 'port',
});
```

---

### useWorldBuildingValidation

Validates world-building consistency.

```typescript
const {
  // Validation
  validate, // Validate elements
  isValid, // Overall validity
  errors, // Validation errors
  warnings, // Non-blocking warnings

  // Consistency
  checkConsistency, // Check across chapters
  inconsistencies, // Found inconsistencies

  // Actions
  fixInconsistency, // Auto-fix if possible
  ignoreInconsistency, // Mark as intentional
  refreshValidation, // Re-run validation
} = useWorldBuildingValidation(projectId);
```

**Example - Check Consistency**:

```typescript
const { checkConsistency, inconsistencies } =
  useWorldBuildingValidation(projectId);

// Check all world-building consistency
await checkConsistency();

// Review issues
inconsistencies.forEach(issue => {
  console.log(`${issue.severity}: ${issue.description}`);
  console.log(`Chapters: ${issue.affectedChapters.join(', ')}`);
  console.log(`Suggestion: ${issue.suggestedFix}`);
});

// Example issues:
// "Warning: Location 'Dragon's Peak' described as cold in Ch3 but hot in Ch7"
// "Error: Character claims to be from 'Silvertown' but no such location exists"
// "Info: Culture 'Dwarves' mentioned but not defined in world-building"
```

---

## Services

### worldBuildingService

CRUD operations for world elements.

```typescript
import { worldBuildingService } from '@/features/world-building';

// Create location
const location = await worldBuildingService.createLocation({
  projectId,
  name: 'Mystic Forest',
  type: 'natural',
  description: 'An enchanted forest...',
});

// Create culture
const culture = await worldBuildingService.createCulture({
  projectId,
  name: 'Forest Elves',
  type: 'tribal',
  description: 'Ancient guardians...',
});

// Create lore entry
const lore = await worldBuildingService.createLore({
  projectId,
  title: 'The Great War',
  category: 'history',
  content: 'A thousand years ago...',
  relatedElements: [location.id, culture.id],
});

// Get all elements
const allElements = await worldBuildingService.getAllElements(projectId);

// Search
const results = await worldBuildingService.searchElements(projectId, 'dragon', {
  types: ['location', 'lore'],
});

// Link elements
await worldBuildingService.linkElements(location.id, culture.id, {
  relationship: 'homeland',
  description: 'Primary dwelling of the Forest Elves',
});
```

---

## Data Flow

```
User Action → Component → useWorldBuilding Hook → worldBuildingService → Database
                ↓                                                           ↓
          Local State ←──────────────────────────────────────────────────
                ↓
        Consistency Check (useWorldBuildingValidation)
                ↓
          Update UI / Show Warnings
```

---

## Database Schema

### World Elements Table

```sql
CREATE TABLE world_elements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'location' | 'culture' | 'lore' | 'timeline_event'
  name TEXT NOT NULL,
  description TEXT,
  data JSON NOT NULL,           -- Type-specific data
  tags TEXT[],
  parent_id TEXT,               -- For hierarchical relationships
  image_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_id) REFERENCES world_elements(id)
);

CREATE INDEX idx_world_elements_type ON world_elements(type);
CREATE INDEX idx_world_elements_project ON world_elements(project_id);
CREATE INDEX idx_world_elements_parent ON world_elements(parent_id);
```

### World Element Relationships Table

```sql
CREATE TABLE world_element_relationships (
  id TEXT PRIMARY KEY,
  element1_id TEXT NOT NULL,
  element2_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,  -- 'contains' | 'part_of' | 'adjacent' | 'conflicts_with'
  description TEXT,
  bidirectional BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (element1_id) REFERENCES world_elements(id),
  FOREIGN KEY (element2_id) REFERENCES world_elements(id)
);
```

### Research Sources Table

```sql
CREATE TABLE research_sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'book' | 'article' | 'website' | 'video' | 'other'
  url TEXT,
  notes TEXT,
  related_elements TEXT[],      -- Array of element IDs
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## World Element Types

### Location Data Structure

```typescript
interface LocationData {
  locationType: LocationType;
  parentId?: string;
  geography?: string;
  climate?: string;
  population?: number;
  government?: string;
  economy?: string;
  notableFeatures?: string[];
  coordinates?: { lat: number; lng: number };
}
```

### Culture Data Structure

```typescript
interface CultureData {
  cultureType: CultureType;
  socialStructure?: {
    classes: string[];
    mobility: string;
    powerStructure: string;
  };
  customs?: Record<string, string>;
  language?: {
    name: string;
    namingPattern: string;
    commonPhrases: Record<string, string>;
  };
  religion?: {
    beliefs: string[];
    deities: string[];
    practices: string[];
  };
  technology?: {
    level: string;
    specializations: string[];
  };
  values?: string[];
}
```

### Lore Data Structure

```typescript
interface LoreData {
  category: 'history' | 'mythology' | 'legend' | 'rules' | 'custom';
  era?: string;
  significance: 'critical' | 'important' | 'minor';
  sources?: string[];
  relatedElements?: string[];
  verified: boolean; // Is this canonical or rumor?
}
```

---

## Location Hierarchy

### Organizing Locations

**Example Hierarchy**:

```
World: Aethoria
├── Continent: Eastern Lands
│   ├── Country: Kingdom of Valor
│   │   ├── Region: Northern Province
│   │   │   ├── City: Silvermoon
│   │   │   ├── Town: Riverdale
│   │   │   └── Village: Oakshire
│   │   └── Region: Southern Province
│   └── Country: Free States
└── Continent: Western Isles
    └── Country: Island Confederation
```

**Benefits**:

- Easy navigation
- Automatic location context
- Distance/travel time calculations
- Map generation (future)

---

## Consistency Checking

### Validation Rules

**Location Consistency**:

- Climate matches geographic description
- Population appropriate for settlement type
- Government type matches technology level
- Economy fits available resources

**Culture Consistency**:

- Technology level appropriate for time period
- Social structure matches government type
- Customs don't contradict values
- Language patterns used consistently in names

**Cross-Chapter Consistency**:

- Location descriptions match across chapters
- Cultural details remain consistent
- Timeline events referenced correctly
- Character origins match defined locations

### Example Validation

```typescript
const issues = await validateConsistency();

// Example issues found:
[
  {
    severity: 'error',
    type: 'missing_reference',
    description:
      'Character "John" claims to be from "Westville" but no such location exists',
    affectedChapters: ['ch3', 'ch7'],
    suggestedFix: 'Create location "Westville" or update character origin',
  },
  {
    severity: 'warning',
    type: 'inconsistent_description',
    description:
      'Silvermoon described as "cold mountain city" in Ch2 but "warm coastal city" in Ch5',
    affectedChapters: ['ch2', 'ch5'],
    suggestedFix: 'Unify description as either mountain or coastal',
  },
  {
    severity: 'info',
    type: 'undefined_culture',
    description:
      'Culture "Mountain Dwarves" mentioned but not defined in world-building',
    affectedChapters: ['ch4'],
    suggestedFix: 'Define "Mountain Dwarves" culture or remove reference',
  },
];
```

---

## Templates

### Location Templates

**Medieval City**:

- Type: City
- Government: Monarchy / Council
- Economy: Trade, Crafts
- Features: Castle, Market Square, City Walls
- Population: 5,000 - 50,000

**Fantasy Forest**:

- Type: Natural
- Climate: Temperate
- Features: Ancient trees, Hidden paths, Magical creatures
- Related Cultures: Elves, Druids

**Space Station** (Sci-Fi):

- Type: Building
- Government: Corporate / Military
- Technology: Advanced
- Features: Docking bays, Hydroponics, Command center

### Culture Templates

**Medieval Kingdom**:

- Type: Feudal
- Social Structure: Nobility, Clergy, Commoners
- Technology: Medieval
- Values: Honor, Duty, Tradition

**Nomadic Tribes**:

- Type: Tribal
- Social Structure: Elder council, Warriors, Gatherers
- Technology: Primitive to Bronze Age
- Values: Freedom, Nature, Family

**Space Civilization**:

- Type: Democratic / Corporate
- Technology: Futuristic
- Values: Progress, Efficiency, Unity

---

## Testing

### Unit Tests

- `worldBuildingService.test.ts` - CRUD operations
- `useWorldBuilding.test.ts` - Hook logic
- `useWorldBuildingValidation.test.ts` - Validation logic

### Integration Tests

- Element relationships
- Hierarchy management
- Consistency checking

**Run Tests**:

```bash
# All world-building tests
npm run test -- world-building

# Specific test
vitest run src/features/world-building/hooks/__tests__/useWorldBuilding.test.ts
```

---

## Performance Considerations

- **Lazy Loading**: World elements loaded on demand
- **Hierarchical Caching**: Parent-child relationships cached
- **Debounced Search**: Search debounced 300ms
- **Image Optimization**: Location images lazy-loaded

---

## Configuration

### Environment Variables

```env
# Image storage (optional)
WORLD_IMAGE_BUCKET=world-building-images
MAX_IMAGE_SIZE_MB=5

# Feature flags
ENABLE_WORLD_MAPS=false  # Future feature
ENABLE_AI_SUGGESTIONS=true
```

### World Building Limits

```typescript
const LIMITS = {
  maxElementsPerProject: 5000,
  maxHierarchyDepth: 10,
  maxRelationshipsPerElement: 100,
  maxTagsPerElement: 20,
  maxDescriptionLength: 10000,
};
```

---

## Common Issues & Solutions

### Issue: Hierarchy too deep

**Solution**: Flatten unnecessary levels

```typescript
// Avoid: World → Continent → Region → Province → District → City → Neighborhood
// Better: World → Continent → Country → City
```

### Issue: Too many loose elements

**Solution**: Organize with parent relationships

```typescript
// Link child to parent
await worldBuildingService.linkElements(childId, parentId, {
  relationship: 'part_of',
});
```

---

## Future Enhancements

- [ ] Visual world map editor
- [ ] Auto-generate location descriptions (AI)
- [ ] Import from real-world geography
- [ ] 3D visualization (future)
- [ ] Weather patterns and seasons
- [ ] Trade routes and travel times
- [ ] Political boundaries and territories
- [ ] Economic simulation
- [ ] Cultural evolution over time
- [ ] Export world guide (PDF/HTML)

---

## Related Features

- **Timeline** (`src/features/timeline`) - Historical events
- **Characters** (`src/features/characters`) - Character origins
- **Plot Engine** (`src/features/plot-engine`) - Plot consistency
- **Semantic Search** (`src/features/semantic-search`) - Find world elements

---

## Contributing

When modifying World Building:

1. Maintain consistency checking integrity
2. Test hierarchy operations thoroughly
3. Validate all input rigorously
4. Consider export/import compatibility
5. Document new element types
6. Add comprehensive tests

---

## License

Part of Novelist.ai - See root LICENSE file
