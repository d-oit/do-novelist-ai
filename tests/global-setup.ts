/**
 * Playwright Global Setup for Novelist.ai
 *
 * Simplified setup to avoid configuration conflicts
 */

import type { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Setting up Playwright test environment...');
  console.log(`📋 Environment: ${process.env.CI ? 'CI' : 'Local'}`);

  // Validate test configuration
  if (!config.projects?.length) {
    throw new Error('No test projects configured');
  }

  console.log(
    `🎯 Configured projects: ${config.projects.map((p: { name: string }) => p.name).join(', ')}`,
  );

  // In CI, ensure we have the necessary environment
  if (process.env.CI) {
    console.log('✅ CI environment detected');
  }

  console.log('✅ Test environment setup complete');
}

export default globalSetup;
