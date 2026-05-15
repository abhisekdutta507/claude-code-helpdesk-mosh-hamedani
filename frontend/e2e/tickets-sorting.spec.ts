import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to /tickets and wait until data has loaded.
 * "N tickets" in the card title signals the fetch has completed.
 */
async function gotoTickets(page: import('@playwright/test').Page) {
  await page.goto('/tickets');
  await expect(page.getByText(/^\d+ tickets?$/)).toBeVisible();
}

/**
 * Return the <th> element for a column by its visible header text.
 * Column headers with sort buttons wrap text inside a <button>; the plain
 * "Agent" header is a raw text node.
 */
function columnHeader(page: import('@playwright/test').Page, name: string) {
  return page.getByRole('columnheader', { name });
}

/**
 * Seed a single ticket via the inbound email webhook so the table has at
 * least one row.  Returns the ticketId.
 */
async function seedOneTicket(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post(`${apiBaseUrl}/api/inbound/email`, {
    multipart: {
      from: `sorting.seed.${Date.now()}@example.com`,
      subject: 'Sorting seed ticket',
      text: 'Seeded so the tickets table has at least one row.',
    },
  });
  const body = await res.json() as { ok: boolean; ticketId: string };
  return body.ticketId;
}

// ---------------------------------------------------------------------------
// 1. Default sort state on load
// ---------------------------------------------------------------------------
test.describe('tickets sorting — default state', () => {
  test('Date column shows ArrowDown (desc) on initial load', async ({ page }) => {
    await gotoTickets(page);

    const dateHeader = columnHeader(page, 'Date');
    // Lucide renders ArrowDown with class "lucide-arrow-down"
    await expect(dateHeader.locator('svg.lucide-arrow-down')).toBeVisible();
  });

  test('at least one ticket row is visible after seeding', async ({ page, request }) => {
    await seedOneTicket(request);
    await gotoTickets(page);
    // At least the seeded row (index 1 because row 0 is the header)
    await expect(page.getByRole('row').nth(1)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Subject column — full sort cycle (unsorted → asc → desc → unsorted)
// ---------------------------------------------------------------------------
test.describe('tickets sorting — subject column cycle', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTickets(page);
  });

  test('first click on Subject sorts asc and sends sortBy=subject&sortDir=asc', async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/tickets') &&
        req.url().includes('sortBy=subject') &&
        req.url().includes('sortDir=asc'),
    );

    await columnHeader(page, 'Subject').getByRole('button').click();

    // Network request must carry the correct params
    await requestPromise;

    // Subject header must show ArrowUp
    const subjectHeader = columnHeader(page, 'Subject');
    await expect(subjectHeader.locator('svg.lucide-arrow-up')).toBeVisible();
  });

  test('second click on Subject sorts desc and sends sortDir=desc', async ({ page }) => {
    // First click → asc
    await columnHeader(page, 'Subject').getByRole('button').click();
    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-up')).toBeVisible();

    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/tickets') &&
        req.url().includes('sortBy=subject') &&
        req.url().includes('sortDir=desc'),
    );

    // Second click → desc
    await columnHeader(page, 'Subject').getByRole('button').click();

    await requestPromise;

    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-down')).toBeVisible();
  });

  test('third click on Subject wraps back to asc (sort is never removed)', async ({ page }) => {
    // Click 1 → asc
    await columnHeader(page, 'Subject').getByRole('button').click();
    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-up')).toBeVisible();

    // Click 2 → desc
    await columnHeader(page, 'Subject').getByRole('button').click();
    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-down')).toBeVisible();

    // Click 3 → wraps back to asc
    await columnHeader(page, 'Subject').getByRole('button').click();

    // URL should reflect sortDir=asc (sort is never removed — cycles asc→desc→asc)
    await expect(page).toHaveURL(/sortBy=subject/);
    await expect(page).toHaveURL(/sortDir=asc/);

    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-up')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Switching between columns
// ---------------------------------------------------------------------------
test.describe('tickets sorting — switching columns', () => {
  test('clicking From after Subject: From shows ArrowUp, Subject and Date show ArrowUpDown', async ({ page }) => {
    await gotoTickets(page);

    // Sort by Subject first
    await columnHeader(page, 'Subject').getByRole('button').click();
    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-up')).toBeVisible();

    // Now sort by From
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/tickets') &&
        req.url().includes('sortBy=fromEmail') &&
        req.url().includes('sortDir=asc'),
    );

    await columnHeader(page, 'From').getByRole('button').click();

    await requestPromise;

    // From shows ascending
    await expect(columnHeader(page, 'From').locator('svg.lucide-arrow-up')).toBeVisible();

    // Subject is back to unsorted
    await expect(columnHeader(page, 'Subject').locator('svg.lucide-arrow-up-down')).toBeVisible();

    // Date is unsorted (no longer the active sort column)
    await expect(columnHeader(page, 'Date').locator('svg.lucide-arrow-up-down')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Agent column is non-sortable
// ---------------------------------------------------------------------------
test.describe('tickets sorting — agent column non-sortable', () => {
  test('Agent column header has no sort icon (no SVG inside the <th>)', async ({ page }) => {
    await gotoTickets(page);

    const agentHeader = columnHeader(page, 'Agent');
    // Plain text header — must NOT contain any Lucide sort SVG
    await expect(agentHeader.locator('svg.lucide-arrow-up-down')).not.toBeAttached();
    await expect(agentHeader.locator('svg.lucide-arrow-up')).not.toBeAttached();
    await expect(agentHeader.locator('svg.lucide-arrow-down')).not.toBeAttached();
    // And there is no sort button inside the header
    await expect(agentHeader.getByRole('button')).not.toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// 5. API-level guard — invalid sortBy param returns 400
// ---------------------------------------------------------------------------
test.describe('tickets sorting — API validation', () => {
  test('GET /api/tickets?sortBy=invalid returns 400 with details.sortBy error', async ({ request }) => {
    const res = await request.get(`${apiBaseUrl}/api/tickets`, {
      params: { sortBy: 'invalid' },
    });

    expect(res.status()).toBe(400);

    const body = await res.json() as { error: string; details: Record<string, string[]> };
    expect(body.error).toBeTruthy();
    expect(Array.isArray(body.details.sortBy)).toBe(true);
    expect(body.details.sortBy.length).toBeGreaterThan(0);
  });

  test('GET /api/tickets?sortDir=invalid returns 400 with details.sortDir error', async ({ request }) => {
    const res = await request.get(`${apiBaseUrl}/api/tickets`, {
      params: { sortDir: 'invalid' },
    });

    expect(res.status()).toBe(400);

    const body = await res.json() as { error: string; details: Record<string, string[]> };
    expect(body.error).toBeTruthy();
    expect(Array.isArray(body.details.sortDir)).toBe(true);
    expect(body.details.sortDir.length).toBeGreaterThan(0);
  });

  test('GET /api/tickets with valid sortBy and sortDir returns 200', async ({ request }) => {
    const res = await request.get(`${apiBaseUrl}/api/tickets`, {
      params: { sortBy: 'subject', sortDir: 'asc' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { tickets: unknown[]; total: number };
    // The API returns a paginated object with a tickets array
    expect(Array.isArray(body.tickets)).toBe(true);
  });
});
