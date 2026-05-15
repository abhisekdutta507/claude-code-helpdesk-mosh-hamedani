import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

// All tests use the admin session injected by the chromium project.
// None of these tests call sign-out, so the shared session is never invalidated.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to /users and wait for the table to fully load. */
async function gotoUsers(page: import('@playwright/test').Page) {
  await page.goto('/users');
  await expect(page.getByText(/^All users \(\d+\)$/)).toBeVisible();
}

/** Open the Create new agent dialog via the "New agent" button. */
async function openCreateDialog(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'New agent' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.getByRole('dialog');
}

// ---------------------------------------------------------------------------
// 1. "New agent" button opens the dialog
// ---------------------------------------------------------------------------
test.describe('create user — dialog opens', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('"New agent" button opens dialog with title and all fields', async ({ page }) => {
    const dialog = await openCreateDialog(page);
    await expect(dialog.getByRole('heading', { name: 'Create new agent' })).toBeVisible();
    await expect(dialog.getByLabel('Name')).toBeVisible();
    await expect(dialog.getByLabel('Email')).toBeVisible();
    await expect(dialog.getByLabel('Password')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Happy path — create agent
// ---------------------------------------------------------------------------
test.describe('create user — happy path', () => {
  test('filling all fields and submitting creates the agent and shows email in table', async ({ page }) => {
    await gotoUsers(page);
    const dialog = await openCreateDialog(page);

    const ts = Date.now();
    const email = `new.agent.${ts}@test.local`;

    await dialog.getByLabel('Name').fill(`New Agent ${ts}`);
    await dialog.getByLabel('Email').fill(email);
    await dialog.getByLabel('Password').fill('AgentPass@1234!');

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/users') && res.request().method() === 'POST',
    );

    await dialog.getByRole('button', { name: 'Create agent' }).click();
    await responsePromise;

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Duplicate email (409)
// ---------------------------------------------------------------------------
test.describe('create user — duplicate email error', () => {
  test('409 response shows error alert and keeps dialog open', async ({ page }) => {
    await gotoUsers(page);

    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Email already in use.' }),
        });
      } else {
        await route.continue();
      }
    });

    const dialog = await openCreateDialog(page);

    await dialog.getByLabel('Name').fill('Duplicate Agent');
    await dialog.getByLabel('Email').fill('duplicate@test.local');
    await dialog.getByLabel('Password').fill('AgentPass@1234!');
    await dialog.getByRole('button', { name: 'Create agent' }).click();

    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByText('Email already in use.')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Validation — name too short
// ---------------------------------------------------------------------------
test.describe('create user — validation: name too short', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('2-character name shows inline validation error and keeps dialog open', async ({ page }) => {
    const dialog = await openCreateDialog(page);

    await dialog.getByLabel('Name').fill('ab');
    await dialog.getByLabel('Email').fill(`valid.email.${Date.now()}@test.local`);
    await dialog.getByLabel('Password').fill('AgentPass@1234!');
    await dialog.getByRole('button', { name: 'Create agent' }).click();

    await expect(dialog.getByText('Name must be at least 3 characters long')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Validation — invalid email
// ---------------------------------------------------------------------------
test.describe('create user — validation: invalid email', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('non-email value in email field shows inline validation error', async ({ page }) => {
    const dialog = await openCreateDialog(page);

    await dialog.getByLabel('Name').fill('Valid Name');
    await dialog.getByLabel('Email').fill('notanemail');
    await dialog.getByLabel('Password').fill('AgentPass@1234!');
    await dialog.getByRole('button', { name: 'Create agent' }).click();

    await expect(dialog.getByText('Invalid email address')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Validation — password too short
// ---------------------------------------------------------------------------
test.describe('create user — validation: password too short', () => {
  test.beforeEach(async ({ page }) => {
    await gotoUsers(page);
  });

  test('5-character password shows inline validation error', async ({ page }) => {
    const dialog = await openCreateDialog(page);

    await dialog.getByLabel('Name').fill('Valid Name');
    await dialog.getByLabel('Email').fill(`valid.email.${Date.now()}@test.local`);
    await dialog.getByLabel('Password').fill('short');
    await dialog.getByRole('button', { name: 'Create agent' }).click();

    await expect(dialog.getByText('Password must be at least 8 characters long')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Cancel closes dialog without adding row
// ---------------------------------------------------------------------------
test.describe('create user — cancel', () => {
  test('clicking Cancel closes dialog without adding a user row', async ({ page }) => {
    await gotoUsers(page);

    const countEl = page.getByText(/^All users \(\d+\)$/);
    const before = await countEl.innerText();

    const dialog = await openCreateDialog(page);
    await dialog.getByLabel('Name').fill('Should Not Be Added');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(before)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. In-flight button state
// ---------------------------------------------------------------------------
test.describe('create user — submit in-flight state', () => {
  test('button shows "Creating…" and is disabled while POST is in flight', async ({ page }) => {
    await gotoUsers(page);
    const dialog = await openCreateDialog(page);

    const ts = Date.now();
    await dialog.getByLabel('Name').fill(`Inflight Agent ${ts}`);
    await dialog.getByLabel('Email').fill(`inflight.${ts}@test.local`);
    await dialog.getByLabel('Password').fill('AgentPass@1234!');

    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await dialog.getByRole('button', { name: 'Create agent' }).click();

    const creatingBtn = page.getByRole('button', { name: 'Creating…' });
    await expect(creatingBtn).toBeVisible();
    await expect(creatingBtn).toBeDisabled();
  });
});
