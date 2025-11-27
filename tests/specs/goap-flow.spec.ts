
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: GOAP Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await setupGeminiMock(page);
        await page.goto('/');

        // Create a new project for each test
        await page.getByTestId('wizard-idea-input').fill('GOAP Test Story');
        await page.getByTestId('wizard-title-input').fill('GOAP Adventure');
        await page.getByTestId('wizard-style-input').fill('Fantasy');
        await page.getByTestId('wizard-submit-btn').click();
        await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
    });

    test('Complete GOAP Lifecycle: Outline -> Draft -> Polish', async ({ page }) => {
        test.setTimeout(60000);

        // 1. Verify Initial State
        await expect(page.getByTestId('action-card-create_outline')).toBeVisible();
        await expect(page.getByTestId('action-card-write_chapter_parallel')).toBeDisabled();

        // 2. Create Outline (Architect)
        await page.getByTestId('action-card-create_outline').click();

        // Verify World State Update: Outline exists
        await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('chapter-item-order-2')).toBeVisible();

        // 3. Parallel Draft (Writers)
        // Precondition check: Action should now be enabled
        const writeAction = page.getByTestId('action-card-write_chapter_parallel');
        await expect(writeAction).toBeEnabled();
        await writeAction.click();

        // Verify Execution
        const consoleArea = page.locator('.bg-black\\/40');
        await expect(consoleArea).toContainText('Batch complete', { timeout: 20000 });

        // Verify World State Update: Chapters completed
        // Check if chapters have content indicator (assuming UI shows this)
        await page.getByTestId('chapter-item-order-1').click();
        await expect(page.getByTestId('chapter-content-input')).not.toBeEmpty();

        // 4. Polish Dialogue (Doctor)
        const doctorAction = page.getByTestId('action-card-dialogue_doctor');
        await expect(doctorAction).toBeVisible();
        await doctorAction.click();

        // Verify Execution
        await expect(consoleArea).toContainText('Dialogue polish complete', { timeout: 15000 });
    });

    test('Action Preconditions: Blocks actions when requirements not met', async ({ page }) => {
        // Initially, write_chapter_parallel should be disabled because there is no outline
        const writeAction = page.getByTestId('action-card-write_chapter_parallel');

        // Check if it's disabled (UI might show it as greyed out or non-clickable)
        // If the UI implements it as a disabled button:
        if (await writeAction.getAttribute('disabled') !== null) {
            await expect(writeAction).toBeDisabled();
        } else {
            // If it's just visually disabled or has a tooltip, we might need to check class or click behavior
            // For now assuming standard HTML disabled or aria-disabled
            await expect(writeAction).toBeDisabled();
        }
    });

    test('Auto-Pilot: Executes sequence automatically', async ({ page }) => {
        test.setTimeout(60000);

        // Enable Auto-Pilot
        const autoPilotToggle = page.getByTestId('autopilot-toggle');
        await autoPilotToggle.click();
        await expect(autoPilotToggle).toHaveAttribute('aria-checked', 'true');

        // It should automatically trigger create_outline
        await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 20000 });

        // Then it should trigger write_chapter_parallel
        const consoleArea = page.locator('.bg-black\\/40');
        await expect(consoleArea).toContainText('Batch complete', { timeout: 30000 });

        // Verify goal state reached (Auto-pilot turns off or logs success)
        await expect(consoleArea).toContainText('Goal Reached', { timeout: 10000 });
    });
});
