import { test, expect } from '@playwright/test';

test.describe('Basic Routes', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Three Kingdoms Chess/i);
  });

  test('setup page loads', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('classic-mode-card')).toBeVisible();
  });

  test('setup page with authentic mode loads', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('modern-3k-mode-card')).toBeVisible();
  });

  test('create room page loads', async ({ page }) => {
    await page.goto('/rooms/create');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('create-online-room-button')).toBeVisible();
  });

  test('join room page loads', async ({ page }) => {
    await page.goto('/rooms/join');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('join-room-button')).toBeVisible();
  });

  test('archive page loads', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.locator('h1')).toContainText('IMPERIAL ARCHIVES');
  });

  test('how to play page loads', async ({ page }) => {
    await page.goto('/how-to-play');
    await expect(page.locator('h1')).toContainText(/COMMAND GUIDE/i);
  });

  test('unknown route shows NotFound', async ({ page }) => {
    await page.goto('/not-real-route');
    await expect(page.locator('h1')).toContainText('Route Not Found');
  });
});
