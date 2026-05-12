import { test, expect } from '@playwright/test';
import { testUsers } from './test-credentials';

// All edit-user tests require an admin session. We rely on the project-level
// storageState (admin.json) injected by the chromium project — no explicit
// test.use() needed for the admin describes.
// None of these tests call sign-out, so the shared session is never invalidated.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to /users and wait for the table to finish loading. */
async function gotoUsers(page: import('@playwright/test').Page) {
  await page.goto('/users');
  // Wait until the "All users (N)" card title appears — signals the fetch is done
  await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();
}

/**
 * Open the edit dialog for the first row whose email cell matches `email`.
 * Returns the dialog locator so callers can chain assertions.
 */
async function openEditDialog(page: import('@playwright/test').Page, email: string) {
  // Find the table row that contains the target email cell
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: email }) });
  await row.getByRole('button', { name: 'Edit user' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

// ---------------------------------------------------------------------------
// 1. Dialog pre-fill and read-only email
// ---------------------------------------------------------------------------
test.describe('edit user dialog — pre-fill', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('opening the edit dialog pre-fills the name field with the current name', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);
    // The name input should be pre-filled with the seeded agent name
    const nameInput = dialog.getByLabel('Name');
    await expect(nameInput).not.toHaveValue('');
  });

  test('opening the edit dialog shows the email as a disabled read-only field', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);
    const emailInput = dialog.getByLabel('Email');
    await expect(emailInput).toHaveValue(testUsers.agent1.email);
    await expect(emailInput).toBeDisabled();
  });

  test('email field is not editable', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);
    const emailInput = dialog.getByLabel('Email');
    // A disabled input is not editable
    await expect(emailInput).not.toBeEditable();
  });

  test('password field is empty when dialog opens', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);
    await expect(dialog.getByLabel('Password')).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// 2. Happy path — name change
// ---------------------------------------------------------------------------
test.describe('edit user — happy path: name change', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('updating the name closes the dialog and reflects the new name in the table', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);

    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('Updated Agent Name');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    // Dialog must close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Table must show the updated name
    await expect(page.getByRole('cell', { name: 'Updated Agent Name' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Happy path — password change
// ---------------------------------------------------------------------------
test.describe('edit user — happy path: password change', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('providing a new 8+ character password submits successfully and closes dialog', async ({ page }) => {
    // Use the admin user so we don't break the agent1 password used by other tests
    const dialog = await openEditDialog(page, testUsers.admin.email);

    await dialog.getByLabel('Password').fill('NewPass@9999!');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    // Successful submit must close the dialog
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Happy path — blank password (no change)
// ---------------------------------------------------------------------------
test.describe('edit user — happy path: blank password leaves password unchanged', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('leaving password blank still succeeds and updates the name', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);

    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('BlankPwdName');

    // Leave password empty (default state)
    await expect(dialog.getByLabel('Password')).toHaveValue('');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'BlankPwdName' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Validation — name too short
// ---------------------------------------------------------------------------
test.describe('edit user — validation: name too short', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('submitting a name shorter than 3 characters shows an inline error', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);

    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('AB');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    // Inline Zod error message from the shared schema
    await expect(dialog.getByText('Name must be at least 3 characters long')).toBeVisible();

    // Dialog must remain open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('submitting an empty name shows an inline error', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);

    await dialog.getByLabel('Name').clear();

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(dialog.getByText('Name must be at least 3 characters long')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Validation — password too short
// ---------------------------------------------------------------------------
test.describe('edit user — validation: password too short', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('entering a password shorter than 8 characters shows an inline error', async ({ page }) => {
    const dialog = await openEditDialog(page, testUsers.agent1.email);

    await dialog.getByLabel('Password').fill('short');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(dialog.getByText('Password must be at least 8 characters long')).toBeVisible();

    // Dialog must remain open
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Cancel closes dialog without changes
// ---------------------------------------------------------------------------
test.describe('edit user — cancel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('clicking Cancel closes the dialog without updating the user', async ({ page }) => {
    const originalRow = page.getByRole('row').filter({
      has: page.getByRole('cell', { name: testUsers.agent1.email }),
    });
    const originalName = await originalRow.getByRole('cell').first().innerText();

    const dialog = await openEditDialog(page, testUsers.agent1.email);

    // Modify name but do not submit
    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('Should Not Be Saved');

    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Dialog must close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // The original name must still be in the table
    await expect(page.getByRole('cell', { name: originalName })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Should Not Be Saved' })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Server error handling
// ---------------------------------------------------------------------------
test.describe('edit user — server error handling', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('a 500 response from PUT /api/users/:id shows the root error alert', async ({ page }) => {
    // Intercept PUT /api/users/* and return a 500
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.continue();
      }
    });

    const dialog = await openEditDialog(page, testUsers.agent1.email);

    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('Trigger Error');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    // The root error alert must be visible inside the dialog
    await expect(dialog.getByRole('alert')).toBeVisible();

    // Dialog stays open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('a 400 validation error response shows the error message in the alert', async ({ page }) => {
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid input', details: { name: ['Name must be at least 3 characters long'] } }),
        });
      } else {
        await route.continue();
      }
    });

    const dialog = await openEditDialog(page, testUsers.agent1.email);

    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('Valid Name');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. Submit button in-flight state
// ---------------------------------------------------------------------------
test.describe('edit user — submit button loading state', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('Save changes button is disabled while request is in flight', async ({ page }) => {
    // Delay PUT requests so the loading state is observable
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    // Use admin user to avoid mutating agent1's password (other tests depend on it)
    const dialog = await openEditDialog(page, testUsers.admin.email);

    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('Loading Test Name');

    await dialog.getByRole('button', { name: 'Save changes' }).click();

    // Button text changes to "Saving…" and is disabled while the request is in flight
    const savingBtn = dialog.getByRole('button', { name: 'Saving…' });
    await expect(savingBtn).toBeVisible();
    await expect(savingBtn).toBeDisabled();
  });
});
