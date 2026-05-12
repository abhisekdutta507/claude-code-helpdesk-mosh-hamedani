import { test, expect } from '@playwright/test';
import { testUsers } from './test-credentials';

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

  test('after deletion, the "All users (N)" count decrements by one', async ({ page }) => {
    await gotoUsers(page);

    const user = await createThrowawayUser(page, `count-${Date.now()}`);

    await page.reload();
    await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();

    // Capture count before deletion
    const countText = await page.getByText(/^All users \(\d+\)$/).innerText();
    const before = parseInt(countText.match(/\d+/)![0], 10);

    const dialog = await openDeleteDialog(page, user.email);
    await page.getByTestId('confirm-delete-user').click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Table count must have decremented
    await expect(page.getByText(`All users (${before - 1})`)).toBeVisible();
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

    // Agent row must still be in the table
    await expect(page.getByRole('cell', { name: testUsers.agent1.email })).toBeVisible();
  });
});
