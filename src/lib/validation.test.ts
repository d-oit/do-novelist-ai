/**
 * Tests for validation.ts - Main Suite
 * Target: Increase coverage from 61.34% to 80%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ValidationService, validationService } from '@/lib/validation';

// Mock dependencies
vi.mock('@/types/schemas', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('@/types/schemas')>('@/types/schemas');
  return {
    ...actual,
    validateData: vi.fn((_schema, data) => ({ success: true, data })),
  };
});

vi.mock('@/types/guards', () => ({
  createProjectId: vi.fn(() => 'proj_test123'),
  createChapterId: vi.fn(projectId => `${projectId}_chapter_test`),
  isProjectId: vi.fn(id => typeof id === 'string' && id.startsWith('proj_')),
}));

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ValidationService.getInstance();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ValidationService.getInstance();
      const instance2 = ValidationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return same instance as exported singleton', () => {
      expect(validationService).toBe(service);
    });
  });
});
