const { describe, it, expect } = require('vitest');
const fc = require('fast-check');
const { validatePath, sanitizePath, isWithinWorkspace } = require('../path-validator.cjs');

describe('Path Validator - Property-Based Tests', () => {
  // Feature: codeql-security-fixes, Property 1: Path validation rejects malicious inputs
  // Validates: Requirements 1.1, 1.2, 1.4
  describe('Property 1: Path validation rejects malicious inputs', () => {
    it('should reject paths with ../ traversal patterns', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.includes('../')),
          (maliciousPath) => {
            const result = validatePath(maliciousPath);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject paths with ..\\ traversal patterns', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.includes('..\\')),
          (maliciousPath) => {
            const result = validatePath(maliciousPath);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject absolute Unix paths', () => {
      fc.assert(
        fc.property(
          fc.string().map(s => '/' + s),
          (absolutePath) => {
            const result = validatePath(absolutePath);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject absolute Windows paths', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('C', 'D', 'E', 'F'),
          fc.constantFrom(':\\', ':/'),
          fc.string(),
          (drive, separator, rest) => {
            const absolutePath = drive + separator + rest;
            const result = validatePath(absolutePath);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject paths with null bytes', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (before, after) => {
            const pathWithNull = before + '\0' + after;
            const result = validatePath(pathWithNull);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject paths with invalid filename characters', () => {
      const invalidChars = ['<', '>', ':', '"', '|', '?', '*'];
      fc.assert(
        fc.property(
          fc.constantFrom(...invalidChars),
          fc.string(),
          (invalidChar, rest) => {
            const pathWithInvalidChar = rest + invalidChar;
            const result = validatePath(pathWithInvalidChar);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject null and undefined inputs', () => {
      expect(validatePath(null)).toBe(false);
      expect(validatePath(undefined)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.object(), fc.array(fc.anything())),
          (nonString) => {
            const result = validatePath(nonString);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: codeql-security-fixes, Property 2: Valid paths are sanitized correctly
  // Validates: Requirements 1.1, 1.2
  describe('Property 2: Valid paths are sanitized correctly', () => {
    it('should accept and sanitize valid relative paths', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 5 }),
          (pathSegments) => {
            const validPath = pathSegments.join('/');
            const result = validatePath(validPath);
            expect(result).toBe(true);

            const sanitized = sanitizePath(validPath);
            expect(sanitized).toBeDefined();
            expect(typeof sanitized).toBe('string');
            
            // Sanitized path should not contain dangerous patterns
            expect(sanitized).not.toMatch(/\.\.[/\\]/);
            expect(sanitized).not.toMatch(/\0/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sanitize paths without introducing traversal patterns', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_/-]+$/),
          (validPath) => {
            if (validPath && !validPath.startsWith('/') && !validPath.includes('..')) {
              const sanitized = sanitizePath(validPath);
              
              // Sanitized path should be absolute (resolved)
              expect(sanitized).toBeDefined();
              
              // Should not contain any dangerous patterns
              expect(sanitized).not.toMatch(/\.\./);
              expect(sanitized).not.toMatch(/\0/);
              expect(sanitized).not.toMatch(/[<>:"|?*]/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when sanitizing invalid paths', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.includes('../')),
          (maliciousPath) => {
            expect(() => sanitizePath(maliciousPath)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle simple filenames correctly', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_-]+\.[a-z]{2,4}$/),
          (filename) => {
            const result = validatePath(filename);
            expect(result).toBe(true);

            const sanitized = sanitizePath(filename);
            expect(sanitized).toContain(filename);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isWithinWorkspace', () => {
    it('should accept paths within workspace', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 3 }),
          (pathSegments) => {
            const validPath = pathSegments.join('/');
            const result = isWithinWorkspace(validPath);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject paths outside workspace', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (rest) => {
            const pathOutside = '../' + rest;
            const result = isWithinWorkspace(pathOutside);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
