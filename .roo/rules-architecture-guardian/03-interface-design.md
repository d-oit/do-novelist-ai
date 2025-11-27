# Interface Design Rules

## Purpose
Interface Segregation Principle (ISP) guidelines for Novelist.ai, ensuring focused contracts.

## Rules
1. **Small Interfaces**
   - Max 5 methods per interface
   - Single concern: IChapterWriter vs IChapterEditor + IChapterPublisher

2. **Explicit Contracts**
   - TypeScript interfaces in types/
   - JSDoc with examples/returns
   - Zod for runtime shape validation

3. **Service Interfaces**
   - IGoapPlanner: planActions(worldState: WorldState): Action[]
   - IContentGenerator: generate(prompt: string, schema: ZodSchema): Promise<T>

4. **Client-Specific**
   - No fat interfaces: split by role (React hook vs service)

## Validation
- Interface size lint rule
- Unused interface exports flagged

## Exceptions
- Legacy: migrate to small interfaces