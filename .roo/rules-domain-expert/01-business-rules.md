# Novelist.ai Business Rules

## Purpose
Defines core business rules for automated novel generation using GOAP, ensuring narrative coherence, genre compliance, and production quality.

## Rules
1. **Word Count Compliance**
   - Novels: 50,000-120,000 words
   - Chapters: 2,000-5,000 words (genre-adjusted)
   - Rationale: Industry standards for pacing and readability
   - Example: Fantasy chapters allow 6k+ for world-building

2. **Genre Conventions**
   - Do: Adhere to genre tropes and structures (Hero's Journey for epic fantasy)
   - Don't: Mix incompatible genres without justification
   - Why: Reader expectations drive satisfaction

3. **Narrative Progression**
   - Each chapter advances plot OR develops characters OR builds world
   - Tension escalation: rising action to climax
   - Resolution arcs complete by finale

4. **Character Development**
   - Primary arc: change through conflict
   - Secondary: support primary themes
   - Consistency: motivations align across chapters

5. **GOAP World State Rules**
   - Preconditions: hasOutline → develop_characters → write_chapters
   - Effects: chaptersCompleted++ updates progress metrics

## Validation
- Regex checks for word counts
- Schema validation on chapter summaries
- GOAP state transition verification

## Exceptions
- Experimental genres: document deviations in ADRs
- Short stories: <50k, adjust chapter rules