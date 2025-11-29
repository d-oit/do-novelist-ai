/**
 * AI Integration Layer
 * Initializes analytics and health monitoring
 */

import { startHealthMonitoring } from '@/services/ai-health-service';

let healthMonitorStopper: (() => void) | null = null;

export function initializeAIMonitoring(): void {
  if (healthMonitorStopper) {
    return;
  }

  console.log('[AI Integration] Initializing AI monitoring services...');
  
  healthMonitorStopper = startHealthMonitoring(300000);
  
  console.log('[AI Integration] AI monitoring initialized');
}

export function stopAIMonitoring(): void {
  if (healthMonitorStopper) {
    healthMonitorStopper();
    healthMonitorStopper = null;
    console.log('[AI Integration] AI monitoring stopped');
  }
}
