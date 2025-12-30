import { test, expect } from '@playwright/test';
test.describe('Homepage', () => {
    test('should load and display title', async ({ page }) => {
        await page.goto('/');
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        // Check title
        await expect(page).toHaveTitle(/JSON to SQL Flattener/);
        // Check main heading
        await expect(page.locator('h1')).toHaveText('JSON to SQL Flattener');
    });
});
