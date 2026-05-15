import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

// All tests use the admin session injected by the chromium project.
// None of these tests call sign-out, so the shared session is never invalidated.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SeededTicket = {
  ticketId: string;
  subject: string;
  fromEmail: string;
};

async function createTicket(
  request: import('@playwright/test').APIRequestContext,
  overrides: { subject?: string; fromEmail?: string; text?: string } = {},
): Promise<SeededTicket> {
  const ts = Date.now();
  const subject = overrides.subject ?? `Edit test ticket ${ts}`;
  const fromEmail = overrides.fromEmail ?? `edit.user.${ts}@example.com`;
  const text = overrides.text ?? `Message body for: ${subject}`;

  const res = await request.post(`${apiBaseUrl}/api/inbound/email`, {
    multipart: { from: fromEmail, subject, text },
  });
  const body = await res.json() as { ok: boolean; ticketId: string };
  return { ticketId: body.ticketId, subject, fromEmail };
}

/** Navigate to ticket detail and wait until the Assign agent dropdown is visible (data loaded). */
async function gotoTicketDetail(
  page: import('@playwright/test').Page,
  ticketId: string,
) {
  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('combobox', { name: 'Assign agent' })).toBeVisible();
}

// ---------------------------------------------------------------------------
// 1. Change status OPEN → RESOLVED
// ---------------------------------------------------------------------------
test.describe('ticket detail — status editing', () => {
  test('change status OPEN → RESOLVED persists after PATCH', async ({ page, request }) => {
    const ticket = await createTicket(request);
    await gotoTicketDetail(page, ticket.ticketId);

    const statusSelect = page.getByLabel('Ticket status');
    await expect(statusSelect).toHaveValue('OPEN');

    const patchDone = page.waitForResponse(
      (res) => res.url().includes(`/api/tickets/${ticket.ticketId}`) && res.request().method() === 'PATCH',
    );

    await statusSelect.selectOption('RESOLVED');
    await patchDone;

    await expect(statusSelect).toHaveValue('RESOLVED');
  });

  test('change status RESOLVED → CLOSED persists after PATCH', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await request.patch(`${apiBaseUrl}/api/tickets/${ticket.ticketId}`, {
      data: { status: 'RESOLVED' },
    });

    await gotoTicketDetail(page, ticket.ticketId);

    const statusSelect = page.getByLabel('Ticket status');
    await expect(statusSelect).toHaveValue('RESOLVED');

    const patchDone = page.waitForResponse(
      (res) => res.url().includes(`/api/tickets/${ticket.ticketId}`) && res.request().method() === 'PATCH',
    );

    await statusSelect.selectOption('CLOSED');
    await patchDone;

    await expect(statusSelect).toHaveValue('CLOSED');
  });
});

// ---------------------------------------------------------------------------
// 2. Category editing
// ---------------------------------------------------------------------------
test.describe('ticket detail — category editing', () => {
  test('change category to REFUND_REQUEST persists after PATCH', async ({ page, request }) => {
    const ticket = await createTicket(request);
    await gotoTicketDetail(page, ticket.ticketId);

    const categorySelect = page.getByLabel('Ticket category');

    const patchDone = page.waitForResponse(
      (res) => res.url().includes(`/api/tickets/${ticket.ticketId}`) && res.request().method() === 'PATCH',
    );

    await categorySelect.selectOption('REFUND_REQUEST');
    await patchDone;

    await expect(categorySelect).toHaveValue('REFUND_REQUEST');
  });

  test('clear category back to Uncategorised persists after PATCH', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await request.patch(`${apiBaseUrl}/api/tickets/${ticket.ticketId}`, {
      data: { category: 'GENERAL_QUESTION' },
    });

    await gotoTicketDetail(page, ticket.ticketId);

    const categorySelect = page.getByLabel('Ticket category');
    await expect(categorySelect).toHaveValue('GENERAL_QUESTION');

    const patchDone = page.waitForResponse(
      (res) => res.url().includes(`/api/tickets/${ticket.ticketId}`) && res.request().method() === 'PATCH',
    );

    await categorySelect.selectOption('');
    await patchDone;

    await expect(categorySelect).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// 3. Status select disabled during PATCH
// ---------------------------------------------------------------------------
test.describe('ticket detail — select disabled during update', () => {
  test('status select is disabled while PATCH is in-flight then re-enabled', async ({ page, request }) => {
    const ticket = await createTicket(request);
    await gotoTicketDetail(page, ticket.ticketId);

    const statusSelect = page.getByLabel('Ticket status');
    await expect(statusSelect).not.toBeDisabled();

    await page.route(`**/api/tickets/${ticket.ticketId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const patchDone = page.waitForResponse(
      (res) => res.url().includes(`/api/tickets/${ticket.ticketId}`) && res.request().method() === 'PATCH',
    );

    await statusSelect.selectOption('RESOLVED');

    await expect(statusSelect).toBeDisabled();

    await patchDone;

    await expect(statusSelect).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 4. Replies
// ---------------------------------------------------------------------------
test.describe('ticket detail — replies', () => {
  test('posting a reply shows it in the thread', async ({ page, request }) => {
    const ticket = await createTicket(request);
    await gotoTicketDetail(page, ticket.ticketId);

    const replyText = `This is a test reply ${Date.now()}`;
    const textarea = page.getByPlaceholder('Write a reply...');
    await textarea.fill(replyText);

    const replyDone = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/tickets/${ticket.ticketId}/replies`) &&
        res.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Send reply' }).click();
    await replyDone;

    await expect(page.getByText(replyText)).toBeVisible();
  });

  test('Send reply button is disabled when textarea is empty', async ({ page, request }) => {
    const ticket = await createTicket(request);
    await gotoTicketDetail(page, ticket.ticketId);

    await expect(page.getByRole('button', { name: 'Send reply' })).toBeDisabled();
  });

  test('Send reply button shows "Sending…" and is disabled while POST is in-flight', async ({ page, request }) => {
    const ticket = await createTicket(request);
    await gotoTicketDetail(page, ticket.ticketId);

    await page.route(`**/api/tickets/${ticket.ticketId}/replies`, async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const textarea = page.getByPlaceholder('Write a reply...');
    await textarea.fill('In-flight reply test');

    await page.getByRole('button', { name: 'Send reply' }).click();

    const sendingBtn = page.getByRole('button', { name: 'Sending…' });
    await expect(sendingBtn).toBeVisible();
    await expect(sendingBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 5. AI Summary card shown
// ---------------------------------------------------------------------------
test.describe('ticket detail — AI summary card', () => {
  test('AI Summary card is visible when ticket has a summary', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.route(`**/api/tickets/${ticket.ticketId}`, async (route) => {
      if (route.request().method() === 'GET') {
        const response = await route.fetch();
        const body = await response.json() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...body, summary: 'This is a test summary' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/tickets/${ticket.ticketId}`);
    await expect(page.getByRole('combobox', { name: 'Assign agent' })).toBeVisible();

    await expect(page.getByText('AI Summary')).toBeVisible();
    await expect(page.getByText('This is a test summary')).toBeVisible();
  });
});
