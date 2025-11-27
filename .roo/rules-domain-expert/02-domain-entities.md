# Domain Entities and Invariants

## Purpose
Defines core domain entities for Novelist.ai GOAP novel generation with invariants ensuring data integrity.

## Rules
1. **Project Entity**
   - Properties: id, title, genre, style, targetWordCount, chapters[], worldState, createdAt
   - Invariant: targetWordCount > 0, chapters.length <= 30
   - Example: { id: 'proj1', title: 'Epic Quest', genre: 'fantasy', targetWordCount: 90000 }

2. **Chapter Entity**
   - Properties: orderIndex, title, summary, content, status (PENDING|DRAFTING|COMPLETE|REFINED), wordCount
   - Invariant: orderIndex unique 1-N, wordCount matches content.length
   - Relations: belongsTo Project, references previousChapter

3. **Character Entity**
   - Properties: id, name, role (protagonist|antagonist|side), arc, motivation, voiceTraits[]
   - Invariant: name unique per project, motivation non-empty

4. **WorldState (GOAP)**
   - Properties: hasTitle, hasOutline, chaptersCompleted, hasCharacters, isPublished
   - Invariant: chaptersCompleted <= totalChapters, boolean flags consistent with entities

## Validation
- Zod schemas in src/types/schemas.ts
- Runtime guards on all mutations
- GOAP precondition checks before actions

## Exceptions
- Prototype projects: relax wordCount invariants
- Document in project metadata