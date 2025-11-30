/**
 * Characters Feature
 *
 * Manages character creation, editing, validation, and relationship tracking
 * for the Novelist GOAP engine.
 */

// Types
export type {
  Character,
  CharacterRole,
  CharacterArc,
  CharacterTrait,
  CharacterRelationship,
  CharacterValidationResult,
  CharacterFilters as CharacterFilterOptions,
} from './types';

// Hooks
export { useCharacters } from './hooks/useCharacters';
export { useCharacterValidation } from './hooks/useCharacterValidation';

// Services (rarely used externally, but available if needed)
export { characterService } from './services/characterService';

// Components
export { CharacterManager } from './components/CharacterManager';
export { CharacterCard } from './components/CharacterCard';
export { CharacterEditor } from './components/CharacterEditor';
export { CharacterGrid } from './components/CharacterGrid';
export { CharacterFilters } from './components/CharacterFilters';
export { CharacterStats } from './components/CharacterStats';
