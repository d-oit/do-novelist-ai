# GOAP Engine Action Patterns

## GOAP Action Schema
```typescript
interface AgentAction {
  name: string;
  label: string;
  description: string;
  cost: number;
  agentMode: AgentMode; // SINGLE | PARALLEL | HYBRID | SWARM
  preconditions: Partial<WorldState>;
  effects: Partial<WorldState>;
  category: 'generation' | 'analysis' | 'editing';
  estimatedDuration: number;
  requiredPermissions: string[];
  tags: string[];
  promptTemplate: string;
}
```

## Agent Modes
- **SINGLE**: Sequential agent execution
- **PARALLEL**: Multiple agents working simultaneously  
- **HYBRID**: Combination of sequential and parallel
- **SWARM**: Distributed agent coordination (future)

## World State Structure
```typescript
interface WorldState {
  hasTitle: boolean;
  hasOutline: boolean;
  chaptersCount: number;
  chaptersCompleted: number;
  styleDefined: boolean;
  isPublished: boolean;
  hasCharacters: boolean;
  hasWorldBuilding: boolean;
  hasThemes: boolean;
  plotStructureDefined: boolean;
  targetAudienceDefined: boolean;
}
```

## Core Action Patterns
1. **Planning Actions**: create_outline, deepen_plot
2. **Development Actions**: develop_characters, build_world  
3. **Writing Actions**: write_chapter_parallel
4. **Refinement Actions**: dialogue_doctor, editor_review

## Execution Rules
- Actions must check preconditions before execution
- World state must be updated with effects
- All actions log progress via addLog()
- AbortController required for async operations
- Error handling with try/catch/finally patterns

## Agent Orchestration
- Planner selects optimal action sequences
- Actions execute based on world state conditions
- Parallel actions use Promise.all() for coordination
- Single actions use sequential processing
- Hybrid actions combine both approaches