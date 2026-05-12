# Claude Code — Project Instructions

## Project Overview

AI-powered helpdesk ticket management system. Support emails are received via SendGrid Inbound Parse, automatically classified and summarized by Claude AI, and agents can review and send AI-suggested replies from a web dashboard.

**Ticket statuses:** Open → Resolved → Closed
**Ticket categories:** General question, Technical question, Refund request
**User roles:** Admin (manages agents) | Agent (handles tickets)

## Tech Stack

React 19 + Vite + Tailwind CSS + shadcn/ui + React Router (frontend) / Express 5 + Prisma + PostgreSQL (backend) / better-auth / Claude API / SendGrid.

## Package Manager

Use `bun` for everything. Never use npm, yarn, or pnpm. In non-interactive shells (e.g. CI, background tasks), use the full path `~/.bun/bin/bun` — bare `bun` may not be on `PATH`.

## Key Conventions

- No `any` types; strict TypeScript throughout
- Always use semicolons in all TypeScript/TSX files
- `.env` files only — no dotenv package needed (Bun loads them automatically)

## Local Dev Setup

Start servers: `bun --hot index.ts` (backend on :3000), `bun run dev` (frontend on :5173).

Run migrations with env pre-loaded — Prisma subprocesses don't inherit Bun's env:
```sh
export $(grep -v '^#' .env | xargs) && bun run prisma migrate deploy
```

`backend/seed.ts` is idempotent — creates users from `SEED_ADMIN_EMAIL`/`SEED_AGENT1_EMAIL` env vars.

## Authentication

- Auth via `authClient` (from `@/lib/auth-client`); sessions in PostgreSQL
- `role` is typed on the client via the `inferAdditionalFields` plugin (`better-auth/client/plugins`) in `auth-client.ts` — exposes `session.user.role` as `'ADMIN' | 'AGENT'`

## Route Protection

### Frontend (React Router guards)
- `ProtectedRoute` (`frontend/src/components/ProtectedRoute.tsx`) — redirects unauthenticated users to `/login`
- `AdminRoute` (`frontend/src/components/AdminRoute.tsx`) — redirects unauthenticated users to `/login`, non-admins to `/`
- Wrap routes in `App.tsx` with the appropriate guard: `<Route element={<ProtectedRoute />}>` or `<Route element={<AdminRoute />}>`

### Backend (Express middleware)
- `requireAuth` — validates session, sets `req.user`/`req.session`, returns 401 if missing
- `requireAdmin` — checks `req.user.role === 'ADMIN'`, returns 403 otherwise; always stack after `requireAuth`
- All `/api` routes are behind `requireAuth` (opt-out, not opt-in); `/api/auth/*` and `/api/health` are intentionally unprotected

## Security Middleware

Applied in `backend/index.ts` in this order: `helmet` → `cors` → `authLimiter` → `express.json` → routes → error handler.

Express 5 automatically propagates async errors to the global error handler — no try/catch needed in route handlers.

## Rate Limiting

Handled by `express-rate-limit` in `backend/middleware/rateLimiter.ts`. Exports: `authLimiter` (10 req/60s), `apiLimiter` (100 req/60s), `createRateLimiter(max, windowSec)`.

**Production-only:** All limiters are no-ops when `NODE_ENV !== 'production'`.

## Constants

- Shared frontend constants live in `frontend/src/lib/constants.ts`
- **Do not use TypeScript `enum`** — `erasableSyntaxOnly` is enabled; use a `const` object with `as const` and a companion type instead:
  ```ts
  export const UserRole = { ADMIN: 'ADMIN', AGENT: 'AGENT' } as const
  export type UserRole = (typeof UserRole)[keyof typeof UserRole]
  ```

## shadcn/ui

- Add components with `bunx shadcn@latest add <component>` (outputs to `frontend/src/components/ui/`)
- Alert's CSS grid automatically positions a sibling SVG icon alongside `AlertDescription` — no extra wrapper needed

## Tailwind CSS

- Tailwind v4 via `@import "tailwindcss"` in `frontend/src/index.css`
- Chrome autofill override is in `@layer base` of `index.css` — uses `var(--card)` (not `var(--background)`) so autofill matches Card background

## E2E Testing (Playwright)

Use the `e2e-test-writer` agent for all Playwright test work. It has full context on the test infrastructure, auth setup, seeded users, and project conventions.

Trigger it after implementing a new UI feature or API-backed workflow, or when explicitly asked to write tests.

### Test server ports

Tests use ports 3001 (backend) and 5174 (frontend) to avoid conflicting with dev servers. Config is in `frontend/.env.test` and `backend/.env.test`.

### Sign-out test isolation

`authClient.signOut()` deletes the session row from the DB. Any test that calls sign-out **must** use `test.use({ storageState: { cookies: [], origins: [] } })` and log in fresh — sharing the pre-authed `admin.json` session would invalidate concurrent tests.

## Library Documentation

Always use Context7 to fetch up-to-date docs before working with any library. Never rely solely on training data for API usage or configuration.

1. Call `mcp__context7__resolve-library-id` with the library name
2. Call `mcp__context7__query-docs` with the ID and a specific query

Apply to: React, Vite, Express, Prisma, Tailwind CSS, shadcn/ui, React Router, SendGrid, Anthropic SDK, and any other library in this project.
