# ISP Design Rules

## Purpose
Interface Segregation Principle: many small interfaces over few fat ones for Novelist.ai.

## Rules
1. **Role-Specific Interfaces**
   - Reader: getChapter(id)
   - Writer: updateChapter(id, content)
   - Planner: planActions(state)

2. **No Fat Interfaces**
   - Max 5 methods/interface
   - Separate concerns: IValidator, IGenerator, IPersister

3. **Client-Driven**
   - Design from client needs
   - No methods clients don't use

## Validation
- Interface method count lint
- Unused methods flagged

## Exceptions
- Domain primitives: minimal