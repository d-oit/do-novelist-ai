# Novelist.ai GOAP eBook Engine - Project Overview

## Project Context
Novelist.ai is a sophisticated eBook generation platform that leverages **Goal-Oriented Action Planning (GOAP)** to orchestrate AI agents in creating complete novels. The system transforms complex novel writing into manageable, intelligent planning sequences.

## Domain: Creative AI & GOAP Orchestration
- **Primary Domain**: AI-powered novel writing assistance
- **Technology Focus**: GOAP engine, Gemini API integration, EPUB generation
- **Architecture Pattern**: Feature-first React application with GOAP agent orchestration
- **Quality Standards**: Anti-Slop design system, 500 LOC max per file, SOLID principles

## Core Business Process
1. **Project Creation** → Idea, genre, target word count
2. **GOAP Planning** → Intelligent agent action sequencing
3. **Multi-Agent Writing** → Parallel chapter generation with context
4. **Content Refinement** → Editorial review and dialogue polish
5. **EPUB Export** → Professional eBook generation

## Success Criteria
- AI modes must understand GOAP agent coordination patterns
- Support for both single-agent and parallel agent execution modes
- Maintain feature-first architecture boundaries
- Ensure compatibility with Anti-Slop design system principles
- Support for real-time agent orchestration and logging

## Key Technologies
- **Frontend**: React 19.2, TypeScript 5.8, Tailwind CSS
- **AI Engine**: Google Gemini API, GOAP agent orchestration
- **State Management**: Zustand with persistence middleware
- **Export**: EPUB 3.0 generation, cover generation via Imagen
- **Database**: Turso (libSQL) with localStorage fallback

## Agent Ecosystem
The system uses specialized agents following GOAP principles:
- **Architect**: Story outline generation using hero's journey
- **Writer**: Parallel chapter drafting with context awareness  
- **Editor**: Consistency checking and plot analysis
- **Doctor**: Dialogue polishing and voice refinement
- **Profiler**: Character development and psychological profiling
- **Builder**: World-building, lore, and setting expansion

## Quality Gates
- Feature-first architecture (7 major features)
- Max 500 LOC per component file
- Zustand state management (no useState hell)
- WCAG 2.1 mobile compliance (100dvh)
- 80%+ test coverage target
- AbortController in all async hooks