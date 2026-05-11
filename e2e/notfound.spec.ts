import { test, expect } from '@playwright/test';

test.describe('NotFound Page', () => {
  test('unknown route shows NotFound with CTA buttons', async ({ page }) => {
    await page.goto('/not-real-route');
    
    // Verify NotFound page loaded
    await expect(page.locator('h1')).toContainText('Route Not Found');
    
    // Verify CTA buttons are present
    await expect(page.getByRole('link', { name: /Return Home/i })).toBeVisible();
  });
});
