# Claude Code — Project Instructions

## Project Overview

AI-powered helpdesk ticket management system. Support emails are received via SendGrid Inbound Parse, automatically classified and summarized by Claude AI, and agents can review and send AI-suggested replies from a web dashboard.

**Ticket statuses:** Open → Resolved → Closed
**Ticket categories:** General question, Technical question, Refund request
**User roles:** Admin (manages agents) | Agent (handles tickets)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | Database sessions (stored in PostgreSQL via Prisma) |
| AI | Claude API (Anthropic SDK) |
| Email | SendGrid (inbound parse + outbound replies) |
| Deployment | Vercel (frontend), Neon (database) |

## Monorepo Structure

```
/
├── frontend/   — React 19 + Vite (port 5173)
└── backend/    — Express + TypeScript (port 3000)
```

## Package Manager

Use `bun` for everything. Never use npm, yarn, or pnpm.

- `bun install` — install dependencies
- `bun add <pkg>` — add a dependency
- `bun add -d <pkg>` — add a dev dependency
- `bun run <script>` — run a script
- `bunx <pkg>` — execute a package binary

## Key Conventions

- **API routes** are prefixed with `/api`
- **CORS origin** is controlled via the `CORS_ORIGIN` env var (defaults to `http://localhost:5173`)
- **Environment variables** — use `.env` files; Bun loads them automatically, no dotenv needed
- **TypeScript** — strict mode enabled in both apps; no `any` types
- **Imports** — use ESM (`import`/`export`) throughout; both apps are `"type": "module"`

### Key environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string (required — server throws on startup if missing) |
| `BETTER_AUTH_URL` | `backend/.env` | Public backend URL; passed as `baseURL` to `betterAuth()` — sets cookie domain and enables `secure` flag over HTTPS |
| `CORS_ORIGIN` | `backend/.env` | Allowed frontend origin (also used as `trustedOrigins` in better-auth) |
| `VITE_API_URL` | `frontend/.env` | Backend base URL for the auth client (defaults to `http://localhost:3000`); set to production URL in CI/deploy |

## Authentication

- Auth library: `better-auth` via `authClient` (from `@/lib/auth-client`)
- Sessions stored in PostgreSQL via Prisma
- Check session state with `authClient.useSession()` → returns `{ data: session, isPending }`
- Sign in with `authClient.signIn.email(data)` → returns `{ error: authError }`
- Server-side auth errors are surfaced via React Hook Form's `setError('root', { message: ... })`
- Post-login redirect uses React Router's `<Navigate to="/" replace />`
- `role` field typed on the client via `inferAdditionalFields` plugin (from `better-auth/client/plugins`) in `auth-client.ts` — exposes `session.user.role` as `'ADMIN' | 'AGENT'`

## Route Protection

### Frontend (React Router guards)
- `ProtectedRoute` (`frontend/src/components/ProtectedRoute.tsx`) — redirects unauthenticated users to `/login`
- `AdminRoute` (`frontend/src/components/AdminRoute.tsx`) — redirects unauthenticated users to `/login`, non-admins to `/`
- Wrap routes in `App.tsx` with the appropriate guard: `<Route element={<ProtectedRoute />}>` or `<Route element={<AdminRoute />}>`

### Backend (Express middleware)
- `requireAuth` (`backend/middleware/requireAuth.ts`) — validates session via better-auth; sets `req.user` and `req.session`; returns 401 if missing
- `requireAdmin` (`backend/middleware/requireAdmin.ts`) — checks `req.user.role === 'ADMIN'`; returns 403 otherwise; always stack after `requireAuth`
- All application routes are mounted on `apiRouter` in `backend/index.ts` behind `requireAuth` — protection is opt-out, not opt-in:
  ```ts
  // backend/index.ts
  const apiRouter = Router()
  app.use('/api', requireAuth, apiRouter)           // all app routes require auth
  apiRouter.use('/users', requireAdmin, userRouter)  // admin-only routes add requireAdmin
  ```
- `/api/auth/*` (better-auth) and `/api/health` are intentionally outside `apiRouter` and have no auth requirement

## Security Middleware

Applied in `backend/index.ts` in this order: `helmet` → `cors` → `authLimiter` → `express.json` → routes → error handler.

- **`helmet()`** — sets HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.). Registered before CORS.
- **`express.json({ limit: '100kb' })`** — caps request body size to prevent memory exhaustion. Adjust limit per-route if a route legitimately needs larger payloads.
- **Global error handler** — always the last middleware registered (after all routes):
  ```ts
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })
  ```
  Express 5 automatically propagates async errors to this handler — no need for try/catch in route handlers.

## Rate Limiting

Rate limiting is handled by `express-rate-limit` at the Express middleware layer (`backend/middleware/rateLimiter.ts`).

**Production-only:** All limiters are no-ops when `NODE_ENV !== 'production'` — no limiter instance or in-memory store is created in dev or test.

```ts
import { authLimiter, apiLimiter, createRateLimiter } from './middleware/rateLimiter'
```

| Export | Limit | Use for |
|---|---|---|
| `authLimiter` | 10 req / 60s | Applied to all `/api/auth/*` routes |
| `apiLimiter` | 100 req / 60s | General protected API routes |
| `createRateLimiter(max, windowSec)` | custom | One-off strict endpoints |

Apply to routes:
```ts
app.all('/api/auth/*splat', authLimiter, toNodeHandler(auth))  // already wired
apiRouter.use('/tickets', apiLimiter, ticketRouter)
apiRouter.post('/something-sensitive', createRateLimiter(5, 60), handler)
```

## Constants

- Shared frontend constants live in `frontend/src/lib/constants.ts`
- **Do not use TypeScript `enum`** — `erasableSyntaxOnly` is enabled; use a `const` object with `as const` and a companion type instead:
  ```ts
  export const UserRole = { ADMIN: 'ADMIN', AGENT: 'AGENT' } as const
  export type UserRole = (typeof UserRole)[keyof typeof UserRole]
  ```
- `UserRole` is defined here and used in `auth-client.ts` and `AdminRoute.tsx`

## shadcn/ui

- Add components with `bunx shadcn@latest add <component>` (outputs to `frontend/src/components/ui/`)
- **Installed:** Button, Input, Label, Card, Alert
- **Alert — destructive variant:** Default is subtle (white bg, colored text only). Customized to colorful red-tinted style in `alert.tsx`:
  ```
  destructive: "border-destructive/40 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive *:[svg]:text-destructive"
  ```
- Alert's CSS grid (`has-[>svg]:grid-cols-[auto_1fr]`) automatically positions a sibling SVG icon alongside `AlertDescription` — no extra wrapper needed

## Tailwind CSS

- Tailwind v4 via `@import "tailwindcss"` in `frontend/src/index.css`
- Design tokens: CSS custom properties in `:root` / `.dark`, mapped in `@theme inline {}`
- Opacity modifier syntax: `bg-destructive/10`, `border-destructive/40` (no plugin needed)
- **Chrome autofill override** (in `@layer base` of `index.css`): uses inset `box-shadow` with `!important` and `var(--card)` to match card background. Requires `-webkit-autofill:active` and `input:autofill` selectors — without them Chrome still shows blue on some interactions. Use `var(--card)` (not `var(--background)`) for inputs inside Card components.

## E2E Testing (Playwright)

Playwright tests live in `frontend/e2e/`. Run from `frontend/`:

```sh
bun run test:e2e          # headless run
bun run test:e2e:ui       # interactive Playwright UI
bun run test:e2e:report   # open last HTML report
```

### How it works

1. **`global.setup.ts`** runs once before any test project: applies Prisma migrations to the test DB, truncates all data, then runs `bun run seed` — so every run starts from a clean known state.
2. **`auth.setup.ts`** (the `setup` project) signs in as `admin@test.local` via the UI and saves session storage to `e2e/.auth/admin.json`.
3. **`chromium` project** depends on `setup` and injects the saved auth state, so tests start already logged in.

### Test database

The backend is started with `NODE_ENV=test` by the `webServer` config, which loads `backend/.env.test` (points to a separate test database — never the dev DB). The test DB URL must be set in `backend/.env.test` as `DATABASE_URL`.

`e2e/.auth/` and `playwright-report/` are gitignored.

### Auth credentials (seeded)

| Email | Password | Role |
|---|---|---|
| `admin@test.local` | `TestAdmin@1234!` | ADMIN |

## Library Documentation

Always use Context7 to fetch up-to-date docs before working with any library. Never rely solely on training data for API usage or configuration.

1. Call `mcp__context7__resolve-library-id` with the library name
2. Call `mcp__context7__query-docs` with the ID and a specific query

Apply to: React, Vite, Express, Prisma, Tailwind CSS, shadcn/ui, React Router, SendGrid, Anthropic SDK, and any other library in this project.
