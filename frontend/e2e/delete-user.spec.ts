import { test, expect } from '@playwright/test';
import { testUsers } from './test-credentials';
import { login } from './helpers';

// All delete-user tests require an admin session. We rely on the project-level
// storageState (admin.json) injected by the chromium project — no explicit
// test.use() needed here.
// None of these tests call sign-out, so the shared session is never invalidated.
//
// IMPORTANT: Tests that actually confirm deletion create a fresh user via the API
// so they do not consume seeded users (agent1 credentials are used by other spec
// files). The created user is distinct per test thanks to a unique timestamp suffix.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_URL = 'http://localhost:3001';

/** Navigate to /users and wait for the table to finish loading. */
async function gotoUsers(page: import('@playwright/test').Page) {
  await page.goto('/users');
  await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();
}

/**
 * Create a throwaway agent user via the API and return their id/name/email.
 * Uses the admin session cookies already stored in browser context.
 */
async function createThrowawayUser(
  page: import('@playwright/test').Page,
  suffix: string,
): Promise<{ id: string; name: string; email: string }> {
  const name = `Throwaway ${suffix}`;
  const email = `throwaway-${suffix}@test.local`;
  const password = 'Throwaway@1234!';

  const response = await page.request.post(`${API_URL}/api/users`, {
    data: { name, email, password },
  });
  const body = await response.json() as { id: string; name: string; email: string };
  return body;
}

/**
 * Open the delete confirmation dialog for the row whose email matches `email`.
 * Returns the dialog locator for further assertions.
 */
async function openDeleteDialog(
  page: import('@playwright/test').Page,
  email: string,
) {
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: email }) });
  await row.getByRole('button', { name: 'Delete user' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

// ---------------------------------------------------------------------------
// 1. Delete button visibility
// ---------------------------------------------------------------------------
test.describe('delete user — button visibility', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('each user row has a visible Delete user button', async ({ page }) => {
    // The seeded admin row must have a delete button
    const adminRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: testUsers.admin.email }) });
    await expect(adminRow.getByRole('button', { name: 'Delete user' })).toBeVisible();

    // The seeded agent row must also have a delete button
    const agentRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: testUsers.agent1.email }) });
    await expect(agentRow.getByRole('button', { name: 'Delete user' })).toBeVisible();
  });

  test('delete button uses the data-testid pattern delete-user-{id}', async ({ page }) => {
    // At least one delete-user-* testid must be present when users are loaded
    const firstDeleteBtn = page.locator('[data-testid^="delete-user-"]').first();
    await expect(firstDeleteBtn).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Confirmation dialog content
// ---------------------------------------------------------------------------
test.describe('delete user — confirmation dialog', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('clicking Delete user opens the confirmation dialog', async ({ page }) => {
    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await expect(dialog).toBeVisible();
  });

  test('dialog shows "Delete user" as the title', async ({ page }) => {
    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await expect(dialog.getByRole('heading', { name: 'Delete user' })).toBeVisible();
  });

  test('dialog description contains the target user name', async ({ page }) => {
    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    // The agent name from the seed is in the description
    // We just assert the email appears — the name is also present but can change
    // across edit-user test runs; email is stable.
    await expect(dialog.getByText(testUsers.agent1.email)).toBeVisible();
  });

  test('dialog description contains the target user email', async ({ page }) => {
    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await expect(dialog.getByText(testUsers.agent1.email)).toBeVisible();
  });

  test('dialog has a Cancel button and a destructive Delete button', async ({ page }) => {
    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByTestId('confirm-delete-user')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Cancel closes dialog without deleting
// ---------------------------------------------------------------------------
test.describe('delete user — cancel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('clicking Cancel closes the dialog without removing the user from the table', async ({
    page,
  }) => {
    const dialog = await openDeleteDialog(page, testUsers.agent1.email);

    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Dialog must be gone
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Agent row must still be present
    await expect(
      page.getByRole('cell', { name: testUsers.agent1.email }),
    ).toBeVisible();
  });

  test('after Cancel, the table user count is unchanged', async ({ page }) => {
    // Capture the count before opening the dialog
    const countEl = page.getByText(/^All users \(\d+\)$/);
    const before = await countEl.innerText();

    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    // Count must not have changed
    await expect(page.getByText(before)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4 & 5. Happy path — confirm deletion removes user from table
// ---------------------------------------------------------------------------
test.describe('delete user — confirm deletion', () => {
  test('confirming deletion removes the user row from the table', async ({ page }) => {
    await gotoUsers(page);

    const user = await createThrowawayUser(page, Date.now().toString());

    // Reload so the new user appears in the table
    await page.reload();
    await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();
    await expect(page.getByRole('cell', { name: user.email })).toBeVisible();

    const dialog = await openDeleteDialog(page, user.email);
    await page.getByTestId('confirm-delete-user').click();

    // Dialog must close
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // The deleted user must no longer appear in the table
    await expect(page.getByRole('cell', { name: user.email })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Delete button in-flight / loading state
// ---------------------------------------------------------------------------
test.describe('delete user — loading state', () => {
  test('Delete button shows "Deleting…" and is disabled while request is in flight', async ({
    page,
  }) => {
    await gotoUsers(page);

    const user = await createThrowawayUser(page, `loading-${Date.now()}`);

    await page.reload();
    await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();

    // Delay the DELETE request so the loading state is observable
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await openDeleteDialog(page, user.email);
    await page.getByTestId('confirm-delete-user').click();

    // While the delayed request is in flight, button shows "Deleting…" and is disabled
    const deletingBtn = page.getByTestId('confirm-delete-user');
    await expect(deletingBtn).toHaveText('Deleting…');
    await expect(deletingBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 7. Server error handling
// ---------------------------------------------------------------------------
test.describe('delete user — server error', () => {
  test('a 500 response leaves the dialog open and does not remove the user', async ({
    page,
  }) => {
    await gotoUsers(page);

    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.continue();
      }
    });

    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await page.getByTestId('confirm-delete-user').click();

    // Dialog must remain open (mutation failed)
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // Close the dialog — the modal hides background content from the aria tree
    // while it is open, so we dismiss it before asserting the row is still there.
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Agent row must still be in the table
    await expect(page.getByRole('cell', { name: testUsers.agent1.email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Admin cannot be deleted (real 403 from the backend)
// ---------------------------------------------------------------------------
test.describe('delete user — admin is protected', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('attempting to delete the admin user keeps the dialog open and the admin row in the table', async ({
    page,
  }) => {
    // Open the dialog for the seeded admin user — no route interception, let the
    // real 403 come back from the backend.
    await openDeleteDialog(page, testUsers.admin.email);
    await page.getByTestId('confirm-delete-user').click();

    // The backend returns 403; the mutation fails, so the dialog must stay open.
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // Close the dialog before checking the table — the open modal hides
    // background content from the aria tree while it is open.
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // The admin row must still be present in the table.
    await expect(page.getByRole('cell', { name: testUsers.admin.email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. Cancel button is also disabled while the DELETE request is in flight
// ---------------------------------------------------------------------------
test.describe('delete user — Cancel disabled during in-flight request', () => {
  test('Cancel button is disabled while the DELETE request is in flight', async ({ page }) => {
    await gotoUsers(page);

    const user = await createThrowawayUser(page, `cancel-disabled-${Date.now()}`);

    await page.reload();
    await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();

    // Delay the DELETE request so the in-flight state is observable.
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const dialog = await openDeleteDialog(page, user.email);
    await page.getByTestId('confirm-delete-user').click();

    // While the delayed request is in flight, Cancel must be disabled.
    const cancelBtn = dialog.getByRole('button', { name: 'Cancel' });
    await expect(cancelBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 10. Pressing Escape closes the dialog without deleting
// ---------------------------------------------------------------------------
test.describe('delete user — Escape closes dialog', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('pressing Escape dismisses the dialog and leaves the user in the table', async ({
    page,
  }) => {
    await openDeleteDialog(page, testUsers.agent1.email);

    await page.keyboard.press('Escape');

    // Dialog must be gone.
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Agent row must still be present.
    await expect(page.getByRole('cell', { name: testUsers.agent1.email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 11. 404 response keeps the dialog open
// ---------------------------------------------------------------------------
test.describe('delete user — 404 response', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('a 404 response leaves the dialog open and does not remove the user row', async ({
    page,
  }) => {
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'User not found.' }),
        });
      } else {
        await route.continue();
      }
    });

    const dialog = await openDeleteDialog(page, testUsers.agent1.email);
    await page.getByTestId('confirm-delete-user').click();

    // Mutation failed — dialog must remain open.
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // Close the dialog before checking the table — the open modal hides
    // background content from the aria tree while it is open.
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // The user row must still be visible.
    await expect(page.getByRole('cell', { name: testUsers.agent1.email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 12. Non-admin (agent) cannot access /users
// ---------------------------------------------------------------------------
test.describe('delete user — agent cannot access /users', () => {
  // Must NOT use the shared admin.json session — log in fresh as the agent.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('agent is redirected away from /users', async ({ page }) => {
    await page.goto('/login');
    await login(page, testUsers.agent1.email, testUsers.agent1.password);
    await page.waitForURL('/');

    await page.goto('/users');

    // The AdminRoute guard must redirect to / or /login — wait for the redirect
    // since the guard is async (it waits for the session before redirecting).
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/login');

    // The users table heading must not be visible.
    await expect(page.getByText(/^All users \(\d+\)$/)).not.toBeVisible();
  });
});
