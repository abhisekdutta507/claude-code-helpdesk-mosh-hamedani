---
name: Auth and session patterns for E2E tests
description: How to handle storage state, session sharing, sign-out isolation, and unauthenticated state in Playwright tests
type: project
---

## Unauthenticated state

The `chromium` project preloads `e2e/.auth/admin.json` as the default storage state (admin is pre-authenticated). Tests that must start unauthenticated must override at the describe-block level:

```ts
const unauthenticatedState = { storageState: { cookies: [], origins: [] } }
test.describe('...', () => {
  test.use(unauthenticatedState)
  // ...
})
```

## Sign-out tests must use their own session

**Critical:** better-auth uses database-backed sessions. When a sign-out test calls `authClient.signOut()`, it deletes the session token from the DB. All other concurrently-running tests that share the same session cookie (from `admin.json`) will fail — their requests to `/api/auth/get-session` return null.

**Fix:** Sign-out describe blocks must:
1. Use `test.use(unauthenticatedState)` to opt out of the shared session
2. Log in fresh in `test.beforeEach` to get a private session that can be safely destroyed

```ts
test.describe('sign out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('admin@test.local')
    await page.locator('#password').fill('TestAdmin@1234!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/')
  })
})
```

## Already-authenticated redirect

Tests that verify "logged-in user visiting /login is redirected to /" can use the shared storage state safely (they don't sign out, so the session remains valid).

## Storage state file

Saved to `frontend/e2e/.auth/admin.json` by `auth.setup.ts`. Contains one cookie:
- Name: `better-auth.session_token`
- Domain: `localhost` (port-agnostic — works for any localhost port)
- Path: `/`
- SameSite: `Lax`

## Auth test credentials

- Admin: `admin@test.local` / `TestAdmin@1234!`
- Agent: `agent1@test.local` / `TestAgent@1234!`
