
import { test, expect } from '@playwright/test';

test.describe('Feature: Settings', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wizard is not open by default
  });

  test('Theme: Can toggle light/dark mode', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    
    // Default is Dark
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Switch to Light
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Switch to Dark
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('Database: Can toggle cloud strategy', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    
    await page.getByRole('button', { name: 'Turso Cloud' }).click();
    await expect(page.getByText('Database URL')).toBeVisible();
    
    await page.getByRole('button', { name: 'Local (Browser)' }).click();
    await expect(page.getByText('Database URL')).toBeHidden();
  });

});
