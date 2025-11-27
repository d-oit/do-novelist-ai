# Domain Events

## Purpose
Defines domain events for Novelist.ai GOAP orchestration, enabling reactive workflows and agent coordination.

## Rules
1. **Event Naming**
   - Format: `ProjectCreated`, `OutlineGenerated`, `ChapterCompleted`
   - Past tense, domain-specific nouns
   - Example: `ChapterDrafted` vs generic `updated`

2. **Event Structure**
   ```typescript
   interface DomainEvent {
     type: string;
     projectId: string;
     payload: any;
     timestamp: Date;
     worldStateDelta?: Partial<WorldState>;
   }
   ```
   - Mandatory: type, projectId, timestamp
   - Optional: worldState updates for GOAP

3. **Key Events**
   - ProjectCreated: { genre, targetWordCount }
   - OutlineGenerated: { chapters: ChapterSummary[] } → hasOutline: true
   - ChapterCompleted: { chapterIndex, wordCount } → chaptersCompleted++
   - PublishingReady: { validationPassed: true }

4. **Event Handling**
   - Agents subscribe via preconditions
   - Idempotent: handle duplicates gracefully
   - Ordering: chapter events sequential

## Validation
- Zod schema validation on emit
- Event sourcing log in IndexedDB/Turso

## Exceptions
- Internal agent events: prefix `Agent_`
- Log only, no state change