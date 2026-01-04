/**
 * Tests for similarity algorithms
 */

import { describe, it, expect } from 'vitest';

import {
  cosineSimilarity,
  normalizeVector,
  euclideanDistance,
  manhattanDistance,
  findMostSimilar,
  findTopKSimilar,
  getSimilarityThreshold,
} from '@/lib/embeddings/similarity';

describe('Similarity Algorithms', () => {
  describe('normalizeVector', () => {
    it('should normalize a vector to unit length', () => {
      const vector = [3, 4];
      const normalized = normalizeVector(vector);

      const magnitude = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1, 10);
    });

    it('should handle zero vector', () => {
      const vector = [0, 0, 0];
      const normalized = normalizeVector(vector);

      expect(normalized).toEqual([0, 0, 0]);
    });

    it('should preserve direction', () => {
      const vector = [1, 2, 3];
      const normalized = normalizeVector(vector);

      const norm0 = normalized[0];
      const vec0 = vector[0];
      if (norm0 !== undefined && vec0 !== undefined && vec0 !== 0) {
        const ratio = norm0 / vec0;
        normalized.forEach((val, i) => {
          const vecVal = vector[i];
          if (vecVal !== undefined && vecVal !== 0) {
            expect(val / vecVal).toBeCloseTo(ratio, 10);
          }
        });
      }
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];

      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];

      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 10);
    });

    it('should return -1 for opposite vectors', () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];

      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 10);
    });

    it('should handle different magnitudes', () => {
      const a = [1, 1];
      const b = [2, 2];

      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
    });

    it('should handle zero vectors', () => {
      const a = [0, 0];
      const b = [1, 1];

      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('should throw error for different dimensions', () => {
      const a = [1, 2];
      const b = [1, 2, 3];

      expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have the same dimensions');
    });
  });

  describe('euclideanDistance', () => {
    it('should calculate correct distance', () => {
      const a = [0, 0];
      const b = [3, 4];

      expect(euclideanDistance(a, b)).toBe(5);
    });

    it('should return 0 for identical vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];

      expect(euclideanDistance(a, b)).toBe(0);
    });

    it('should throw error for different dimensions', () => {
      const a = [1, 2];
      const b = [1, 2, 3];

      expect(() => euclideanDistance(a, b)).toThrow('Vectors must have the same dimensions');
    });
  });

  describe('manhattanDistance', () => {
    it('should calculate correct distance', () => {
      const a = [0, 0];
      const b = [3, 4];

      expect(manhattanDistance(a, b)).toBe(7);
    });

    it('should return 0 for identical vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];

      expect(manhattanDistance(a, b)).toBe(0);
    });

    it('should throw error for different dimensions', () => {
      const a = [1, 2];
      const b = [1, 2, 3];

      expect(() => manhattanDistance(a, b)).toThrow('Vectors must have the same dimensions');
    });
  });

  describe('findMostSimilar', () => {
    it('should find most similar vector', () => {
      const query = [1, 2, 3];
      const candidates = [
        [1, 2, 3],
        [3, 4, 5],
        [2, 4, 6],
      ];

      const result = findMostSimilar(query, candidates);

      expect(result.index).toBe(0);
      expect(result.similarity).toBeCloseTo(1, 10);
    });

    it('should handle empty candidates', () => {
      const query = [1, 2, 3];
      const candidates: number[][] = [];

      expect(() => findMostSimilar(query, candidates)).toThrow('Candidate list cannot be empty');
    });
  });

  describe('findTopKSimilar', () => {
    it('should find top K similar vectors', () => {
      const query = [1, 2, 3];
      const candidates = [
        [1, 2, 3],
        [3, 4, 5],
        [2, 4, 6],
        [0.9, 2.1, 3],
      ];

      const results = findTopKSimilar(query, candidates, 2);

      expect(results).toHaveLength(2);
      expect(results[0]?.index).toBe(0);
      if (results[0]) {
        expect(results[0].similarity).toBeCloseTo(1, 10);
      }
      // Second most similar should have high similarity (> 0.95)
      expect(results[1]?.similarity).toBeGreaterThan(0.95);
    });

    it('should return empty array for K=0', () => {
      const query = [1, 2, 3];
      const candidates = [
        [1, 2, 3],
        [2, 3, 4],
      ];

      const results = findTopKSimilar(query, candidates, 0);

      expect(results).toHaveLength(0);
    });

    it('should handle K larger than candidate count', () => {
      const query = [1, 2, 3];
      const candidates = [
        [1, 2, 3],
        [2, 3, 4],
      ];

      const results = findTopKSimilar(query, candidates, 10);

      expect(results).toHaveLength(2);
    });
  });

  describe('getSimilarityThreshold', () => {
    it('should return correct threshold for strict level', () => {
      expect(getSimilarityThreshold('strict')).toBe(0.8);
    });

    it('should return correct threshold for moderate level', () => {
      expect(getSimilarityThreshold('moderate')).toBe(0.6);
    });

    it('should return correct threshold for lenient level', () => {
      expect(getSimilarityThreshold('lenient')).toBe(0.4);
    });

    it('should default to moderate for unknown level', () => {
      expect(getSimilarityThreshold('unknown' as any)).toBe(0.6);
    });
  });
});
