/**
 * Minimal Playwright Global Setup for Novelist.ai
 *
 * This setup provides basic test environment initialization
 * without complex browser setup to avoid context conflicts.
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Setting up Playwright test environment...');
  console.log(`📋 Environment: ${process.env.CI ? 'CI' : 'Local'}`);

  // Validate test configuration
  if (!config.projects?.length) {
    throw new Error('No test projects configured');
  }

  console.log(`🎯 Configured projects: ${config.projects.map(p => p.name).join(', ')}`);
  console.log('✅ Test environment setup complete');
}

export default globalSetup;
