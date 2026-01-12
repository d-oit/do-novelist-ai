# Timeline Feature

> **Chronological Event Tracking & Story Organization**

The **Timeline** feature provides visual chronological event management for
stories, enabling writers to track plot events, character appearances, and
narrative structure across the entire project.

---

## Overview

The Timeline feature manages story chronology with:

- 📅 **Event Tracking**: Chronological organization of story events
- 🎯 **Importance Levels**: Major, minor, and background events
- 👥 **Character Involvement**: Track which characters appear in each event
- 📍 **Location Mapping**: Link events to world-building locations
- 🏷️ **Tags & Categories**: Flexible event categorization
- 🕰️ **Eras**: Define time periods and historical ages
- 🔍 **Zoom Controls**: Scale timeline view from macro to detailed
- 📊 **View Modes**: Chronological or narrative ordering
- 🎨 **Visual Interface**: Interactive horizontal timeline rail
- 💾 **Persistent State**: Zustand store with automatic persistence
- 🔗 **Chapter Integration**: Link events to specific chapters

**Key Capabilities**:

- Visual event organization on interactive timeline
- Drag-and-drop event reordering (planned)
- Alternating event cards (top/bottom of rail)
- Real-time synchronization with project data
- Era highlighting and visualization
- Event importance badges
- Character and location metadata

---

## Architecture

```
Timeline Feature Architecture
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  TimelineView   │  │ TimelineCanvas   │  │ EventNode  │ │
│  │  (Main UI)      │  │  (Rail Display)  │  │  (Card)    │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────┬─────┘ │
└───────────┼────────────────────┼────────────────────┼───────┘
            │                    │                    │
┌───────────┼────────────────────┼────────────────────┼───────┐
│           │        State Management Layer           │       │
│  ┌────────▼────────────────────▼────────────────────▼────┐  │
│  │          useTimelineStore (Zustand Store)           │  │
│  │  • timeline: Timeline | null                        │  │
│  │  • selectedEventId: string | null                   │  │
│  │  • isDragging: boolean                              │  │
│  │                                                      │  │
│  │  Event Actions:                                     │  │
│  │  • addEvent, updateEvent, removeEvent               │  │
│  │  • reorderEvent                                     │  │
│  │                                                      │  │
│  │  Era Actions:                                       │  │
│  │  • addEra, updateEra, removeEra                     │  │
│  │                                                      │  │
│  │  Selection:                                         │  │
│  │  • selectEvent                                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│         Data Layer      │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Project Timeline                       │   │
│  │  • Embedded in Project entity                       │   │
│  │  • Synced bidirectionally with store                │   │
│  │  • Persisted via project save                       │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│     Validation Layer    │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │         Zod Schemas (types/schemas.ts)              │   │
│  │  • TimelineEventSchema                              │   │
│  │  • TimelineEraSchema                                │   │
│  │  • TimelineSchema                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Data Flow: Event Timeline
┌────────────┐     ┌──────────────┐     ┌────────────┐
│ TimelineUI │────▶│ useTimeline  │────▶│  Project   │
│            │◀────│    Store     │◀────│            │
└────────────┘     └──────────────┘     └────────────┘
     │                    │                    │
     │                    │                    │
     ▼                    ▼                    ▼
  Display            State Mgmt          Persistence
```

---

## Key Components

### 1. **TimelineView** (`components/TimelineView.tsx`)

Main timeline interface with toolbar and canvas.

**Features**:

- Project timeline synchronization
- Zoom controls (standard/compact presets)
- Add event button
- Timeline canvas display
- Real-time project updates

**Usage**:

```tsx
import { TimelineView } from '@/features/timeline';
import { useState } from 'react';

function ProjectPage() {
  const [project, setProject] = useState(/* ... */);

  const handleUpdateProject = updates => {
    setProject(prev => ({ ...prev, ...updates }));
    // Save to database...
  };

  return (
    <TimelineView project={project} onUpdateProject={handleUpdateProject} />
  );
}
```

**Props**:

```typescript
interface TimelineViewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}
```

### 2. **TimelineCanvas** (`components/TimelineCanvas.tsx`)

Visual timeline rail with interactive event nodes.

**Features**:

- Horizontal scrollable rail
- Chronological event sorting
- Alternating event positioning (top/bottom)
- Rail connection dots
- Add event placeholder
- Framer Motion animations

**Usage**:

```tsx
import { TimelineCanvas } from '@/features/timeline';

function CustomTimeline() {
  const events = [
    {
      id: '1',
      title: 'Hero Arrives',
      description: 'The protagonist enters the story',
      chronologicalIndex: 1,
      charactersInvolved: ['hero-001'],
      tags: ['opening'],
      importance: 'major',
    },
  ];

  return (
    <TimelineCanvas
      events={events}
      selectedEventId={null}
      onEventClick={id => console.log('Selected:', id)}
    />
  );
}
```

**Props**:

```typescript
interface TimelineCanvasProps {
  events: TimelineEvent[];
  onEventClick: (eventId: string) => void;
  selectedEventId: string | null;
}
```

### 3. **EventNode** (`components/EventNode.tsx`)

Individual event card with metadata display.

**Features**:

- Importance badge (major events)
- Chronological index display
- Character count indicator
- Location display
- Tags visualization
- Hover animations
- Selection highlighting

**Usage**:

```tsx
import { EventNode } from '@/features/timeline';

function EventList() {
  const event = {
    id: '1',
    title: 'Final Battle',
    description: 'The climactic confrontation...',
    chronologicalIndex: 42,
    date: 'Day 100',
    locationId: 'castle-001',
    charactersInvolved: ['hero-001', 'villain-001'],
    tags: ['climax', 'action'],
    importance: 'major',
  };

  return (
    <EventNode
      event={event}
      isSelected={false}
      onClick={() => console.log('Clicked')}
    />
  );
}
```

**Props**:

```typescript
interface EventNodeProps {
  event: TimelineEvent;
  isSelected: boolean;
  onClick: () => void;
}
```

---

## Store

### `useTimelineStore()`

Zustand store for timeline state management.

**State**:

```typescript
interface TimelineState {
  timeline: Timeline | null;
  selectedEventId: string | null;
  isDragging: boolean;

  // Actions
  setTimeline: (timeline: Timeline) => void;
  updateSettings: (settings: Partial<Timeline['settings']>) => void;

  // Event Actions
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  removeEvent: (eventId: string) => void;
  reorderEvent: (eventId: string, newIndex: number) => void;

  // Era Actions
  addEra: (era: Omit<TimelineEra, 'id'>) => void;
  updateEra: (eraId: string, updates: Partial<TimelineEra>) => void;
  removeEra: (eraId: string) => void;

  // Selection
  selectEvent: (eventId: string | null) => void;
}
```

**Example - Add Event**:

```tsx
import { useTimelineStore } from '@/features/timeline';

function AddEventButton() {
  const { addEvent } = useTimelineStore();

  const handleAdd = () => {
    addEvent({
      title: 'New Plot Point',
      description: 'Description here...',
      chronologicalIndex: 10,
      charactersInvolved: [],
      tags: [],
      importance: 'minor',
    });
  };

  return <button onClick={handleAdd}>Add Event</button>;
}
```

**Example - Update Event**:

```tsx
import { useTimelineStore } from '@/features/timeline';

function EventEditor({ eventId }: { eventId: string }) {
  const { updateEvent } = useTimelineStore();

  const markAsMajor = () => {
    updateEvent(eventId, {
      importance: 'major',
      tags: ['key-moment'],
    });
  };

  return <button onClick={markAsMajor}>Mark as Major Event</button>;
}
```

**Example - Remove Event**:

```tsx
import { useTimelineStore } from '@/features/timeline';

function DeleteEventButton({ eventId }: { eventId: string }) {
  const { removeEvent } = useTimelineStore();

  return <button onClick={() => removeEvent(eventId)}>Delete Event</button>;
}
```

**Example - Reorder Event**:

```tsx
import { useTimelineStore } from '@/features/timeline';

function MoveEventButton({ eventId }: { eventId: string }) {
  const { reorderEvent } = useTimelineStore();

  const moveToPosition = (newIndex: number) => {
    reorderEvent(eventId, newIndex);
  };

  return (
    <div>
      <button onClick={() => moveToPosition(1)}>Move to Start</button>
      <button onClick={() => moveToPosition(50)}>Move to End</button>
    </div>
  );
}
```

**Example - Manage Eras**:

```tsx
import { useTimelineStore } from '@/features/timeline';

function EraManager() {
  const { addEra, updateEra, removeEra } = useTimelineStore();

  const createEra = () => {
    addEra({
      name: 'The Golden Age',
      startRange: 0,
      endRange: 100,
      description: 'A time of peace and prosperity',
      color: '#FFD700',
    });
  };

  return <button onClick={createEra}>Create Era</button>;
}
```

**Example - Event Selection**:

```tsx
import { useTimelineStore } from '@/features/timeline';

function EventDetails() {
  const { timeline, selectedEventId, selectEvent } = useTimelineStore();

  const selectedEvent = timeline?.events.find(e => e.id === selectedEventId);

  if (!selectedEvent) {
    return <p>No event selected</p>;
  }

  return (
    <div>
      <h3>{selectedEvent.title}</h3>
      <p>{selectedEvent.description}</p>
      <button onClick={() => selectEvent(null)}>Deselect</button>
    </div>
  );
}
```

---

## Types

### TimelineEvent

Represents a single event in the story timeline.

```typescript
export const TimelineEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  chronologicalIndex: z.number(),
  date: z.string().optional(),
  relatedChapterId: z.string().optional(),
  charactersInvolved: z.array(z.string()).default([]),
  locationId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  importance: z.enum(['major', 'minor', 'background']).default('minor'),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
```

**Fields**:

- `id`: Unique identifier (UUID)
- `title`: Event name (1-200 chars)
- `description`: Event details (max 2000 chars)
- `chronologicalIndex`: Sort order on timeline
- `date`: Optional date string (e.g., "Day 42", "Year 3052")
- `relatedChapterId`: Link to chapter where event occurs
- `charactersInvolved`: Array of character IDs
- `locationId`: Link to world-building location
- `tags`: Custom categorization tags
- `importance`: 'major' | 'minor' | 'background'

### TimelineEra

Represents a historical period or age.

```typescript
export const TimelineEraSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  startRange: z.number(),
  endRange: z.number(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export type TimelineEra = z.infer<typeof TimelineEraSchema>;
```

**Fields**:

- `id`: Unique identifier (UUID)
- `name`: Era name (1-100 chars)
- `startRange`: Starting chronological index
- `endRange`: Ending chronological index
- `description`: Optional era description
- `color`: Optional hex color code

### Timeline

Main timeline container with settings.

```typescript
export const TimelineSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string(),
  events: z.array(TimelineEventSchema).default([]),
  eras: z.array(TimelineEraSchema).default([]),
  settings: z.object({
    viewMode: z.enum(['chronological', 'narrative']).default('chronological'),
    zoomLevel: z.number().min(0.1).max(10).default(1),
    showCharacters: z.boolean().default(true),
    showImplicitEvents: z.boolean().default(false),
  }),
});

export type Timeline = z.infer<typeof TimelineSchema>;
```

**Fields**:

- `id`: Unique identifier (UUID)
- `projectId`: Parent project ID
- `events`: Array of TimelineEvent
- `eras`: Array of TimelineEra
- `settings`:
  - `viewMode`: 'chronological' | 'narrative'
  - `zoomLevel`: 0.1-10 (default 1)
  - `showCharacters`: Display character indicators
  - `showImplicitEvents`: Show inferred events

---

## Event Importance Levels

### Major Events

**Characteristics**:

- Story-critical plot points
- Character-defining moments
- Climactic scenes
- Major twists

**Visual Treatment**:

- Red "Major" badge
- Emphasized on timeline
- Higher priority in narrative view

**Example**:

```typescript
{
  title: 'Final Battle',
  importance: 'major',
  tags: ['climax', 'resolution'],
}
```

### Minor Events

**Characteristics**:

- Supporting plot progression
- Character development scenes
- World-building moments
- Transitional events

**Visual Treatment**:

- Standard appearance
- Default importance level

**Example**:

```typescript
{
  title: 'Meeting at the Tavern',
  importance: 'minor',
  tags: ['character-development'],
}
```

### Background Events

**Characteristics**:

- Historical context
- Off-screen occurrences
- Environmental details
- Foreshadowing setup

**Visual Treatment**:

- Subtle appearance
- Optional display in settings

**Example**:

```typescript
{
  title: 'Distant War Begins',
  importance: 'background',
  tags: ['worldbuilding', 'context'],
}
```

---

## View Modes

### Chronological View

**Description**: Events ordered by `chronologicalIndex` (story time).

**Best For**:

- Linear narratives
- Historical timelines
- Flashback organization
- Multiple storylines

**Example**:

```
[#1 Prologue] → [#2 Hero's Birth] → [#3 Training] → [#4 Adventure Begins]
```

### Narrative View

**Description**: Events ordered by appearance in manuscript (planned feature).

**Best For**:

- Non-linear storytelling
- Flashback-heavy narratives
- Mystery reveals
- Complex time structures

**Example**:

```
[Ch1: Discovery] → [Ch2: Flashback to Origin] → [Ch3: Present Day] → [Ch4: Resolution]
```

---

## Data Flow

### Timeline Initialization Flow

```
Project Loaded
    ↓
TimelineView receives project prop
    ↓
useEffect detects project change
    ↓
If project.timeline exists:
    └─ useTimelineStore.setTimeline(project.timeline)
Else:
    └─ Create default timeline with empty events/eras
    ↓
Timeline displayed in TimelineCanvas
```

### Event Creation Flow

```
User clicks "Add Event"
    ↓
TimelineView.handleAddEvent()
    ↓
Create event object with:
    • title: 'New Event'
    • chronologicalIndex: events.length + 1
    • importance: 'minor'
    • empty arrays for characters/tags
    ↓
useTimelineStore.addEvent(event)
    ↓
Generate UUID for event.id
    ↓
Add to timeline.events array
    ↓
Trigger useEffect in TimelineView
    ↓
Detect timeline change
    ↓
onUpdateProject({ timeline })
    ↓
Project updated (persisted to database)
    ↓
EventNode rendered on canvas
```

### Event Update Flow

```
User edits event
    ↓
Component calls useTimelineStore.updateEvent(id, updates)
    ↓
Find event by id in timeline.events
    ↓
Merge updates: { ...event, ...updates }
    ↓
Update timeline.events array
    ↓
Trigger TimelineView effect
    ↓
onUpdateProject({ timeline })
    ↓
Project saved
    ↓
UI re-renders with updated event
```

---

## Timeline Settings

### View Mode

Controls how events are ordered on timeline.

```typescript
timeline.settings.viewMode = 'chronological'; // or 'narrative'
```

**Options**:

- `'chronological'`: By chronologicalIndex (story time)
- `'narrative'`: By chapter appearance (planned)

### Zoom Level

Controls timeline scale and spacing.

```typescript
timeline.settings.zoomLevel = 1.0; // Default
// Range: 0.1 (zoomed out) to 10 (zoomed in)
```

**Presets**:

- **Standard** (1.0): Normal spacing
- **Compact** (0.4): Condensed view
- **Detailed** (2.0): Expanded view

### Show Characters

Display character involvement indicators.

```typescript
timeline.settings.showCharacters = true;
```

**When Enabled**:

- Character count shown on EventNode
- Character icons displayed (future)
- Filter by character (future)

### Show Implicit Events

Display inferred events from text analysis (planned).

```typescript
timeline.settings.showImplicitEvents = false;
```

**When Enabled**:

- Auto-detected events from chapters
- Faded appearance vs manual events
- AI-suggested timeline entries

---

## Common Use Cases

### 1. Create Basic Timeline

```tsx
import { useTimelineStore } from '@/features/timeline';
import { useEffect } from 'react';

function InitializeTimeline({ projectId }: { projectId: string }) {
  const { setTimeline, addEvent } = useTimelineStore();

  useEffect(() => {
    // Initialize timeline
    setTimeline({
      id: crypto.randomUUID(),
      projectId,
      events: [],
      eras: [],
      settings: {
        viewMode: 'chronological',
        zoomLevel: 1,
        showCharacters: true,
        showImplicitEvents: false,
      },
    });

    // Add initial events
    addEvent({
      title: 'Story Begins',
      description: 'The protagonist starts their journey',
      chronologicalIndex: 1,
      charactersInvolved: ['hero-001'],
      tags: ['opening'],
      importance: 'major',
    });

    addEvent({
      title: 'Meet the Mentor',
      description: 'First encounter with the wise guide',
      chronologicalIndex: 2,
      charactersInvolved: ['hero-001', 'mentor-001'],
      tags: ['character-introduction'],
      importance: 'minor',
    });
  }, [projectId, setTimeline, addEvent]);

  return <div>Timeline initialized</div>;
}
```

### 2. Track Multi-Character Arcs

```tsx
import { useTimelineStore } from '@/features/timeline';

function CharacterArcTracker() {
  const { timeline, addEvent } = useTimelineStore();

  const createCharacterMoment = (characterId: string, title: string) => {
    addEvent({
      title,
      description: `Key moment for character ${characterId}`,
      chronologicalIndex: timeline!.events.length + 1,
      charactersInvolved: [characterId],
      tags: ['character-arc', characterId],
      importance: 'minor',
    });
  };

  return (
    <div>
      <button
        onClick={() => createCharacterMoment('hero-001', "Hero's Revelation")}
      >
        Add Hero Moment
      </button>
      <button
        onClick={() => createCharacterMoment('villain-001', "Villain's Plan")}
      >
        Add Villain Moment
      </button>
    </div>
  );
}
```

### 3. Define Historical Eras

```tsx
import { useTimelineStore } from '@/features/timeline';

function DefineEras() {
  const { addEra } = useTimelineStore();

  const createFantasyEras = () => {
    addEra({
      name: 'The Age of Dragons',
      startRange: 0,
      endRange: 100,
      description: 'When dragons ruled the skies',
      color: '#FF4444',
    });

    addEra({
      name: 'The Great War',
      startRange: 100,
      endRange: 150,
      description: 'The conflict that shaped nations',
      color: '#444444',
    });

    addEra({
      name: 'The Modern Age',
      startRange: 150,
      endRange: 200,
      description: 'Current timeline of the story',
      color: '#4444FF',
    });
  };

  return <button onClick={createFantasyEras}>Create Fantasy Eras</button>;
}
```

### 4. Link Events to Chapters

```tsx
import { useTimelineStore } from '@/features/timeline';

function ChapterEventLinker({ chapterId }: { chapterId: string }) {
  const { addEvent } = useTimelineStore();

  const linkChapterEvent = (title: string, index: number) => {
    addEvent({
      title,
      description: `Event from chapter ${chapterId}`,
      chronologicalIndex: index,
      relatedChapterId: chapterId,
      charactersInvolved: [],
      tags: ['chapter-event'],
      importance: 'minor',
    });
  };

  return (
    <button onClick={() => linkChapterEvent('Chapter Event', 10)}>
      Link Event to Chapter
    </button>
  );
}
```

### 5. Filter Events by Tag

```tsx
import { useTimelineStore } from '@/features/timeline';
import { useMemo } from 'react';

function FilteredTimeline({ filterTag }: { filterTag: string }) {
  const { timeline } = useTimelineStore();

  const filteredEvents = useMemo(() => {
    return timeline?.events.filter(e => e.tags.includes(filterTag)) || [];
  }, [timeline, filterTag]);

  return (
    <div>
      <h3>Events tagged "{filterTag}"</h3>
      {filteredEvents.map(event => (
        <div key={event.id}>
          <strong>#{event.chronologicalIndex}</strong> {event.title}
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Event Sorting**:
   - Events sorted once in TimelineCanvas
   - Uses native `.sort()` with simple numeric comparison
   - O(n log n) complexity

2. **Rendering Optimization**:
   - Framer Motion for smooth animations
   - EventNode uses `layout` for automatic reflow
   - Horizontal scroll prevents full re-render

3. **Store Updates**:
   - Zustand provides automatic re-render optimization
   - Only components using changed data re-render
   - Event updates are O(n) array map operations

4. **Large Timelines**:
   - Consider virtualization for 100+ events
   - Lazy load event details
   - Pagination or windowing

### Performance Targets

| Operation        | Target | Notes                     |
| ---------------- | ------ | ------------------------- |
| Render 50 events | <100ms | Acceptable initial render |
| Add event        | <16ms  | Instant feedback          |
| Update event     | <16ms  | No perceivable lag        |
| Reorder event    | <50ms  | Smooth animation          |
| Zoom change      | <100ms | Canvas rescale            |

### Optimization Tips

**For Large Timelines (100+ events)**:

```tsx
import { useMemo } from 'react';
import { useTimelineStore } from '@/features/timeline';

function OptimizedTimeline() {
  const { timeline } = useTimelineStore();

  // Memoize sorted events
  const sortedEvents = useMemo(() => {
    return [...(timeline?.events || [])].sort(
      (a, b) => a.chronologicalIndex - b.chronologicalIndex,
    );
  }, [timeline?.events]);

  // Virtualize rendering
  const visibleEvents = useMemo(() => {
    const start = Math.floor(scrollPosition / eventWidth);
    const end = start + visibleCount;
    return sortedEvents.slice(start, end);
  }, [sortedEvents, scrollPosition]);

  return <div>{/* Render only visibleEvents */}</div>;
}
```

---

## Testing

### Unit Tests

**Testing Event CRUD Operations**:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimelineStore } from '../stores/timelineStore';

describe('useTimelineStore', () => {
  it('should add event', () => {
    const { result } = renderHook(() => useTimelineStore());

    act(() => {
      result.current.setTimeline({
        id: 'timeline-001',
        projectId: 'proj_123',
        events: [],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      });
    });

    act(() => {
      result.current.addEvent({
        title: 'Test Event',
        description: 'Test description',
        chronologicalIndex: 1,
        charactersInvolved: [],
        tags: [],
        importance: 'minor',
      });
    });

    expect(result.current.timeline?.events).toHaveLength(1);
    expect(result.current.timeline?.events[0].title).toBe('Test Event');
  });

  it('should update event', () => {
    const { result } = renderHook(() => useTimelineStore());

    act(() => {
      result.current.setTimeline({
        id: 'timeline-001',
        projectId: 'proj_123',
        events: [
          {
            id: 'event-001',
            title: 'Original',
            description: '',
            chronologicalIndex: 1,
            charactersInvolved: [],
            tags: [],
            importance: 'minor',
          },
        ],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      });
    });

    act(() => {
      result.current.updateEvent('event-001', {
        title: 'Updated',
        importance: 'major',
      });
    });

    expect(result.current.timeline?.events[0].title).toBe('Updated');
    expect(result.current.timeline?.events[0].importance).toBe('major');
  });

  it('should remove event', () => {
    const { result } = renderHook(() => useTimelineStore());

    act(() => {
      result.current.setTimeline({
        id: 'timeline-001',
        projectId: 'proj_123',
        events: [
          {
            id: 'event-001',
            title: 'To Remove',
            description: '',
            chronologicalIndex: 1,
            charactersInvolved: [],
            tags: [],
            importance: 'minor',
          },
        ],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      });
    });

    act(() => {
      result.current.removeEvent('event-001');
    });

    expect(result.current.timeline?.events).toHaveLength(0);
  });
});
```

### Component Tests

**Testing TimelineCanvas Rendering**:

```typescript
import { render, screen } from '@testing-library/react';
import { TimelineCanvas } from '../components/TimelineCanvas';

describe('TimelineCanvas', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Event 1',
      description: 'First event',
      chronologicalIndex: 1,
      charactersInvolved: [],
      tags: [],
      importance: 'minor' as const,
    },
    {
      id: '2',
      title: 'Event 2',
      description: 'Second event',
      chronologicalIndex: 2,
      charactersInvolved: [],
      tags: [],
      importance: 'major' as const,
    },
  ];

  it('renders all events in chronological order', () => {
    render(
      <TimelineCanvas
        events={mockEvents}
        selectedEventId={null}
        onEventClick={jest.fn()}
      />
    );

    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('highlights selected event', () => {
    render(
      <TimelineCanvas
        events={mockEvents}
        selectedEventId="1"
        onEventClick={jest.fn()}
      />
    );

    const event1 = screen.getByText('Event 1').closest('div');
    expect(event1).toHaveClass('ring-2');
  });
});
```

---

## Troubleshooting

### Timeline Not Syncing with Project

**Problem**: Timeline changes don't persist to project

**Solutions**:

1. Verify `onUpdateProject` is called:

   ```typescript
   useEffect(() => {
     if (timeline) {
       console.log('Timeline changed, updating project');
       onUpdateProject({ timeline });
     }
   }, [timeline, onUpdateProject]);
   ```

2. Check for deep comparison issues:

   ```typescript
   // Avoid infinite loops
   if (JSON.stringify(timeline) !== JSON.stringify(project.timeline)) {
     onUpdateProject({ timeline });
   }
   ```

3. Ensure project save is triggered:
   ```typescript
   const handleUpdateProject = async updates => {
     setProject(prev => ({ ...prev, ...updates }));
     await saveProject(project.id, updates); // Persist to DB
   };
   ```

### Events Not Appearing

**Problem**: Added events don't show on timeline

**Solutions**:

1. Verify timeline is initialized:

   ```typescript
   useEffect(() => {
     if (!project.timeline) {
       setTimeline({
         id: crypto.randomUUID(),
         projectId: project.id,
         events: [],
         eras: [],
         settings: {
           /* defaults */
         },
       });
     }
   }, [project]);
   ```

2. Check chronologicalIndex:

   ```typescript
   // Ensure unique, sequential indices
   const nextIndex = (timeline?.events.length || 0) + 1;
   ```

3. Verify event structure matches schema:

   ```typescript
   import { TimelineEventSchema } from '@/types';

   const result = TimelineEventSchema.safeParse(event);
   if (!result.success) {
     console.error('Invalid event:', result.error);
   }
   ```

### Performance Issues with Many Events

**Problem**: Timeline sluggish with 50+ events

**Solutions**:

1. Implement virtualization:

   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';

   const virtualizer = useVirtualizer({
     count: events.length,
     getScrollElement: () => containerRef.current,
     estimateSize: () => 250, // EventNode width
     horizontal: true,
   });
   ```

2. Debounce updates:

   ```typescript
   import debounce from 'lodash/debounce';

   const debouncedUpdate = useMemo(
     () => debounce(updates => updateEvent(id, updates), 300),
     [updateEvent],
   );
   ```

3. Lazy load event details:

   ```typescript
   const [expandedId, setExpandedId] = useState<string | null>(null);

   // Only load full description when expanded
   {expandedId === event.id && <FullEventDetails event={event} />}
   ```

---

## Future Enhancements

### Planned Features

1. **Drag-and-Drop Reordering**
   - Drag events to reorder chronologically
   - Visual drop indicators
   - Smooth animations during reorder

2. **Era Visualization**
   - Color-coded era backgrounds
   - Era labels on timeline
   - Filter events by era

3. **Narrative View Mode**
   - Order events by chapter appearance
   - Support flashbacks and non-linear narratives
   - Visual indicators for time jumps

4. **Event Dependencies**
   - Link cause-and-effect relationships
   - Visual connection lines
   - Dependency graphs

5. **Timeline Export**
   - Export as image (PNG/SVG)
   - PDF timeline document
   - Printable formats

6. **AI-Generated Events**
   - Auto-detect events from chapters
   - Suggest implicit events
   - Timeline consistency checking

7. **Multi-Timeline Support**
   - Parallel storylines
   - Alternate timelines
   - Compare timelines side-by-side

### Requested Features

- Timeline templates (3-act, hero's journey)
- Character-specific timeline views
- Location-based timeline filtering
- Timeline branching (alternate outcomes)
- Collaborative timeline editing
- Timeline versioning/history

---

## Related Features

- **[Projects](../projects/README.md)**: Timeline embedded in project data
- **[Characters](../characters/README.md)**: Character involvement in events
- **[World Building](../world-building/README.md)**: Location references
- **[Editor](../editor/README.md)**: Chapter-event linking
- **[Versioning](../versioning/README.md)**: Timeline change tracking (planned)

---

## Best Practices

1. **Chronological Indexing**:
   - Use sequential integers starting from 1
   - Leave gaps (10, 20, 30) for inserting events later
   - Reindex when timeline gets messy

2. **Event Granularity**:
   - **Major events**: 5-10 per story (key plot points)
   - **Minor events**: 20-50 per story (supporting scenes)
   - **Background events**: Unlimited (context/worldbuilding)

3. **Tagging Strategy**:
   - Use consistent tag naming (lowercase, hyphenated)
   - Common tags: 'opening', 'climax', 'resolution', 'character-arc',
     'worldbuilding'
   - Tag categories: plot-type, location-type, tone

4. **Character Involvement**:
   - Track all significant characters per event
   - Use for filtering character appearances
   - Verify consistency with character arcs

5. **Era Organization**:
   - Define 3-5 major eras maximum
   - Use descriptive, memorable names
   - Ensure no gaps in era coverage

6. **Performance**:
   - Keep timelines under 100 events for optimal performance
   - Use tags for filtering instead of creating multiple timelines
   - Archive completed storylines

---

**Last Updated**: January 2026 **Status**: ✅ Production Ready (MVP) **Test
Coverage**: Pending (Store logic complete, UI tests needed)
