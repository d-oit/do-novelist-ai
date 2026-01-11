import { vi } from 'vitest';

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';

vi.mock('@libsql/client/web', () => ({
  createClient: vi.fn(() => ({
    execute: vi.fn(),
    batch: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

export interface TestDB {
  plot_structures: Map<string, PlotStructure>;
  plot_holes: Map<string, PlotHole[]>;
  character_graphs: Map<string, CharacterGraph>;
  analysis_results: Map<string, unknown>;
  plot_suggestions: Map<string, PlotSuggestion[]>;
}

export const createTestDB = (): TestDB => ({
  plot_structures: new Map(),
  plot_holes: new Map(),
  character_graphs: new Map(),
  analysis_results: new Map(),
  plot_suggestions: new Map(),
});

export const testProjectId = 'test-project-123';
