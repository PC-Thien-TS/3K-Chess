import { test, expect } from '@playwright/test';

test.describe('Modern 3K Local Gameplay', () => {
  test('start Authentic local match and verify board', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    
    // Verify we're on setup page with authentic mode
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify Authentic mode is selected
    await expect(page.getByTestId('modern-3k-mode-card')).toBeVisible();
    
    // Start the match
    await page.getByTestId('start-local-match-button').click();
    
    // Wait for navigation to practice board
    await page.waitForURL('/practice');
    
    const boardArea = page.getByTestId('authentic-board');
    await expect(boardArea).toBeVisible();
    
    // Verify Wu starts (Authentic rule)
    await expect(page.getByTestId('current-turn-banner')).toContainText('Wu');
  });

  test('Authentic mode shows correct features', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    
    // Verify Authentic mode button is visible
    await expect(page.getByTestId('modern-3k-mode-card')).toBeVisible();
    
    // Verify Han court notice is shown
    await expect(page.getByTestId('han-court-status').first()).toBeVisible();
  });
});
