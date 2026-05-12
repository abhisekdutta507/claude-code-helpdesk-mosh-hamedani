import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { testUsers } from './test-credentials';

const unauthenticatedState = { storageState: { cookies: [], origins: [] } };

// ---------------------------------------------------------------------------
// 1. Admin — nav link visibility
// ---------------------------------------------------------------------------
test.describe('admin — nav link', () => {
  // Uses the default admin storageState injected at the project level.

  test('admin sees the "Users" link in the nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  });

  test('admin can click "Helpdesk" brand link and go back to /', async ({ page }) => {
    await page.goto('/users');
    await page.getByRole('link', { name: 'Helpdesk' }).click();
    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// 2. Admin — /users page content
// ---------------------------------------------------------------------------
test.describe('admin — users page', () => {
  // Uses the default admin storageState.

  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('page renders the Users heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  test('table shows the "All users (N)" count in the card title', async ({ page }) => {
    // CardTitle is a <div>, not a heading — use getByText
    await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();
  });

  test('table has Name, Email, Role, and Joined column headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible();
  });

  test('table contains at least one row with seeded user data', async ({ page }) => {
    // The seeded admin user email must appear in the table
    await expect(page.getByRole('cell', { name: testUsers.admin.email })).toBeVisible();
    // The seeded agent user email must appear in the table
    await expect(page.getByRole('cell', { name: testUsers.agent1.email })).toBeVisible();
  });

  test('role badges are displayed for rows', async ({ page }) => {
    // At least one ADMIN badge and one AGENT badge must be visible
    // (seeded data has one of each)
    await expect(page.getByText('ADMIN').first()).toBeVisible();
    await expect(page.getByText('AGENT').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Admin — navigation to /users via nav link
// ---------------------------------------------------------------------------
test.describe('admin — navigate to users via nav', () => {
  test('clicking "Users" nav link from home navigates to /users', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Agent — nav link hidden and route guarded
// ---------------------------------------------------------------------------
test.describe('agent — access restrictions', () => {
  test.use(unauthenticatedState);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, testUsers.agent1.email, testUsers.agent1.password);
    await page.waitForURL('/');
  });

  test('agent does not see the "Users" link in the nav', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
  });

  test('agent visiting /users directly is redirected to /', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// 5. Unauthenticated — route guarded
// ---------------------------------------------------------------------------
test.describe('unauthenticated — access restrictions', () => {
  test.use(unauthenticatedState);

  test('unauthenticated user visiting /users is redirected to /login', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });
});
