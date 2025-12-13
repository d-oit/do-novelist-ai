/**
 * Property-based tests for secure random generator
 * Feature: codeql-security-fixes
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

import {
  generateSecureId,
  generateRandomBytes,
  generateDeviceId,
  generateUserId,
  generateAnalysisId,
  generateFeedbackId,
  generatePreferencesId,
} from '@/lib/secure-random';

describe('Secure Random Generator', () => {
  describe('Unit Tests', () => {
    it('should generate IDs with correct format', () => {
      const id = generateSecureId('test', 16);
      expect(id).toMatch(/^test-[0-9a-f]{32}$/);
    });

    it('should generate IDs without prefix', () => {
      const id = generateSecureId('', 16);
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate device IDs with correct prefix', () => {
      const id = generateDeviceId();
      expect(id).toMatch(/^device-[0-9a-f]{32}$/);
    });

    it('should generate user IDs with correct prefix', () => {
      const id = generateUserId();
      expect(id).toMatch(/^user-[0-9a-f]{32}$/);
    });

    it('should generate analysis IDs with correct prefix', () => {
      const id = generateAnalysisId();
      expect(id).toMatch(/^analysis-[0-9a-f]{32}$/);
    });

    it('should generate feedback IDs with correct prefix', () => {
      const id = generateFeedbackId();
      expect(id).toMatch(/^feedback-[0-9a-f]{32}$/);
    });

    it('should generate preferences IDs with correct prefix', () => {
      const id = generatePreferencesId();
      expect(id).toMatch(/^prefs-[0-9a-f]{32}$/);
    });

    it('should throw error for non-positive length', () => {
      expect(() => generateRandomBytes(0)).toThrow('Length must be positive');
      expect(() => generateRandomBytes(-1)).toThrow('Length must be positive');
    });

    it('should generate random bytes of correct length', () => {
      const bytes = generateRandomBytes(16);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: codeql-security-fixes, Property 1: Generated IDs are unique
    it('should generate unique IDs across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // Number of IDs to generate
          fc.constantFrom('', 'test', 'device', 'user', 'analysis'), // Different prefixes
          fc.integer({ min: 8, max: 32 }), // Different lengths
          (count, prefix, length) => {
            const ids = new Set<string>();

            // Generate multiple IDs
            for (let i = 0; i < count; i++) {
              const id = generateSecureId(prefix, length);
              ids.add(id);
            }

            // All IDs should be unique
            return ids.size === count;
          },
        ),
        { numRuns: 100 }, // Run 100 iterations as specified in design
      );
    });

    // Feature: codeql-security-fixes, Property 1: Generated IDs are unique (specialized functions)
    it('should generate unique device IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), count => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            ids.add(generateDeviceId());
          }

          return ids.size === count;
        }),
        { numRuns: 100 },
      );
    });

    // Feature: codeql-security-fixes, Property 1: Generated IDs are unique (user IDs)
    it('should generate unique user IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), count => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            ids.add(generateUserId());
          }

          return ids.size === count;
        }),
        { numRuns: 100 },
      );
    });

    // Feature: codeql-security-fixes, Property 1: Generated IDs are unique (analysis IDs)
    it('should generate unique analysis IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), count => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            ids.add(generateAnalysisId());
          }

          return ids.size === count;
        }),
        { numRuns: 100 },
      );
    });

    // Feature: codeql-security-fixes, Property 1: Generated IDs are unique (feedback IDs)
    it('should generate unique feedback IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), count => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            ids.add(generateFeedbackId());
          }

          return ids.size === count;
        }),
        { numRuns: 100 },
      );
    });

    // Feature: codeql-security-fixes, Property 1: Generated IDs are unique (preferences IDs)
    it('should generate unique preferences IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), count => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            ids.add(generatePreferencesId());
          }

          return ids.size === count;
        }),
        { numRuns: 100 },
      );
    });

    // Additional property: Random bytes should have sufficient entropy
    it('should generate random bytes with high entropy', () => {
      fc.assert(
        fc.property(fc.integer({ min: 16, max: 64 }), length => {
          const bytes = generateRandomBytes(length);

          // Check that not all bytes are the same (would indicate low entropy)
          const firstByte = bytes[0];
          const allSame = Array.from(bytes).every(b => b === firstByte);

          return !allSame && bytes.length === length;
        }),
        { numRuns: 100 },
      );
    });

    // Additional property: IDs should have correct format
    it('should generate IDs with correct hexadecimal format', () => {
      fc.assert(
        fc.property(
          // Generate valid prefixes (alphanumeric, no hyphens to avoid split issues)
          fc.stringMatching(/^[a-zA-Z0-9]{0,20}$/),
          fc.integer({ min: 1, max: 32 }), // Length
          (prefix, length) => {
            const id = generateSecureId(prefix, length);
            const expectedLength = length * 2; // Each byte becomes 2 hex chars

            if (prefix) {
              // Should have format: prefix-hexstring
              const parts = id.split('-');
              const hexPart = parts[1];
              return (
                parts.length === 2 &&
                parts[0] === prefix &&
                hexPart !== undefined &&
                /^[0-9a-f]+$/.test(hexPart) &&
                hexPart.length === expectedLength
              );
            } else {
              // Should be just hexstring
              return /^[0-9a-f]+$/.test(id) && id.length === expectedLength;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
