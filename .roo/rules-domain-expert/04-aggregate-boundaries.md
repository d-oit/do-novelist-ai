# Aggregate Boundaries

## Purpose
Defines aggregate roots and boundaries for Novelist.ai domain model, ensuring consistency within transactions.

## Rules
1. **Project Aggregate Root**
   - Boundary: Project + Chapters + WorldState
   - Invariant Owner: Project enforces total word count, outline completeness
   - Example: Cannot complete chapter without outline

2. **Chapter Aggregate**
   - Boundary: Chapter content + summary + status
   - Single responsibility: content mutations only within chapter lifecycle
   - No cross-chapter direct writes

3. **Character Aggregate**
   - Boundary: Character profile + appearances[] (references only)
   - Updates atomic: voiceTraits change affects all future dialogue

4. **GOAP Planner Aggregate**
   - Boundary: WorldState + ActionQueue + AgentAssignments
   - Consistency: preconditions checked before dequeue

5. **Boundary Crossing**
   - Events only: ChapterCompleted → update Project aggregate
   - No direct references across aggregates

## Validation
- Aggregate ID consistency in events
- Transaction boundaries in services

## Exceptions
- Read models: projections can span aggregates
- Denormalize for perf, sync via events