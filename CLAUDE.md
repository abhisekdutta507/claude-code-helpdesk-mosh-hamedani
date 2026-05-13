# Claude Code — Project Instructions

## Project Overview

AI-powered helpdesk ticket management system. Support emails are received via SendGrid Inbound Parse, automatically classified and summarized by Claude AI, and agents can review and send AI-suggested replies from a web dashboard.

**User roles:** Admin (manages agents) | Agent (handles tickets)

## Tech Stack

React 19 + Vite + Tailwind CSS + shadcn/ui + React Router + TanStack Query + axios (frontend) / Express 5 + Prisma + PostgreSQL (backend) / better-auth / Claude API / SendGrid.

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

> **Hot reload caveat:** Bun's `--hot` flag silently fails to reload changed route files. **Always restart the backend server after any backend file change** — otherwise the old code keeps running and changes have no effect.

## Authentication

- Auth via `authClient` (from `@/lib/auth-client`); sessions in PostgreSQL
- `role` is typed on the client via the `inferAdditionalFields` plugin (`better-auth/client/plugins`) in `auth-client.ts` — exposes `session.user.role` as `'ADMIN' | 'AGENT'`

## Route Protection

### Frontend (React Router guards)
- `ProtectedRoute` — redirects unauthenticated users to `/login`
- `AdminRoute` — redirects unauthenticated users to `/login`, non-admins to `/`

### Backend (Express middleware)
- `requireAuth` — validates session, sets `req.user`/`req.session`, returns 401 if missing
- `requireAdmin` — checks `req.user.role === 'ADMIN'`, returns 403; always stack after `requireAuth`
- All `/api` routes are behind `requireAuth` (opt-out, not opt-in); `/api/auth/*` and `/api/health` are intentionally unprotected

## Security & Rate Limiting

`backend/index.ts` middleware order: `helmet` → `cors` → `authLimiter` → `express.json` → routes → error handler. Express 5 propagates async errors automatically — no try/catch needed in route handlers.

Rate limiting via `express-rate-limit` (`backend/middleware/rateLimiter.ts`): `authLimiter` (10 req/60s), `apiLimiter` (100 req/60s), `createRateLimiter(max, windowSec)`. All limiters are no-ops outside production.

## Data Validation

Use **Zod** for all backend request body validation (installed in `backend/`). Define schemas at the top of the route file and use `schema.safeParse(req.body)` — return a 400 with `z.flattenError(result.error).fieldErrors` on failure.

Zod v4 API notes:
- Use `z.email()` (top-level), not `z.string().email()` (deprecated)
- Use `z.flattenError(err).fieldErrors` instead of `err.flatten().fieldErrors` (deprecated)

## Shared Package

The repo is a Bun workspace with three packages: `backend/`, `frontend/`, `shared/`.

- Shared code (Zod schemas, constants, types used by both packages) lives in `shared/src/`
- Import with `@repo/shared/<path>` — e.g. `import { createUserSchema, UserRole } from '@repo/shared/schemas/user'`
- `shared/` has no build step; both packages import the `.ts` source directly via the `exports` map
- Run `~/.bun/bin/bun install` from the repo root to link the workspace

## Constants

- **Do not use TypeScript `enum`** — `erasableSyntaxOnly` is enabled; use a `const` object with `as const` and a companion type instead
- `UserRole` is defined in `shared/src/schemas/user.ts` — import from there, not from `frontend/src/lib/constants.ts`

## Data Fetching

- Use **axios** for all HTTP calls (not native `fetch`)
- Use **TanStack Query** (`useQuery`) for server state — no manual `useEffect`/`useState` for fetching
- `QueryClientProvider` wraps the app in `frontend/src/main.tsx`
- axios is configured per-call with `withCredentials: true` for session cookies

## shadcn/ui

Add components with `bunx shadcn@latest add <component>` from the `frontend/` directory.

**Known issue:** shadcn misresolves the `@/` alias and writes files to `frontend/@/components/ui/` instead of `frontend/src/components/ui/`. After running the install command, manually copy the generated file:
```sh
cp "frontend/@/components/ui/<component>.tsx" "frontend/src/components/ui/<component>.tsx"
```

**API note:** This project uses `base-nova` style which pulls from `@base-ui/react` (not Radix). Component APIs differ from the Radix-based shadcn docs:
- `AlertDialog.Root.Props.onOpenChange` signature is `(open: boolean, eventDetails) => void` — wrap it when passing a `(open: boolean) => void` handler: `onOpenChange={(open) => handler(open)}`
- `AlertDialogCancel` renders a `@base-ui/react` Close button (auto-closes dialog); `AlertDialogAction` is a plain `Button` with no auto-close behavior

## Unit Testing Agent

Use the `unit-test-writer` agent for all unit test work. Always run it with `run_in_background: true` so the user can continue working in VS Code while tests are being written.

## Unit Testing (Vitest + React Testing Library)

Run unit tests from the `frontend/` directory:

```sh
bun run test          # run once
bun run test:watch    # watch mode
```

Test files live alongside source files as `*.test.tsx` / `*.test.ts` under `src/`.

### Conventions

- Use `renderWithProviders(ui)` from `@/test/render-utils` — wraps components in `QueryClientProvider` + `MemoryRouter`
- Define a file-local `const renderPage = () => renderWithProviders(<MyPage />)` so JSX is written once per file
- Mock `axios` with `vi.mock('axios')` and use `vi.mocked(axios.get)` for typed mock control
- Mock `@/lib/auth-client` to avoid real auth calls; provide the session shape your component needs
- Use `vi.clearAllMocks()` in `beforeEach` to reset state between tests

## E2E Testing (Playwright)

Use the `e2e-test-writer` agent for all Playwright test work. It has full context on the test infrastructure, auth setup, seeded users, and project conventions.

Trigger it after implementing a new UI feature or API-backed workflow, or when explicitly asked to write tests.

### Test server ports

Tests use ports 3001 (backend) and 5174 (frontend) to avoid conflicting with dev servers. Config is in `frontend/.env.test` and `backend/.env.test`.

### Sign-out test isolation

`authClient.signOut()` deletes the session row from the DB. Any test that calls sign-out **must** use `test.use({ storageState: { cookies: [], origins: [] } })` and log in fresh — sharing the pre-authed `admin.json` session would invalidate concurrent tests.

## Auto-Memory vs CLAUDE.md

Auto-memory files (`~/.claude/projects/.../memory/`) are machine-local and not checked in. Do not trim conventions from CLAUDE.md on the basis that they exist in memory — a new machine will have CLAUDE.md but not the memory files.

## Library Documentation

Always use Context7 to fetch up-to-date docs before working with any library. Never rely solely on training data for API usage or configuration.

1. Call `mcp__context7__resolve-library-id` with the library name
2. Call `mcp__context7__query-docs` with the ID and a specific query

Apply to: React, Vite, Express, Prisma, Tailwind CSS, shadcn/ui, React Router, SendGrid, Anthropic SDK, and any other library in this project.
