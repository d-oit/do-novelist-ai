/**
 * Tests for API Gateway Client
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { generateText, brainstorm, getCostInfo } from '@/lib/api-gateway/client';

describe('API Gateway Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('generateText', () => {
    it('should call API endpoint with correct parameters', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Generated text' }),
      });

      const result = await generateText({
        provider: 'mistral',
        model: 'mistral-medium-latest',
        prompt: 'Test prompt',
        system: 'System instruction',
        temperature: 0.7,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'mistral',
            model: 'mistral-medium-latest',
            prompt: 'Test prompt',
            system: 'System instruction',
            temperature: 0.7,
          }),
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data?.text).toBe('Generated text');
    });

    it('should handle API error responses', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const result = await generateText({
        provider: 'mistral',
        model: 'mistral-medium-latest',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should handle network errors', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await generateText({
        provider: 'mistral',
        model: 'mistral-medium-latest',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('brainstorm', () => {
    it('should call brainstorm API endpoint', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Brainstorm result' }),
      });

      const result = await brainstorm({
        context: 'Test context',
        field: 'title',
        provider: 'mistral',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/brainstorm',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            context: 'Test context',
            field: 'title',
            provider: 'mistral',
          }),
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data?.text).toBe('Brainstorm result');
    });

    it('should handle brainstorm API errors', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      });

      const result = await brainstorm({
        context: 'Test',
        field: 'idea',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad request');
    });
  });

  describe('getCostInfo', () => {
    it('should call cost-info API endpoint', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalCost: 1.5,
          requestCount: 25,
          budgetRemaining: 3.5,
          shouldAlert: false,
        }),
      });

      const result = await getCostInfo();

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/cost-info');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalCost: 1.5,
        requestCount: 25,
        budgetRemaining: 3.5,
        shouldAlert: false,
      });
    });

    it('should handle cost-info API errors', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const result = await getCostInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });
});
