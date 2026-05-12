import { test, expect } from '@playwright/test';
import { login } from './helpers';

// These describe blocks override the default admin storage state (set at the project level)
// so that the tests start unauthenticated — required for login-flow tests.
const unauthenticatedState = { storageState: { cookies: [], origins: [] } };

// ---------------------------------------------------------------------------
// 1. Unauthenticated access
// ---------------------------------------------------------------------------
test.describe('unauthenticated access', () => {
  test.use(unauthenticatedState);

  test('visiting / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('login page renders title, email field, password field, and sign-in button', async ({
    page,
  }) => {
    await page.goto('/login');
    // CardTitle renders as a <div>, not an <h*>, so use getByText
    await expect(page.getByText('Helpdesk')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Client-side validation
// ---------------------------------------------------------------------------
test.describe('login page — client-side validation', () => {
  test.use(unauthenticatedState);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('submitting empty form shows validation errors for both fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('submitting with invalid email format shows email validation error', async ({ page }) => {
    await page.locator('#email').fill('not-an-email');
    await page.locator('#password').fill('somepassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    // Password error should not appear when password is filled
    await expect(page.getByText('Password is required')).not.toBeVisible();
  });

  test('submitting with valid email but empty password shows password required error', async ({
    page,
  }) => {
    await page.locator('#email').fill('user@example.com');
    // Leave password empty
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Password is required')).toBeVisible();
    // Email error should not appear when email is valid
    await expect(page.getByText('Enter a valid email address')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Happy paths
// ---------------------------------------------------------------------------
test.describe('login — happy paths', () => {
  test.use(unauthenticatedState);

  test('admin signs in with correct credentials and sees welcome message', async ({ page }) => {
    await page.goto('/login');
    await login(page, 'admin@test.local', 'TestAdmin@1234!');
    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: /welcome, admin/i })).toBeVisible();
  });

  test('agent signs in with correct credentials and is redirected to home', async ({ page }) => {
    await page.goto('/login');
    await login(page, 'agent1@test.local', 'TestAgent@1234!');
    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Already-authenticated redirect
// ---------------------------------------------------------------------------
// This test uses the default admin storage state (pre-authenticated).
// It navigates to /login and expects the already-logged-in redirect to /.
// It does NOT call sign-out, so it does not invalidate the shared session.
test.describe('already-authenticated redirect', () => {
  test('authenticated user visiting /login is redirected to /', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// 5. Failure cases
// ---------------------------------------------------------------------------
test.describe('login — failure cases', () => {
  test.use(unauthenticatedState);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('wrong password for valid email shows destructive alert', async ({ page }) => {
    await login(page, 'admin@test.local', 'WrongPassword!');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('non-existent email shows destructive alert', async ({ page }) => {
    await login(page, 'nobody@test.local', 'SomePassword@1!');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('button shows "Signing in…" and is disabled while request is in flight', async ({
    page,
  }) => {
    // Delay the auth API response so we can observe the in-flight state
    await page.route('**/api/auth/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.locator('#email').fill('admin@test.local');
    await page.locator('#password').fill('TestAdmin@1234!');

    const signInButton = page.getByRole('button', { name: 'Sign in' });
    await signInButton.click();

    // While the delayed request is in flight the button must be in loading state
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 6. Sign out
// ---------------------------------------------------------------------------
// Sign-out tests must not use the shared admin storage state because calling
// signOut deletes the session from the database, which would invalidate the
// shared session token and break other concurrently-running tests.
// Each sign-out test logs in with its own fresh session instead.
test.describe('sign out', () => {
  test.use(unauthenticatedState);

  test.beforeEach(async ({ page }) => {
    // Establish a fresh session for each sign-out test
    await page.goto('/login');
    await login(page, 'admin@test.local', 'TestAdmin@1234!');
    await page.waitForURL('/');
  });

  test('signing out from home page redirects to /login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('after signing out, navigating to / redirects back to /login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    // Attempt to navigate back to the protected route
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});
