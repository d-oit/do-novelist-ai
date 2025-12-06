# New Feature Proposal: Interactive Story Timeline

## 1. Overview

A specialized visualization and management tool that maps the **chronological**
order of events in the story, distinct from the **narrative** order of chapters.
This leverages the GOAP architecture to treat "Story Events" as nodes that can
be rearranged, linked, and analyzed for continuity.

## 2. Value Proposition

- **For the User:** Visualizes gaps in the plot (e.g., a character traveling
  instantly between locations). Helps structured plotting (Hero's Journey).
- **For the AI:** Provides a structured "Time" context. Agent actions can have
  specific `timestamp` or `sequence_index` effects, allowing the AI to
  understand "before" and "after".

## 3. Technical Implementation

### 3.1 Data Structure

Extend `Project` schema to include `Timeline`:

```typescript
interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  chronologicalIndex: number; // Absolute time order
  relatedChapterId?: string; // Link to narrative
  charactersInvolved: string[];
  locationId: string;
  tags: string[]; // e.g., "Flashback", "Climax"
}

interface Timeline {
  id: string;
  events: TimelineEvent[];
  eras: { name: string; range: [number, number] }[]; // Grouping events
}
```

### 3.2 UI Components

- **TimelineCanvas:** A horizontal or vertical scrolling canvas (using
  `framer-motion` for smooth reordering).
- **EventNode:** Draggable card representing an event.
- **ConnectionLine:** Visualizes causal links (Action A caused Event B).

### 3.3 Integration with GOAP

- **New Agent Action:** `CreateTimelineEvent`.
- **Architect Agent Update:** When generating an outline, the Architect now also
  populates the initial Timeline to ensure logical flow.
- **Consistency Check:** A "Timeline Doctor" agent can scan the timeline for
  impossible travel times or conflicting character locations.

## 4. Implementation Steps

1.  **Schema Definition:** Update `types/index.ts` and database schema.
2.  **State Management:** Create `useTimeline` hook (Zustand store).
3.  **UI Construction:** Build the `TimelineView` component.
4.  **Agent Integration:** Prompt engineer the "Architect" to output temporal
    metadata.
5.  **Visualization:** Integrate into the main Dashboard as a new tab
    ("Timeline").

## 5. Mockup Description

_A horizontal rail view where the X-axis is time. Events are cards placed on
this rail. Lines connect events that share characters. A toggle switch allows
swapping between "Narrative Order" (Chapter 1, 2, 3) and "Chronological Order"
(Year 1990, 2020, 1995)._
