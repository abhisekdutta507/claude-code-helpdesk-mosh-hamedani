import { test, expect } from '@playwright/test';
import { apiBaseUrl, testUsers } from './test-credentials';

// API-level tests — no browser needed; uses the `request` fixture only.

const ENDPOINT = `${apiBaseUrl}/api/inbound/email`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function postEmail(
  request: import('@playwright/test').APIRequestContext,
  from: string,
  subject: string,
  text: string,
) {
  const res = await request.post(ENDPOINT, {
    multipart: { from, subject, text },
  });
  return res.json() as Promise<{ ok: boolean; ticketId: string; reply?: boolean }>;
}

// ---------------------------------------------------------------------------
// 1. Re: subject attaches reply to existing ticket
// ---------------------------------------------------------------------------
test.describe('inbound reply — Re: prefix', () => {
  test('posting with "Re: <subject>" attaches a reply to the existing ticket', async ({ request }) => {
    const ts = Date.now();
    const from = `reply.re.${ts}@example.com`;
    const subject = `Original subject ${ts}`;

    const original = await postEmail(request, from, subject, 'Original message body.');
    expect(original.ok).toBe(true);
    expect(original.ticketId).toBeTruthy();

    const reply = await postEmail(request, from, `Re: ${subject}`, 'This is a reply body.');
    expect(reply.ok).toBe(true);
    expect(reply.reply).toBe(true);
    expect(reply.ticketId).toBe(original.ticketId);
  });
});

// ---------------------------------------------------------------------------
// 2. Fwd: subject attaches reply to existing ticket
// ---------------------------------------------------------------------------
test.describe('inbound reply — Fwd: prefix', () => {
  test('posting with "Fwd: <subject>" attaches a reply to the existing ticket', async ({ request }) => {
    const ts = Date.now();
    const from = `reply.fwd.${ts}@example.com`;
    const subject = `Forward subject ${ts}`;

    const original = await postEmail(request, from, subject, 'Original message body.');
    expect(original.ok).toBe(true);
    expect(original.ticketId).toBeTruthy();

    const reply = await postEmail(request, from, `Fwd: ${subject}`, 'Forwarded reply body.');
    expect(reply.ok).toBe(true);
    expect(reply.reply).toBe(true);
    expect(reply.ticketId).toBe(original.ticketId);
  });
});

// ---------------------------------------------------------------------------
// 3. Reply does NOT create a new ticket
// ---------------------------------------------------------------------------
test.describe('inbound reply — no new ticket created', () => {
  test('ticketId in Re: reply matches the original ticketId (no new ticket)', async ({ request }) => {
    const ts = Date.now();
    const from = `reply.nodedup.${ts}@example.com`;
    const subject = `No new ticket ${ts}`;

    const original = await postEmail(request, from, subject, 'Original body.');
    expect(original.ok).toBe(true);

    const reply = await postEmail(request, from, `Re: ${subject}`, 'Reply body.');
    expect(reply.ok).toBe(true);

    expect(reply.ticketId).toBe(original.ticketId);
  });
});

// ---------------------------------------------------------------------------
// 4. bodyHtml field stored and returned on replies
// ---------------------------------------------------------------------------

type ReplyResponse = {
  id: string;
  body: string;
  bodyHtml: string | null;
  fromEmail: string | null;
  createdAt: string;
  author: { id: string; name: string } | null;
};

/**
 * Sign in as admin using the auth API and store the session cookie in the
 * provided request context.  The Playwright `request` fixture persists cookies
 * across calls within the same test, so subsequent requests are authenticated.
 */
async function signInAsAdmin(request: import('@playwright/test').APIRequestContext): Promise<void> {
  const res = await request.post(`${apiBaseUrl}/api/auth/sign-in/email`, {
    data: {
      email: testUsers.admin.email,
      password: testUsers.admin.password,
    },
  });
  expect(res.ok()).toBe(true);
}

async function fetchReplies(
  request: import('@playwright/test').APIRequestContext,
  ticketId: string,
): Promise<ReplyResponse[]> {
  const res = await request.get(`${apiBaseUrl}/api/tickets/${ticketId}/replies`);
  expect(res.status()).toBe(200);
  return res.json() as Promise<ReplyResponse[]>;
}

async function postEmailWithHtml(
  request: import('@playwright/test').APIRequestContext,
  from: string,
  subject: string,
  text: string,
  html?: string,
): Promise<{ ok: boolean; ticketId: string; reply?: boolean }> {
  const fields: Record<string, string> = { from, subject, text };
  if (html !== undefined) {
    fields.html = html;
  }
  const res = await request.post(ENDPOINT, { multipart: fields });
  return res.json() as Promise<{ ok: boolean; ticketId: string; reply?: boolean }>;
}

test.describe('inbound reply — HTML body stored and returned', () => {
  test('inbound reply with html field stores bodyHtml on the reply', async ({ request }) => {
    await signInAsAdmin(request);

    const ts = Date.now();
    const from = `reply.html.${ts}@example.com`;
    const subject = `HTML reply subject ${ts}`;

    const parent = await postEmailWithHtml(request, from, subject, 'Original plain text body.');
    expect(parent.ok).toBe(true);
    expect(parent.ticketId).toBeTruthy();

    const replyHtml = '<p>HTML <strong>reply</strong></p>';
    const replyResult = await postEmailWithHtml(
      request,
      from,
      `Re: ${subject}`,
      'Plain text reply body.',
      replyHtml,
    );
    expect(replyResult.ok).toBe(true);
    expect(replyResult.reply).toBe(true);
    expect(replyResult.ticketId).toBe(parent.ticketId);

    const replies = await fetchReplies(request, parent.ticketId);
    expect(replies).toHaveLength(1);
    expect(replies[0].bodyHtml).toContain('<p>');
    expect(replies[0].bodyHtml).toContain('<strong>reply</strong>');
  });

  test('inbound reply without html field has null bodyHtml', async ({ request }) => {
    await signInAsAdmin(request);

    const ts = Date.now();
    const from = `reply.nohtml.${ts}@example.com`;
    const subject = `No HTML reply subject ${ts}`;

    const parent = await postEmailWithHtml(request, from, subject, 'Original plain text body.');
    expect(parent.ok).toBe(true);
    expect(parent.ticketId).toBeTruthy();

    // Post reply with only a text field — no html
    const replyResult = await postEmailWithHtml(
      request,
      from,
      `Re: ${subject}`,
      'Plain text only reply.',
    );
    expect(replyResult.ok).toBe(true);
    expect(replyResult.reply).toBe(true);

    const replies = await fetchReplies(request, parent.ticketId);
    expect(replies).toHaveLength(1);
    expect(replies[0].bodyHtml).toBeNull();
  });

  test('reply with HTML is rendered in a prose div on the ticket detail page', async ({ page, request }) => {
    const ts = Date.now();
    const from = `reply.prose.${ts}@example.com`;
    const subject = `Prose render subject ${ts}`;

    const parent = await postEmailWithHtml(request, from, subject, 'Original plain text body.');
    expect(parent.ok).toBe(true);
    expect(parent.ticketId).toBeTruthy();

    const replyHtml = '<p>This has <strong>bold text</strong> in it.</p>';
    const replyResult = await postEmailWithHtml(
      request,
      from,
      `Re: ${subject}`,
      'Plain text fallback.',
      replyHtml,
    );
    expect(replyResult.ok).toBe(true);
    expect(replyResult.reply).toBe(true);

    await page.goto(`/tickets/${parent.ticketId}`);

    // Wait for the replies section to load — the Assign agent combobox confirms
    // the ticket detail data is ready, then the replies card follows.
    await expect(page.getByRole('combobox', { name: 'Assign agent' })).toBeVisible();

    // The prose div should be present in the replies card (not in the message card above it).
    const repliesCard = page.locator('text=Replies').locator('../..');
    const proseDiv = repliesCard.locator('.prose').first();
    await expect(proseDiv).toBeVisible();

    // The <strong> element with "bold text" must be rendered inside the prose area.
    const boldEl = proseDiv.locator('strong', { hasText: 'bold text' });
    await expect(boldEl).toBeVisible();
  });
});
