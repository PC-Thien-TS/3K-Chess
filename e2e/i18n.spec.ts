import { test, expect } from '@playwright/test';

test.describe('Language selector', () => {
  test('switches language and persists after refresh', async ({ page }) => {
    await page.goto('/');

    const selector = page.getByTestId('language-selector');
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue('en');

    await selector.selectOption('vi');
    await expect(page.locator('nav').getByRole('link', { name: 'Cách chơi' })).toBeVisible();

    await page.reload();
    await expect(selector).toHaveValue('vi');
    await expect(page.locator('nav').getByRole('link', { name: 'Cách chơi' })).toBeVisible();

    await selector.selectOption('zh');
    await expect(page.locator('nav').getByRole('link', { name: '玩法说明' })).toBeVisible();

    await selector.selectOption('en');
    await expect(page.locator('nav').getByRole('link', { name: 'How to Play' })).toBeVisible();
  });
});
