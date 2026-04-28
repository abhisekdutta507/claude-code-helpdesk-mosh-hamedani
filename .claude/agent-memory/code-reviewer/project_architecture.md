---
name: Project Architecture — Helpdesk
description: Key architectural facts about the helpdesk project that affect security and code review conclusions
type: project
---

This is an early-stage project (AI-powered helpdesk ticket management). The Ticket and Reply models were dropped in migration 20260428024814 — the backend currently has NO application API routes beyond /api/health and the better-auth routes. `requireAuth` middleware exists but is not applied to any route yet.

**Why:** Feature development is in progress — auth, guards, and routing infrastructure are being laid down before domain routes are added.

**How to apply:** When reviewing new routes, always flag if `requireAuth` is missing. When reviewing admin endpoints, flag if there is no server-side role check (only `requireAuth` is not enough). The frontend AdminRoute guard protects UI only — it is not a substitute for server-side authorization.

Key facts:
- `requireAuth` is defined but currently unused (no application routes exist yet)
- No `requireAdmin` middleware exists — only `requireAuth`
- better-auth built-in rate limiting is DISABLED in development (`NODE_ENV !== 'production'`), default is 100 req / 10s window in production
- `auth-client.ts` has `baseURL` hardcoded to `http://localhost:3000` — no `VITE_API_URL` env var support
- `prisma.config.ts` uses `import "dotenv/config"` — a convention violation (Bun loads .env automatically, no dotenv import needed)
- `datasource db` in schema.prisma has no `url` field — relies on `prisma.config.ts` datasource override
- Frontend `tsconfig.app.json` does NOT have `strict: true` — only backend has strict TypeScript
- Session cookies: better-auth sets `httpOnly: true`, `sameSite: lax`, `secure` only when HTTPS (auto-detected from BETTER_AUTH_URL)
- `BETTER_AUTH_URL` is in `.env` but not consumed in `auth.ts` — better-auth reads it from env automatically via its own env utils
