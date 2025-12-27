/**
 * Tests for API Gateway Middleware
 */

import { describe, expect, it } from 'vitest';

import {
  checkRateLimitForClient,
  calculateCostForModel,
  trackCostForClient,
  getCostInfoForClient,
  validateRequestBody,
} from '@/lib/api-gateway/middleware';

describe('API Gateway Middleware', () => {
  describe('checkRateLimitForClient', () => {
    it('should allow first request', () => {
      const result = checkRateLimitForClient(`client-first-${Date.now()}`);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it('should allow requests within limit', () => {
      const clientId = `client-within-${Date.now()}`;
      checkRateLimitForClient(clientId);
      const result = checkRateLimitForClient(clientId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(58);
    });

    it('should block requests exceeding limit', () => {
      const clientId = `client-limit-${Date.now()}`;
      for (let i = 0; i < 60; i++) {
        checkRateLimitForClient(clientId);
      }
      const result = checkRateLimitForClient(clientId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('calculateCostForModel', () => {
    it('should calculate cost for claude-3-5-sonnet', () => {
      const cost = calculateCostForModel('anthropic/claude-3-5-sonnet-20241022', 1000, 2000);
      expect(cost).toBeCloseTo(0.033, 4);
    });

    it('should calculate cost for gpt-4o-mini', () => {
      const cost = calculateCostForModel('openai/gpt-4o-mini', 1000, 2000);
      expect(cost).toBeCloseTo(0.00135, 5);
    });

    it('should use default model cost for unknown model', () => {
      const cost = calculateCostForModel('unknown/model', 1000, 2000);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('trackCostForClient', () => {
    it('should track cost for new client', () => {
      const clientId = `new-client-${Date.now()}`;
      const result = trackCostForClient(clientId, 0.01);
      expect(result.totalCost).toBeCloseTo(0.01, 4);
      expect(result.requestCount).toBe(1);
      expect(result.budgetRemaining).toBeCloseTo(4.99, 4);
      expect(result.shouldAlert).toBe(false);
    });

    it('should accumulate cost for existing client', () => {
      const clientId = `existing-client-${Date.now()}`;
      trackCostForClient(clientId, 0.01);
      const result = trackCostForClient(clientId, 0.005);
      expect(result.totalCost).toBeCloseTo(0.015, 4);
      expect(result.requestCount).toBe(2);
    });

    it('should trigger alert at threshold', () => {
      const clientId = `alert-client-${Date.now()}`;
      trackCostForClient(clientId, 4.0);
      const result = trackCostForClient(clientId, 0.01);
      expect(result.shouldAlert).toBe(true);
      expect(result.budgetRemaining).toBeLessThan(1);
    });
  });

  describe('getCostInfoForClient', () => {
    it('should return zero cost for new client', () => {
      const clientId = `new-client-info-${Date.now()}`;
      const result = getCostInfoForClient(clientId);
      expect(result.totalCost).toBe(0);
      expect(result.requestCount).toBe(0);
      expect(result.budgetRemaining).toBe(5.0);
      expect(result.shouldAlert).toBe(false);
    });

    it('should return accumulated cost for existing client', () => {
      const clientId = `existing-client-info-${Date.now()}`;
      trackCostForClient(clientId, 0.5);
      const result = getCostInfoForClient(clientId);
      expect(result.totalCost).toBeCloseTo(0.5, 4);
      expect(result.requestCount).toBe(1);
    });
  });

  describe('validateRequestBody', () => {
    it('should validate correct request body', () => {
      const body = {
        provider: 'mistral',
        model: 'mistral-medium-latest',
        prompt: 'Test prompt',
      };
      const result = validateRequestBody(body, ['provider', 'model', 'prompt']);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(body);
    });

    it('should reject missing required field', () => {
      const body = {
        provider: 'mistral',
        prompt: 'Test prompt',
      };
      const result = validateRequestBody(body, ['provider', 'model', 'prompt']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required field: model');
    });

    it('should reject non-object body', () => {
      const result = validateRequestBody('invalid', ['provider']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a valid JSON object');
    });
  });
});
