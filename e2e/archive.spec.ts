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

  test('saved Modern 3K local record opens in read-only replay', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    await page.getByRole('button', { name: /Start Local Authentic Match/i }).click();
    await page.waitForURL('/practice');

    await page.getByRole('button', { name: 'Point 3, 4' }).click();
    await page.getByRole('button', { name: 'Point 4, 4' }).click();
    await page.getByTestId('authentic-save-archive-button').click();

    await page.goto('/archive');
    await page.getByRole('button', { name: /View Replay/i }).first().click();

    await expect(page.getByTestId('authentic-replay-board')).toBeVisible();
    await expect(page.getByTestId('authentic-replay-step')).toContainText(/0 \/ \d+/);

    await page.getByTestId('authentic-replay-next').click();

    await expect(page.getByTestId('authentic-replay-step')).toContainText(/1 \/ \d+/);
    await expect(page.getByText('Han Court Neutral')).toBeVisible();
  });
});
