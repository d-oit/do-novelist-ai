/**
 * AI Integration Layer
 * Initializes analytics and health monitoring
 */

import { startHealthMonitoring } from '@/services/ai-health-service';

let healthMonitorStopper: (() => void) | null = null;

export function initializeAIMonitoring(userId: string = 'system'): void {
  if (healthMonitorStopper) {
    return;
  }

  console.log('[AI Integration] Initializing AI monitoring services...');

  startHealthMonitoring(userId);
  healthMonitorStopper = () => {
    // No-op: health monitoring runs automatically
  };

  console.log('[AI Integration] AI monitoring initialized');
}

export function stopAIMonitoring(): void {
  if (healthMonitorStopper) {
    healthMonitorStopper();
    healthMonitorStopper = null;
    console.log('[AI Integration] AI monitoring stopped');
  }
}
