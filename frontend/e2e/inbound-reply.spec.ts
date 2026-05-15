import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

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
