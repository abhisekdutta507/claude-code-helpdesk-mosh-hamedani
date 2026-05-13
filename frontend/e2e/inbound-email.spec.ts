import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './test-credentials';

const ENDPOINT = `${apiBaseUrl}/api/inbound/email`;

// ---------------------------------------------------------------------------
// 1. Happy path — valid multipart form creates a ticket
// ---------------------------------------------------------------------------
test.describe('inbound email — happy path', () => {
  test('POST with from, subject, and text returns ok:true and a ticketId', async ({ request }) => {
    const from = `user.happy.${Date.now()}@example.com`;

    const res = await request.post(ENDPOINT, {
      multipart: {
        from,
        subject: 'Need help with my order',
        text: 'Hi, I placed an order and have not received it.',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; ticketId: string };
    expect(body.ok).toBe(true);
    expect(body.ticketId).toBeTruthy();
    expect(typeof body.ticketId).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 2. HTML fallback — html field used when text is absent
// ---------------------------------------------------------------------------
test.describe('inbound email — HTML fallback', () => {
  test('POST with html but no text field creates a ticket with stripped body', async ({ request }) => {
    const from = `user.html.${Date.now()}@example.com`;

    const res = await request.post(ENDPOINT, {
      multipart: {
        from,
        subject: 'HTML only email',
        html: '<p>This is a <strong>formatted</strong> message.</p>',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; ticketId: string };
    expect(body.ok).toBe(true);
    expect(body.ticketId).toBeTruthy();
  });

  test('POST with empty text and html field falls back to stripped html', async ({ request }) => {
    const from = `user.htmlfallback.${Date.now()}@example.com`;

    const res = await request.post(ENDPOINT, {
      multipart: {
        from,
        subject: 'Empty text with html',
        text: '   ',
        html: '<div><p>Actual content here.</p></div>',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; ticketId: string };
    expect(body.ok).toBe(true);
    expect(body.ticketId).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 3. from with display name — parsed to email address only
// ---------------------------------------------------------------------------
test.describe('inbound email — display name parsing', () => {
  test('from field with display name is parsed to bare email address', async ({ request }) => {
    const ts = Date.now();
    const email = `john.${ts}@example.com`;

    const res = await request.post(ENDPOINT, {
      multipart: {
        from: `John Doe <${email}>`,
        subject: 'Display name sender',
        text: 'Message from a sender with a display name.',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; ticketId: string };
    // Validation passes — the display name was stripped before schema check
    expect(body.ok).toBe(true);
    expect(body.ticketId).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 4. Validation failures — returns 200 with ok:false, reason:validation_failed
// ---------------------------------------------------------------------------
test.describe('inbound email — validation failures', () => {
  test('missing subject returns ok:false with reason validation_failed', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      multipart: {
        from: `user.nosubj.${Date.now()}@example.com`,
        text: 'Some body text.',
        // subject intentionally omitted
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; reason: string };
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('validation_failed');
  });

  test('invalid from email returns ok:false with reason validation_failed', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      multipart: {
        from: 'not-a-valid-email',
        subject: 'Invalid sender',
        text: 'Some body text.',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; reason: string };
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('validation_failed');
  });

  test('missing text and html returns ok:false with reason validation_failed', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      multipart: {
        from: `user.nobody.${Date.now()}@example.com`,
        subject: 'No body at all',
        // neither text nor html — body will be empty string, failing min(1)
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; reason: string };
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('validation_failed');
  });
});

// ---------------------------------------------------------------------------
// 5. Idempotency / deduplication — same from+subject within 5 minutes
// ---------------------------------------------------------------------------
test.describe('inbound email — deduplication', () => {
  test('second POST with same from and subject within 5 minutes returns duplicate:true with same ticketId', async ({ request }) => {
    const from = `user.dedup.${Date.now()}@example.com`;
    const subject = 'Duplicate test subject';

    // First request — creates the ticket
    const firstRes = await request.post(ENDPOINT, {
      multipart: { from, subject, text: 'First send.' },
    });
    expect(firstRes.status()).toBe(200);
    const firstBody = await firstRes.json() as { ok: boolean; ticketId: string; duplicate?: boolean };
    expect(firstBody.ok).toBe(true);
    expect(firstBody.ticketId).toBeTruthy();
    expect(firstBody.duplicate).toBeUndefined();

    // Second request — same from + subject, should deduplicate
    const secondRes = await request.post(ENDPOINT, {
      multipart: { from, subject, text: 'Retry send.' },
    });
    expect(secondRes.status()).toBe(200);
    const secondBody = await secondRes.json() as { ok: boolean; ticketId: string; duplicate: boolean };
    expect(secondBody.ok).toBe(true);
    expect(secondBody.duplicate).toBe(true);
    expect(secondBody.ticketId).toBe(firstBody.ticketId);
  });

  test('different from address with same subject creates a new ticket', async ({ request }) => {
    const subject = `Shared subject ${Date.now()}`;

    const firstRes = await request.post(ENDPOINT, {
      multipart: {
        from: `user.a.${Date.now()}@example.com`,
        subject,
        text: 'First sender.',
      },
    });
    expect(firstRes.status()).toBe(200);
    const firstBody = await firstRes.json() as { ok: boolean; ticketId: string };
    expect(firstBody.ok).toBe(true);

    const secondRes = await request.post(ENDPOINT, {
      multipart: {
        from: `user.b.${Date.now()}@example.com`,
        subject,
        text: 'Second sender.',
      },
    });
    expect(secondRes.status()).toBe(200);
    const secondBody = await secondRes.json() as { ok: boolean; ticketId: string; duplicate?: boolean };
    expect(secondBody.ok).toBe(true);
    expect(secondBody.duplicate).toBeUndefined();
    expect(secondBody.ticketId).not.toBe(firstBody.ticketId);
  });
});

// ---------------------------------------------------------------------------
// 6. Webhook secret enforcement
// ---------------------------------------------------------------------------
test.describe('inbound email — webhook secret', () => {
  // INBOUND_PARSE_SECRET is not set in backend/.env.test, so the secret guard
  // is a no-op in the test environment and this test cannot be exercised without
  // either restarting the server with the env var set or injecting it at runtime.
  // The test is skipped here; to validate this behavior manually, set
  // INBOUND_PARSE_SECRET=mysecret in backend/.env.test, restart the test server,
  // and verify that a request without ?secret=mysecret returns HTTP 403.
  test.skip('request without correct ?secret param returns 403 when secret is configured', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      multipart: {
        from: 'user@example.com',
        subject: 'Secret test',
        text: 'Testing secret enforcement.',
      },
      // No ?secret= query param — would be rejected if INBOUND_PARSE_SECRET were set
    });

    expect(res.status()).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Forbidden');
  });

  test.skip('request with correct ?secret param is accepted when secret is configured', async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?secret=mysecret`, {
      multipart: {
        from: `user.secret.${Date.now()}@example.com`,
        subject: 'Secret test valid',
        text: 'Testing secret enforcement with correct param.',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
