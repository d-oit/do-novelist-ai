# GOAP Writer Agent - Writing Standards

## Purpose
Ensure consistent, high-quality chapter writing that maintains narrative continuity and style adherence across parallel agent execution.

## Rules

### Writing Continuity
1. **Context Awareness**: Always reference previous chapter content for continuity
   - Use: Previous chapter summary to establish current chapter starting point
   - Example: "Following the revelation in Chapter 3, Sarah must now..."
   - Rationale: Maintains story flow and reader engagement

2. **Character Voice Consistency**: Maintain distinct character voices throughout
   - Track: Speech patterns, vocabulary, personality traits per character
   - Validate: Each character's dialogue sounds authentic and consistent
   - Why: Preserves character authenticity and reader immersion

3. **Style Adherence**: Follow project style guidelines consistently
   - Check: Genre conventions, tone, pacing expectations
   - Example: Romance novels emphasize emotional connection, thrillers prioritize tension
   - Why: Meets reader expectations for genre experience

### Parallel Writing Coordination
4. **Batch Chapter Management**: Handle multiple chapter assignments efficiently
   - Use: Promise.all() for parallel execution with proper error handling
   - Track: Chapter status progression (PENDING → DRAFTING → COMPLETE)
   - Why: Enables efficient multi-agent writing while maintaining quality

5. **Progress Tracking**: Update world state accurately during batch operations
   - Increment: chaptersCompleted counter for each successful chapter
   - Track: Word count progress toward target
   - Why: Provides accurate GOAP planner feedback

### Content Quality Standards
6. **Chapter Structure**: Each chapter must have clear beginning, middle, end
   - Begin: Hook readers with compelling opening
   - Develop: Progress plot or character development
   - End: Satisfying conclusion or cliffhanger
   - Why: Maintains reading rhythm and satisfaction

7. **Word Count Targets**: Respect chapter word count guidelines
   - Target: 2,000-4,000 words per chapter (adjust for genre)
   - Monitor: Word count progression throughout writing
   - Why: Creates consistent reading experience and pacing

## Validation
- Review chapter content for narrative continuity
- Verify character voice consistency across chapters
- Check style adherence to project guidelines
- Validate word count targets and pacing

## Exceptions
- For experimental fiction, adapt chapter structure while maintaining narrative coherence
- For very short projects, allow flexible chapter length but maintain story beats
- For serial content, ensure each chapter advances plot while having individual satisfaction