import { test, expect } from '@playwright/test';

test.describe('Modern 3K Local Gameplay', () => {
  test('start Authentic local match and verify board', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    
    // Verify we're on setup page with authentic mode
    await expect(page.locator('h1')).toContainText('PREPARE THE FIELD');
    
    // Verify Authentic mode is selected
    await expect(page.getByTestId('modern-3k-mode-card')).toBeVisible();
    
    // Start the match
    await page.getByRole('button', { name: /Start Local Authentic Match/i }).click();
    
    // Wait for navigation to practice board
    await page.waitForURL('/practice');
    
    // Verify board loaded
    await expect(page.getByText('Shu')).toBeVisible();
    
    // Verify Wu starts (Authentic rule)
    await expect(page.getByText('Wu')).toBeVisible();
    
    // Verify board is interactive
    const boardArea = page.getByTestId('authentic-board');
    await expect(boardArea).toBeVisible();
  });

  test('Authentic mode shows correct features', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    
    // Verify Authentic mode button is visible
    await expect(page.getByRole('button', { name: 'Modern 3K Authentic Modern' })).toBeVisible();
    
    // Verify Han court notice is shown
    await expect(page.getByTestId('han-court-status').first()).toBeVisible();
  });
});
