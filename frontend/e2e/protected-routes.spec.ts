import { test, expect } from '@playwright/test';

// These tests deliberately use no auth state to verify route guards redirect
// unauthenticated users to /login.
test.use({ storageState: { cookies: [], origins: [] } });

// ---------------------------------------------------------------------------
// Unauthenticated route guards
// ---------------------------------------------------------------------------
test.describe('protected routes — unauthenticated redirects', () => {
  test('unauthenticated visit to /tickets redirects to /login', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated visit to /tickets/some-id redirects to /login', async ({ page }) => {
    await page.goto('/tickets/some-nonexistent-id');
    await expect(page).toHaveURL('/login');
  });
});
