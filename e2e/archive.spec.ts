import { test, expect } from '@playwright/test';

test.describe('Archive Page', () => {
  test('archive page loads and shows filters', async ({ page }) => {
    await page.goto('/archive');
    
    // Verify archive page loaded
    await expect(page.getByTestId('match-archive-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('IMPERIAL ARCHIVES');
    
    // Verify filter controls are visible
    await expect(page.getByTestId('archive-search-input')).toBeVisible();
    await expect(page.getByTestId('archive-mode-filter')).toBeVisible();
    await expect(page.getByTestId('archive-source-filter')).toBeVisible();
  });
});
