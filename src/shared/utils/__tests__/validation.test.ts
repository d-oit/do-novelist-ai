import { describe, expect, it } from 'vitest';
import {
  MAX_CHAPTER_SUMMARY_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_IDEA_LENGTH,
  MAX_STYLE_LENGTH,
  MAX_TITLE_LENGTH,
  validateBatch,
  validateChapterContent,
  validateChapterSummary,
  validateChapterTitle,
  validateIdea,
  validateInput,
  validateProjectTitle,
  validateStyle,
  validateURL,
  validateWordCount,
  ValidationError,
} from './validation';

describe('Validation Utilities', () => {
  describe('validateChapterTitle', () => {
    it('should validate valid chapter titles', () => {
      expect(validateChapterTitle('Chapter 1: The Beginning')).toBe('Chapter 1: The Beginning');
      expect(validateChapterTitle('A')).toBe('A');
      expect(validateChapterTitle('Title with 123 numbers')).toBe('Title with 123 numbers');
    });

    it('should reject empty or whitespace-only titles', () => {
      expect(() => validateChapterTitle('')).toThrow(ValidationError);
      expect(() => validateChapterTitle('   ')).toThrow(ValidationError);
      expect(() => validateChapterTitle('\t\n')).toThrow(ValidationError);
    });

    it('should reject titles that are too long', () => {
      const longTitle = 'A'.repeat(MAX_TITLE_LENGTH + 1);
      expect(() => validateChapterTitle(longTitle)).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateChapterTitle('Title\x00\x01\x02')).toBe('Title');
      expect(validateChapterTitle('Title\x0B\x0C\x0E')).toBe('Title');
    });

    it('should trim whitespace', () => {
      expect(validateChapterTitle('  Title  ')).toBe('Title');
    });
  });

  describe('validateProjectTitle', () => {
    it('should validate valid project titles', () => {
      expect(validateProjectTitle('My Novel')).toBe('My Novel');
      expect(validateProjectTitle('Project X')).toBe('Project X');
    });

    it('should reject empty or whitespace-only titles', () => {
      expect(() => validateProjectTitle('')).toThrow(ValidationError);
      expect(() => validateProjectTitle('   ')).toThrow(ValidationError);
    });

    it('should reject titles that are too long', () => {
      const longTitle = 'A'.repeat(MAX_TITLE_LENGTH + 1);
      expect(() => validateProjectTitle(longTitle)).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateProjectTitle('Title\x00\x01')).toBe('Title');
    });
  });

  describe('validateStyle', () => {
    it('should validate valid styles', () => {
      expect(validateStyle('Fantasy Adventure')).toBe('Fantasy Adventure');
      expect(validateStyle('Sci-Fi Thriller')).toBe('Sci-Fi Thriller');
    });

    it('should reject empty or whitespace-only styles', () => {
      expect(() => validateStyle('')).toThrow(ValidationError);
      expect(() => validateStyle('   ')).toThrow(ValidationError);
    });

    it('should reject styles that are too long', () => {
      const longStyle = 'A'.repeat(MAX_STYLE_LENGTH + 1);
      expect(() => validateStyle(longStyle)).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateStyle('Style\x00\x01')).toBe('Style');
    });
  });

  describe('validateIdea', () => {
    it('should validate valid ideas', () => {
      expect(validateIdea('A story about a hero')).toBe('A story about a hero');
      expect(validateIdea('In a world where...')).toBe('In a world where...');
    });

    it('should reject empty or whitespace-only ideas', () => {
      expect(() => validateIdea('')).toThrow(ValidationError);
      expect(() => validateIdea('   ')).toThrow(ValidationError);
    });

    it('should reject ideas shorter than 10 characters', () => {
      expect(() => validateIdea('Short')).toThrow(ValidationError);
      expect(() => validateIdea('123456789')).toThrow(ValidationError);
    });

    it('should reject ideas that are too long', () => {
      const longIdea = 'A'.repeat(MAX_IDEA_LENGTH + 1);
      expect(() => validateIdea(longIdea)).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateIdea('A book idea\x00\x01')).toBe('A book idea');
    });
  });

  describe('validateChapterSummary', () => {
    it('should validate valid summaries', () => {
      expect(validateChapterSummary("This chapter explores the hero's journey")).toBe(
        "This chapter explores the hero's journey"
      );
    });

    it('should reject empty or whitespace-only summaries', () => {
      expect(() => validateChapterSummary('')).toThrow(ValidationError);
      expect(() => validateChapterSummary('   ')).toThrow(ValidationError);
    });

    it('should reject summaries that are too long', () => {
      const longSummary = 'A'.repeat(MAX_CHAPTER_SUMMARY_LENGTH + 1);
      expect(() => validateChapterSummary(longSummary)).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateChapterSummary('Summary\x00\x01')).toBe('Summary');
    });
  });

  describe('validateChapterContent', () => {
    it('should validate valid content', () => {
      expect(validateChapterContent('Some content')).toBe('Some content');
      expect(validateChapterContent('')).toBe(''); // Empty content is allowed
    });

    it('should reject content that is too long', () => {
      const longContent = 'A'.repeat(MAX_CONTENT_LENGTH + 1);
      expect(() => validateChapterContent(longContent)).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateChapterContent('Content\x00\x01\x02')).toBe('Content');
    });
  });

  describe('validateWordCount', () => {
    it('should validate valid word counts', () => {
      expect(validateWordCount(1000)).toBe(1000);
      expect(validateWordCount(50000)).toBe(50000);
      expect(validateWordCount(500000)).toBe(500000);
    });

    it('should reject non-integer values', () => {
      expect(() => validateWordCount(1000.5)).toThrow(ValidationError);
      expect(() => validateWordCount(NaN)).toThrow(ValidationError);
    });

    it('should reject word counts that are too low', () => {
      expect(() => validateWordCount(999)).toThrow(ValidationError);
      expect(() => validateWordCount(0)).toThrow(ValidationError);
    });

    it('should reject word counts that are too high', () => {
      expect(() => validateWordCount(500001)).toThrow(ValidationError);
    });
  });

  describe('validateURL', () => {
    it('should validate valid URLs', () => {
      expect(validateURL('https://example.com')).toBe('https://example.com');
      expect(validateURL('http://example.com')).toBe('http://example.com');
      expect(validateURL('https://example.com/path?query=value')).toBe(
        'https://example.com/path?query=value'
      );
    });

    it('should reject empty URLs', () => {
      expect(() => validateURL('')).toThrow(ValidationError);
      expect(() => validateURL('   ')).toThrow(ValidationError);
    });

    it('should reject invalid protocols', () => {
      expect(() => validateURL('javascript:alert(1)')).toThrow(ValidationError);
      expect(() => validateURL('data:text/html,<script>alert(1)</script>')).toThrow(
        ValidationError
      );
      expect(() => validateURL('ftp://example.com')).toThrow(ValidationError);
    });

    it('should reject malformed URLs', () => {
      expect(() => validateURL('not-a-url')).toThrow(ValidationError);
      expect(() => validateURL('://invalid')).toThrow(ValidationError);
    });

    it('should trim whitespace', () => {
      expect(validateURL('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('validateInput', () => {
    it('should validate required inputs', () => {
      expect(validateInput('test')).toBe('test');
      expect(() => validateInput('')).toThrow(ValidationError);
      expect(() => validateInput('   ')).toThrow(ValidationError);
    });

    it('should validate optional inputs', () => {
      expect(validateInput('', { required: false })).toBe('');
      expect(validateInput('   ', { required: false })).toBe('');
      expect(validateInput('test', { required: false })).toBe('test');
    });

    it('should validate length constraints', () => {
      expect(() => validateInput('a', { minLength: 2 })).toThrow(ValidationError);
      expect(() => validateInput('abc', { maxLength: 2 })).toThrow(ValidationError);
      expect(validateInput('ab', { minLength: 1, maxLength: 3 })).toBe('ab');
    });

    it('should validate patterns', () => {
      expect(validateInput('123', { pattern: /^\d+$/ })).toBe('123');
      expect(() => validateInput('abc', { pattern: /^\d+$/ })).toThrow(ValidationError);
    });

    it('should validate custom validators', () => {
      const customValidator = (value: string) => value.includes('test');
      expect(validateInput('this is a test', { customValidator })).toBe('this is a test');
      expect(() => validateInput('no match here', { customValidator })).toThrow(ValidationError);
    });

    it('should sanitize control characters', () => {
      expect(validateInput('test\x00\x01')).toBe('test');
    });

    it('should trim whitespace', () => {
      expect(validateInput('  test  ')).toBe('test');
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple fields successfully', () => {
      const result = validateBatch([
        { field: 'title', validate: () => validateChapterTitle('Test Title') },
        { field: 'content', validate: () => validateChapterContent('Test content') },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.values).toEqual({
        title: 'Test Title',
        content: 'Test content',
      });
    });

    it('should handle validation errors', () => {
      const result = validateBatch([
        { field: 'title', validate: () => validateChapterTitle('') },
        { field: 'content', validate: () => validateChapterContent('Valid content') },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title cannot be empty');
      expect(result.values.content).toBe('Valid content');
    });

    it('should handle exceptions during validation', () => {
      const result = validateBatch([
        {
          field: 'test',
          validate: () => {
            throw new Error('Custom error');
          },
        },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.test).toBe('Validation failed');
    });
  });

  describe('ValidationError', () => {
    it('should create validation errors with proper structure', () => {
      const error = new ValidationError('Test message', 'field', 'code');
      expect(error.message).toBe('Test message');
      expect(error.field).toBe('field');
      expect(error.code).toBe('code');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('Constants', () => {
    it('should export correct length limits', () => {
      expect(MAX_TITLE_LENGTH).toBe(200);
      expect(MAX_STYLE_LENGTH).toBe(100);
      expect(MAX_IDEA_LENGTH).toBe(10000);
      expect(MAX_CONTENT_LENGTH).toBe(100000);
      expect(MAX_CHAPTER_SUMMARY_LENGTH).toBe(5000);
    });
  });
});
