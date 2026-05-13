import { test, expect } from '@playwright/test';

test.describe('Basic Routes', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Three Kingdoms Chess/i);
  });

  test('play hub loads', async ({ page }) => {
    await page.goto('/play');
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    await expect(page.getByTestId('classic-local-panel')).toBeVisible();
    await expect(page.getByTestId('classic-online-panel')).toBeVisible();
  });

  test('setup page loads', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    await expect(page.getByTestId('classic-mode-card')).toBeVisible();
  });

  test('setup page with authentic mode loads', async ({ page }) => {
    await page.goto('/setup?mode=authentic');
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    await expect(page.getByTestId('modern-3k-mode-card')).toBeVisible();
  });

  test('rooms page loads compatibility play hub', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    await expect(page.getByTestId('classic-online-panel')).toBeVisible();
    await expect(page.getByTestId('local-room-history-panel')).toBeVisible();
  });

  test('create room page loads', async ({ page }) => {
    await page.goto('/rooms/create');
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    await expect(page.getByTestId('create-room-panel').getByTestId('create-online-room-button')).toBeVisible();
  });

  test('join room page loads', async ({ page }) => {
    await page.goto('/rooms/join');
    await expect(page.getByTestId('play-hub-page')).toBeVisible();
    await expect(page.getByTestId('join-room-panel').getByTestId('join-room-button')).toBeVisible();
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
