import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to /tickets and wait until the data card title is visible.
 * The CardTitle shows "N tickets" once data has loaded.
 */
async function gotoTickets(page: import('@playwright/test').Page) {
  await page.goto('/tickets');
  await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
}

type SeededTicket = {
  ticketId: string;
  subject: string;
  fromEmail: string;
};

/**
 * Create a ticket via the inbound email webhook and return its id + metadata.
 */
async function createTicket(
  request: import('@playwright/test').APIRequestContext,
  overrides: { subject?: string; fromEmail?: string; text?: string } = {},
): Promise<SeededTicket> {
  const ts = Date.now();
  const subject = overrides.subject ?? `Test ticket ${ts}`;
  const fromEmail = overrides.fromEmail ?? `user.${ts}@example.com`;
  const text = overrides.text ?? `Message body for: ${subject}`;

  const res = await request.post(`${apiBaseUrl}/api/inbound/email`, {
    multipart: { from: fromEmail, subject, text },
  });
  const body = await res.json() as { ok: boolean; ticketId: string };
  return { ticketId: body.ticketId, subject, fromEmail };
}

/**
 * Get all non-empty agent options from the "Assign agent" dropdown.
 * The page must already be navigated to a ticket detail page where the
 * dropdown is visible.
 */
async function getAgentOptions(
  page: import('@playwright/test').Page,
): Promise<{ value: string; label: string }[]> {
  const agentSelect = page.getByRole('combobox', { name: 'Assign agent' });
  await expect(agentSelect).toBeVisible();
  const options = await agentSelect.locator('option').all();
  const results: { value: string; label: string }[] = [];
  for (const opt of options) {
    const value = await opt.getAttribute('value');
    const label = await opt.textContent();
    if (value && value !== '') {
      results.push({ value, label: label?.trim() ?? '' });
    }
  }
  return results;
}

/**
 * Locator for the "Go to previous page" pagination button.
 * PaginationPrevious renders as a Button (role=button) with aria-label "Go to previous page".
 */
function prevPageBtn(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: 'Go to previous page' });
}

/**
 * Locator for the "Go to next page" pagination button.
 */
function nextPageBtn(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: 'Go to next page' });
}

// ---------------------------------------------------------------------------
// 1. Tickets filtering
// ---------------------------------------------------------------------------
test.describe('tickets filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('filter by status OPEN updates URL param', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('OPEN');
    await expect(page).toHaveURL(/status=OPEN/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('filter by status RESOLVED updates URL param', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('RESOLVED');
    await expect(page).toHaveURL(/status=RESOLVED/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('filter by status CLOSED updates URL param', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('CLOSED');
    await expect(page).toHaveURL(/status=CLOSED/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('filter by category GENERAL_QUESTION updates URL param', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('GENERAL_QUESTION');
    await expect(page).toHaveURL(/category=GENERAL_QUESTION/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('filter by category TECHNICAL_QUESTION updates URL param', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('TECHNICAL_QUESTION');
    await expect(page).toHaveURL(/category=TECHNICAL_QUESTION/);
  });

  test('filter by category REFUND_REQUEST updates URL param', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('REFUND_REQUEST');
    await expect(page).toHaveURL(/category=REFUND_REQUEST/);
  });

  test('filter by agent Unassigned updates URL with agentId=unassigned', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by agent' }).selectOption('unassigned');
    await expect(page).toHaveURL(/agentId=unassigned/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
  });

  test('search by subject fires API request with search param and updates URL', async ({ page, request }) => {
    const uniqueSubject = `UniqueSearchSubject${Date.now()}`;
    await createTicket(request, { subject: uniqueSubject });

    await page.goto('/tickets');
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    const searchInput = page.getByPlaceholder('Search subject or email…');

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/tickets') && req.url().includes('search='),
    );

    await searchInput.fill(uniqueSubject);
    await searchInput.press('Enter');

    await requestPromise;

    await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(uniqueSubject)}`));
    await expect(page.getByRole('link', { name: uniqueSubject })).toBeVisible();
  });

  test('search commits on blur', async ({ page, request }) => {
    const uniqueSubject = `BlurSearch${Date.now()}`;
    await createTicket(request, { subject: uniqueSubject });

    await page.goto('/tickets');
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    const searchInput = page.getByPlaceholder('Search subject or email…');

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/tickets') && req.url().includes('search='),
    );

    await searchInput.fill(uniqueSubject);
    await searchInput.press('Tab');

    await requestPromise;

    await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(uniqueSubject)}`));
  });

  test('clear filters button appears when a filter is active', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('OPEN');
    await expect(page).toHaveURL(/status=OPEN/);

    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('clear filters button is not visible when no filters are active', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Clear filters' })).not.toBeVisible();
  });

  test('clicking clear filters removes all filter params from URL', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('OPEN');
    await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('TECHNICAL_QUESTION');

    await expect(page).toHaveURL(/status=OPEN/);
    await expect(page).toHaveURL(/category=TECHNICAL_QUESTION/);

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(page).not.toHaveURL(/status=/);
    await expect(page).not.toHaveURL(/category=/);
    await expect(page.getByRole('button', { name: 'Clear filters' })).not.toBeVisible();
  });

  test('no tickets message shown when search matches nothing', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search subject or email…');
    await searchInput.fill('zzz_no_match_xyzzy_99999');
    await searchInput.press('Enter');

    await expect(page.getByText('No tickets match the current filters.')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Tickets pagination
// ---------------------------------------------------------------------------
test.describe('tickets pagination', () => {
  /**
   * Seed 12 tickets so total > PAGE_SIZE (10), ensuring pagination controls appear.
   * Uses unique subjects to avoid collision across parallel test workers.
   */
  async function seedPaginationTickets(
    request: import('@playwright/test').APIRequestContext,
  ): Promise<string> {
    // A unique marker used in subject names so we can filter to exactly these tickets
    const marker = `PagTest${Date.now()}`;
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        createTicket(request, {
          subject: `${marker}-${i}`,
          fromEmail: `paguser${marker}${i}@example.com`,
        }),
      ),
    );
    return marker;
  }

  test('pagination controls appear when there are more than 10 tickets', async ({ page, request }) => {
    const marker = await seedPaginationTickets(request);

    // Filter to just the seeded tickets so the count is reliably > 10
    await page.goto(`/tickets?search=${encodeURIComponent(marker)}`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    await expect(prevPageBtn(page)).toBeVisible();
    await expect(nextPageBtn(page)).toBeVisible();
  });

  test('Previous button is disabled on page 1', async ({ page, request }) => {
    const marker = await seedPaginationTickets(request);

    await page.goto(`/tickets?search=${encodeURIComponent(marker)}`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    // On page 1 the button is disabled via [disabled] attribute
    await expect(prevPageBtn(page)).toBeDisabled();
  });

  test('clicking page 2 button updates URL to page=2', async ({ page, request }) => {
    const marker = await seedPaginationTickets(request);

    await page.goto(`/tickets?search=${encodeURIComponent(marker)}`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    // Page number buttons in the pagination list (e.g. "1", "2")
    const page2Btn = page.getByRole('button', { name: '2', exact: true });
    await expect(page2Btn).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/tickets') && res.url().includes('page=2'),
    );

    await page2Btn.click();
    await responsePromise;

    await expect(page).toHaveURL(/page=2/);
  });

  test('clicking Next from page 1 navigates to page 2', async ({ page, request }) => {
    const marker = await seedPaginationTickets(request);

    await page.goto(`/tickets?search=${encodeURIComponent(marker)}`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/tickets') && res.url().includes('page=2'),
    );

    await nextPageBtn(page).click();
    await responsePromise;

    await expect(page).toHaveURL(/page=2/);
  });

  test('Next button is disabled on the last page', async ({ page, request }) => {
    const marker = await seedPaginationTickets(request);

    // With 12 results, page 2 is the last page
    await page.goto(`/tickets?search=${encodeURIComponent(marker)}&page=2`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    await expect(nextPageBtn(page)).toBeDisabled();
  });

  test('clicking Previous from page 2 navigates back to page 1', async ({ page, request }) => {
    const marker = await seedPaginationTickets(request);

    await page.goto(`/tickets?search=${encodeURIComponent(marker)}&page=2`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
    // Verify we are on page 2: Next button should be visible and Previous should be enabled
    await expect(prevPageBtn(page)).not.toBeDisabled();

    await prevPageBtn(page).click();

    // Page 1 removes the page= param from the URL
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();
    await expect(prevPageBtn(page)).toBeDisabled();
  });

  test('pagination controls do not appear when results fit on one page', async ({ page, request }) => {
    // Seed a single uniquely-named ticket and search for it — exactly 1 result
    const uniqueSubject = `SingleResult${Date.now()}`;
    await createTicket(request, { subject: uniqueSubject });

    await page.goto(`/tickets?search=${encodeURIComponent(uniqueSubject)}`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    await expect(prevPageBtn(page)).not.toBeVisible();
    await expect(nextPageBtn(page)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. View ticket detail
// ---------------------------------------------------------------------------
test.describe('view ticket detail', () => {
  test('clicking a subject link in the list navigates to the detail page', async ({ page, request }) => {
    const subject = `Detail nav test ${Date.now()}`;
    const ticket = await createTicket(request, { subject });

    // Use search to ensure the ticket is visible on page 1
    await page.goto(`/tickets?search=${encodeURIComponent(subject)}`);
    await expect(page.getByText(/\d+ tickets?/)).toBeVisible();

    await page.getByRole('link', { name: subject }).click();

    await expect(page).toHaveURL(new RegExp(`/tickets/${ticket.ticketId}`));
  });

  test('detail page shows the ticket subject in the card title', async ({ page, request }) => {
    const subject = `Detail subject test ${Date.now()}`;
    const ticket = await createTicket(request, { subject });

    await page.goto(`/tickets/${ticket.ticketId}`);

    // The subject appears in the CardTitle — use the data-slot attribute to scope it
    await expect(page.locator('[data-slot="card-title"]').first()).toHaveText(subject);
  });

  test('detail page shows the OPEN status badge for a new ticket', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    await expect(page.getByLabel('Ticket status')).toHaveValue('OPEN');
  });

  test('detail page shows the from email address', async ({ page, request }) => {
    const fromEmail = `detail.from.${Date.now()}@example.com`;
    const ticket = await createTicket(request, { fromEmail });

    await page.goto(`/tickets/${ticket.ticketId}`);

    await expect(page.getByText(fromEmail)).toBeVisible();
  });

  test('detail page shows the "From" and "Category" labels', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    await expect(page.getByText('From')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
  });

  test('detail page shows the "Created" date label', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    await expect(page.getByText('Created')).toBeVisible();
  });

  test('detail page shows the message body', async ({ page, request }) => {
    const bodyText = `My custom body text ${Date.now()}`;
    const ticket = await createTicket(request, { text: bodyText });

    await page.goto(`/tickets/${ticket.ticketId}`);

    await expect(page.getByText(bodyText)).toBeVisible();
  });

  test('AI Summary card is not shown for tickets without a summary', async ({ page, request }) => {
    // Tickets created via webhook in test mode do not get an AI summary
    // (no Claude API key in test env), so the card should be absent.
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    // The assign-agent dropdown only renders once data has fully loaded (skeleton disappears)
    await expect(page.getByRole('combobox', { name: 'Assign agent' })).toBeVisible();

    await expect(page.getByText('AI Summary')).not.toBeVisible();
  });

  test('back to tickets link returns to the list page', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);
    await expect(page.getByRole('combobox', { name: 'Assign agent' })).toBeVisible();

    await page.getByRole('link', { name: /Back to tickets/ }).click();

    await expect(page).toHaveURL('/tickets');
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
  });

  test('"Assigned agent" dropdown is visible on the detail page', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    await expect(page.getByRole('combobox', { name: 'Assign agent' })).toBeVisible();
  });

  test('navigating to a non-existent ticket ID shows an error message', async ({ page }) => {
    // Use a CUID-shaped id that does not exist in the DB.
    // The backend returns 404; axios throws; TanStack Query sets isError=true.
    const nonExistentId = 'cmp0000000000000000000000a';

    await page.goto(`/tickets/${nonExistentId}`);

    // Give React time to receive the 404 response and re-render
    await expect(page.getByText('Failed to load ticket.')).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 4. Assign ticket
// ---------------------------------------------------------------------------
test.describe('assign ticket', () => {
  test('selecting an agent from the dropdown issues a PATCH request and reflects the new value', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    const agentSelect = page.getByRole('combobox', { name: 'Assign agent' });
    await expect(agentSelect).toBeVisible();
    // Initially unassigned
    await expect(agentSelect).toHaveValue('');

    // Get non-empty agent options from the dropdown
    const agentOptions = await getAgentOptions(page);
    expect(agentOptions.length).toBeGreaterThan(0);

    const { value: agentId } = agentOptions[0];

    // Intercept the PATCH request
    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/tickets/${ticket.ticketId}/agent`) && res.request().method() === 'PATCH',
    );

    await agentSelect.selectOption(agentId);
    await patchPromise;

    await expect(agentSelect).toHaveValue(agentId);
  });

  test('selecting Unassigned after assigning an agent clears the assignment', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    const agentSelect = page.getByRole('combobox', { name: 'Assign agent' });
    await expect(agentSelect).toBeVisible();

    // First assign an agent
    const agentOptions = await getAgentOptions(page);
    expect(agentOptions.length).toBeGreaterThan(0);
    const { value: agentId } = agentOptions[0];

    const firstPatch = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/tickets/${ticket.ticketId}/agent`) && res.request().method() === 'PATCH',
    );
    await agentSelect.selectOption(agentId);
    await firstPatch;
    await expect(agentSelect).toHaveValue(agentId);

    // Now unassign
    const secondPatch = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/tickets/${ticket.ticketId}/agent`) && res.request().method() === 'PATCH',
    );
    await agentSelect.selectOption('');
    await secondPatch;

    await expect(agentSelect).toHaveValue('');
  });

  test('assignment persists after page reload', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    const agentSelect = page.getByRole('combobox', { name: 'Assign agent' });
    await expect(agentSelect).toBeVisible();

    const agentOptions = await getAgentOptions(page);
    expect(agentOptions.length).toBeGreaterThan(0);
    const { value: agentId } = agentOptions[0];

    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/tickets/${ticket.ticketId}/agent`) && res.request().method() === 'PATCH',
    );
    await agentSelect.selectOption(agentId);
    await patchPromise;

    // Reload and verify the assignment is still shown
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Assign agent' })).toHaveValue(agentId);
  });

  test('dropdown is disabled while the assignment request is in-flight', async ({ page, request }) => {
    const ticket = await createTicket(request);

    await page.goto(`/tickets/${ticket.ticketId}`);

    const agentSelect = page.getByRole('combobox', { name: 'Assign agent' });
    await expect(agentSelect).toBeVisible();
    await expect(agentSelect).not.toBeDisabled();

    // Delay the PATCH response so we can observe the disabled state
    await page.route(`**/api/tickets/${ticket.ticketId}/agent`, async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });

    const agentOptions = await getAgentOptions(page);
    expect(agentOptions.length).toBeGreaterThan(0);
    const { value: agentId } = agentOptions[0];

    const patchDone = page.waitForResponse(
      (res) => res.url().includes(`/api/tickets/${ticket.ticketId}/agent`),
    );

    await agentSelect.selectOption(agentId);

    // The dropdown should be disabled while the mutation is pending
    await expect(agentSelect).toBeDisabled();

    await patchDone;

    // After the mutation completes it should be re-enabled
    await expect(agentSelect).not.toBeDisabled();
  });
});
