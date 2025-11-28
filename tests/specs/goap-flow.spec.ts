import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: GOAP Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await setupGeminiMock(page);
        await page.goto('/');
        await page.getByTestId('nav-new-project').click();
        await page.getByTestId('wizard-idea-input').fill('GOAP Test Story');
        await page.getByTestId('wizard-title-input').fill('GOAP Adventure');
        await page.getByTestId('wizard-style-input').fill('Fantasy');
        await page.getByTestId('wizard-submit-btn').click();
        await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
    });

    test('Complete GOAP Lifecycle: Outline -> Draft -> Polish', async ({ page }) => {
        test.setTimeout(60000);
        await expect(page.getByTestId('action-card-create_outline')).toBeVisible();
        await expect(page.getByTestId('action-card-write_chapter_parallel')).toBeDisabled();
        await page.getByTestId('action-card-create_outline').click();
        await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('chapter-item-order-2')).toBeVisible();
        const writeAction = page.getByTestId('action-card-write_chapter_parallel');
        await expect(writeAction).toBeEnabled();
        await writeAction.click();
        const consoleArea = page.locator('.bg-black\/40');
        await expect(consoleArea).toContainText('Batch complete', { timeout: 20000 });
        await page.getByTestId('chapter-item-order-1').click();
        await expect(page.getByTestId('chapter-content-input')).not.toBeEmpty();
        const doctorAction = page.getByTestId('action-card-dialogue_doctor');
        await expect(doctorAction).toBeVisible();
        await doctorAction.click();
        await expect(consoleArea).toContainText('Dialogue polish complete', { timeout: 15000 });
    });

    test('Action Preconditions: Blocks actions when requirements not met', async ({ page }) => {
        const writeAction = page.getByTestId('action-card-write_chapter_parallel');
        if (await writeAction.getAttribute('disabled') !== null) {
            await expect(writeAction).toBeDisabled();
        } else {
            await expect(writeAction).toBeDisabled();
        }
    });

    test('Auto-Pilot: Executes sequence automatically', async ({ page }) => {
        test.setTimeout(60000);
        const autoPilotToggle = page.getByTestId('autopilot-toggle');
        await autoPilotToggle.click();
        await expect(autoPilotToggle).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 20000 });
        const consoleArea = page.locator('.bg-black\/40');
        await expect(consoleArea).toContainText('Batch complete', { timeout: 30000 });
        await expect(consoleArea).toContainText('Goal Reached', { timeout: 10000 });
    });
});
