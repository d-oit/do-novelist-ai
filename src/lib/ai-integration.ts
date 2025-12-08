/**
 * AI Integration Layer
 * Initializes analytics and health monitoring
 */

import { startHealthMonitoring } from '@/services/ai-health-service';
import { logger } from '@/lib/logging/logger';

let healthMonitorStopper: (() => void) | null = null;

export function initializeAIMonitoring(userId: string = 'system'): void {
  if (healthMonitorStopper) {
    return;
  }

  logger.info('Initializing AI monitoring services...', { userId });

  startHealthMonitoring(userId);
  healthMonitorStopper = (): void => {
    // No-op: health monitoring runs automatically
  };

  logger.info('AI monitoring initialized');
}

export function stopAIMonitoring(): void {
  if (healthMonitorStopper) {
    healthMonitorStopper();
    healthMonitorStopper = null;
    logger.info('AI monitoring stopped');
  }
}
