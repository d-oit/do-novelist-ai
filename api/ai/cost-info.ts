/**
 * API Gateway - Cost Info
 * Serverless function to get cost tracking information
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import { apiLogger } from './_logger';

export const config = { runtime: 'edge' };

interface CostTrackingEntry {
  totalCost: number;
  requestCount: number;
  lastReset: number;
}

const costTrackingStore = new Map<string, CostTrackingEntry>();

const COST_LIMITS = {
  maxCostPerUserPerMonth: 5.0,
  alertThreshold: 0.8,
};

function getClientId(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  return (forwarded?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown') as string;
}

function getCostInfoForClient(clientId: string): {
  totalCost: number;
  requestCount: number;
  budgetRemaining: number;
  shouldAlert: boolean;
} {
  const entry = costTrackingStore.get(clientId);
  if (!entry) {
    return {
      totalCost: 0,
      requestCount: 0,
      budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth,
      shouldAlert: false,
    };
  }

  const shouldAlert =
    entry.totalCost >= COST_LIMITS.maxCostPerUserPerMonth * COST_LIMITS.alertThreshold;

  return {
    totalCost: entry.totalCost,
    requestCount: entry.requestCount,
    budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth - entry.totalCost,
    shouldAlert,
  };
}

// Use centralized API logger (see _logger.ts)
function log(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, unknown>,
): void {
  apiLogger.log(level, message, data);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientId = getClientId(req);
  const costInfo = getCostInfoForClient(clientId);

  log('debug', 'Cost info requested', {
    clientId,
    totalCost: costInfo.totalCost,
    requestCount: costInfo.requestCount,
  });

  res.status(200).json(costInfo);
}
