---
name: UI locator notes for this helpdesk project
description: Stable locator strategies, shadcn/ui component quirks, and page structure details
type: project
---

## shadcn/ui CardTitle

`CardTitle` renders as `<div data-slot="card-title">`, NOT as an `<h*>` element. Do NOT use `getByRole('heading')` for `CardTitle` content. Use `getByText('...')` instead.

Example in LoginPage: `<CardTitle>Helpdesk</CardTitle>` → use `page.getByText('Helpdesk')`.

## LoginPage (`/login`)

- Email input: `page.locator('#email')` (has `id="email"`)
- Password input: `page.locator('#password')` (has `id="password"`)
- Submit button: `page.getByRole('button', { name: 'Sign in' })` / `'Signing in…'` when submitting
- Client-side validation errors: `page.getByText('Enter a valid email address')`, `page.getByText('Password is required')`
- Server error alert: `page.getByRole('alert')` — the `<Alert variant="destructive">` has `role="alert"` via shadcn's Alert component
- Title: `page.getByText('Helpdesk')` (CardTitle is a div)

## HomePage (`/`)

- Welcome heading: `page.getByRole('heading', { name: /welcome, admin/i })` — this IS a real `<h1>`, so `getByRole('heading')` works
- Sign out button: `page.getByRole('button', { name: 'Sign out' })`

## ProtectedRoute loading state

`ProtectedRoute` shows `<p>Loading…</p>` while `useSession()` resolves. Tests don't need to wait for this explicitly — `waitForURL` and `toBeVisible` handle the async correctly.
