import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { testUsers } from './test-credentials';

test('home page shows welcome message', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome, admin/i })).toBeVisible();
});

// Sign-out must use its own fresh session — calling signOut deletes the session
// from the database, which would break concurrent tests using the shared session.
// Use unauthenticated state so the test can log in fresh and own its session.
test.describe('sign out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sign out redirects to login', async ({ page }) => {
    await page.goto('/login');
    await login(page, testUsers.admin.email, testUsers.admin.password);
    await page.waitForURL('/');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');
  });
});
