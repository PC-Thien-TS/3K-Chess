import { test, expect } from '@playwright/test';

test.describe('Language selector', () => {
  test('switches language and persists after refresh', async ({ page }) => {
    await page.goto('/');

    const selector = page.getByTestId('language-selector');
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue('vi');
    await expect(page.locator('nav').getByRole('link', { name: 'Cách chơi' })).toBeVisible();

    await selector.selectOption('en');
    await expect(page.locator('nav').getByRole('link', { name: 'How to Play' })).toBeVisible();

    await page.reload();
    await expect(selector).toHaveValue('en');
    await expect(page.locator('nav').getByRole('link', { name: 'How to Play' })).toBeVisible();

    await selector.selectOption('zh');
    await expect(page.locator('nav').getByRole('link', { name: '玩法说明' })).toBeVisible();

    await selector.selectOption('vi');
    await expect(page.locator('nav').getByRole('link', { name: 'Cách chơi' })).toBeVisible();
  });

  test('invalid stored language falls back to Vietnamese', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('threeKingdomsChess.language', 'fr');
    });

    await page.goto('/');

    await expect(page.getByTestId('language-selector')).toHaveValue('vi');
    await expect(page.locator('nav').getByRole('link', { name: 'Cách chơi' })).toBeVisible();
  });
});
