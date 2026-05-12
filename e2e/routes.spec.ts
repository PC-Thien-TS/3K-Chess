import { test, expect } from '@playwright/test';

test.describe('Basic Routes', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Three Kingdoms Chess/i);
  });

  test('setup page loads', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.locator('h1')).toContainText(/PREPARE THE FIELD/i);
  });

  test('setup page with authentic mode loads', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    await expect(page.locator('h1')).toContainText(/PREPARE THE FIELD/i);
  });

  test('create room page loads', async ({ page }) => {
    await page.goto('/rooms/create');
    await expect(page.locator('h1')).toContainText(/ESTABLISH CLASSIC ROOM/i);
  });

  test('join room page loads', async ({ page }) => {
    await page.goto('/rooms/join');
    await expect(page.locator('h1')).toContainText(/JOIN CLASSIC ROOM/i);
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
