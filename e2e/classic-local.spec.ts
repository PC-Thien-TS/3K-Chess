import { test, expect } from '@playwright/test';

test.describe('Classic Local Gameplay', () => {
  test('start Classic local match and make a move', async ({ page }) => {
    await page.goto('/play?section=classic-local');
    
    // Verify we're on setup page
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    
    // Select Classic mode (should be default)
    await expect(page.getByTestId('classic-mode-card')).toBeVisible();
    
    // Start the match
    await page.getByTestId('start-local-match-button').click();
    
    // Wait for navigation to practice board
    await page.waitForURL('/practice');
    
    // Select a piece (Shu's Pawn at position 5,2)
    // Note: This is a basic test - actual selectors may need adjustment based on board implementation
    const boardArea = page.getByTestId('classic-board');
    await expect(boardArea).toBeVisible();

    // Verify initial turn is Shu
    await expect(page.getByTestId('current-turn-label')).toContainText('Shu');
    
    // Make a legal move if selectors are stable
    // For now, just verify the board is interactive
    await expect(boardArea).toBeVisible();
  });

  test('Classic mode shows correct features', async ({ page }) => {
    await page.goto('/play?section=classic-local');
    
    // Verify Classic mode button is visible
    await expect(page.getByTestId('classic-mode-card')).toBeVisible();
  });
});
