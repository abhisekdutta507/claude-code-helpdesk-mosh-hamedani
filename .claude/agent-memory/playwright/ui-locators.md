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

## UsersPage (`/users`)

- Page heading: `page.getByRole('heading', { name: 'Users' })` — real `<h1>`, `getByRole` works
- Table loaded: wait for `page.getByText(/^All users \(\d+\)$/)` — CardTitle (div), signals fetch complete
- Edit button per row: `aria-label="Edit user"` + `data-testid="edit-user-${user.id}"` — use `getByRole('button', { name: 'Edit user' })` scoped to the row
- Row targeting: `page.getByRole('row').filter({ has: page.getByRole('cell', { name: email }) })`

## TicketsPage (`/tickets`)

- Page ready: wait for `page.getByText(/\d+ tickets?/)` — CardTitle (div) shows "N tickets" (NOT "All tickets (N)")
- Filter dropdowns: `getByRole('combobox', { name: 'Filter by status' })`, `'Filter by category'`, `'Filter by agent'`
- Search input: `page.getByPlaceholder('Search subject or email…')`
- Clear filters button: `page.getByRole('button', { name: 'Clear filters' })` — only visible when a filter is active
- Pagination: renders as `button` role (NOT `link`). Use `getByRole('button', { name: 'Go to previous page' })` and `'Go to next page'`. Disabled via HTML `disabled` attribute when at boundary.
- Ticket subject cell: `page.getByRole('link', { name: subjectText })` — subject is an `<a>` tag linking to `/tickets/:id`

## TicketDetailPage (`/tickets/:id`)

- Card title (subject): `page.locator('[data-slot="card-title"]').first()` — use `.toHaveText(subject)` not `getByText` (subject also appears in message body)
- Status badge: `page.getByText('OPEN')` / `'RESOLVED'` / `'CLOSED'` — inline span with badge classes
- Assign agent dropdown: `page.getByRole('combobox', { name: 'Assign agent' })` — disabled while mutation in-flight
- Back link: `page.getByRole('link', { name: /Back to tickets/ })`
- AI Summary card: only renders when `ticket.summary` is truthy — absent for webhook-created tickets in test mode
- Error state: `page.getByText('Failed to load ticket.')` — shows when API returns 404

## EditUserDialog

- Dialog: `page.getByRole('dialog')` — Radix Dialog has `role="dialog"`
- Dialog title text: "Edit user"
- Name input: `dialog.getByLabel('Name')` — `id="name"`, label `htmlFor="name"`, pre-filled with user's name
- Email input: `dialog.getByLabel('Email')` — `id="email"`, disabled + readOnly, value = user's email
- Password input: `dialog.getByLabel('Password')` — `id="password"`, empty on open
- Submit button: `dialog.getByRole('button', { name: 'Save changes' })` / `'Saving…'` while submitting
- Cancel button: `dialog.getByRole('button', { name: 'Cancel' })`
- Root error alert: `dialog.getByRole('alert')` — shadcn `Alert variant="destructive"` has `role="alert"`
- Inline field errors: plain `<p class="text-sm text-destructive">` — use `dialog.getByText('...')`
- Validation messages (from shared schema): `'Name must be at least 3 characters long'`, `'Password must be at least 8 characters long'`
