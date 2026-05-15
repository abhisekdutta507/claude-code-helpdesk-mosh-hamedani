import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

// All tests use the admin session injected by the chromium project.
// None of these tests call sign-out, so the shared session is never invalidated.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoTickets(page: import('@playwright/test').Page) {
  await page.goto('/tickets');
  await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
}

async function createTicket(
  request: import('@playwright/test').APIRequestContext,
  overrides: { subject?: string; fromEmail?: string; text?: string } = {},
) {
  const ts = Date.now();
  const subject = overrides.subject ?? `Filter test ticket ${ts}`;
  const fromEmail = overrides.fromEmail ?? `filter.user.${ts}@example.com`;
  const text = overrides.text ?? `Message body for: ${subject}`;

  const res = await request.post(`${apiBaseUrl}/api/inbound/email`, {
    multipart: { from: fromEmail, subject, text },
  });
  const body = await res.json() as { ok: boolean; ticketId: string };
  return { ticketId: body.ticketId, subject, fromEmail };
}

// ---------------------------------------------------------------------------
// 1. Date range filter options
// ---------------------------------------------------------------------------
test.describe('tickets filters — date range', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTickets(page);
  });

  test('selecting "Today" updates URL with dateRange=today', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by date range' }).selectOption('today');
    await expect(page).toHaveURL(/dateRange=today/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('selecting "Last 7 days" updates URL with dateRange=last7days', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by date range' }).selectOption('last7days');
    await expect(page).toHaveURL(/dateRange=last7days/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('selecting "Last 30 days" updates URL with dateRange=last30days', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by date range' }).selectOption('last30days');
    await expect(page).toHaveURL(/dateRange=last30days/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Filter by specific agent
// ---------------------------------------------------------------------------
test.describe('tickets filters — filter by specific agent', () => {
  test('filtering by an assigned agent shows only that agent\'s ticket', async ({ page, request }) => {
    const ticket = await createTicket(request);

    // Use page.request so the session cookies are sent with the admin-authenticated request
    const agentsRes = await page.request.get(`${apiBaseUrl}/api/users`);
    const allUsers = await agentsRes.json() as Array<{ id: string; name: string; role: string }>;
    const agent = allUsers.find((u) => u.role === 'AGENT');
    expect(agent).toBeTruthy();

    await page.request.patch(`${apiBaseUrl}/api/tickets/${ticket.ticketId}/agent`, {
      data: { agentId: agent!.id },
    });

    await page.goto('/tickets');
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    await page.getByRole('combobox', { name: 'Filter by agent' }).selectOption(agent!.id);
    await expect(page).toHaveURL(new RegExp(`agentId=${agent!.id}`));
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    await expect(page.getByRole('link', { name: ticket.subject })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Clear filters removes dateRange
// ---------------------------------------------------------------------------
test.describe('tickets filters — clear filters removes dateRange', () => {
  test('clearing filters removes dateRange from URL', async ({ page }) => {
    await gotoTickets(page);

    await page.getByRole('combobox', { name: 'Filter by date range' }).selectOption('today');
    await expect(page).toHaveURL(/dateRange=today/);

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(page).not.toHaveURL(/dateRange=/);
    await expect(page.getByRole('button', { name: 'Clear filters' })).not.toBeVisible();
  });
});
