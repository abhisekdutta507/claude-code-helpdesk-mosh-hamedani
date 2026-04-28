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

## Authentication

- Auth library: `better-auth` via `authClient` (from `@/lib/auth-client`)
- Sessions stored in PostgreSQL via Prisma
- Check session state with `authClient.useSession()` → returns `{ data: session, isPending }`
- Sign in with `authClient.signIn.email(data)` → returns `{ error: authError }`
- Server-side auth errors are surfaced via React Hook Form's `setError('root', { message: ... })`
- Post-login redirect uses React Router's `<Navigate to="/" replace />`
- `role` field typed on the client via `inferAdditionalFields` plugin (from `better-auth/client/plugins`) in `auth-client.ts` — exposes `session.user.role` as `'ADMIN' | 'AGENT'`

## Route Protection

- `ProtectedRoute` (`frontend/src/components/ProtectedRoute.tsx`) — redirects unauthenticated users to `/login`
- `AdminRoute` (`frontend/src/components/AdminRoute.tsx`) — redirects unauthenticated users to `/login`, non-admins to `/`
- Wrap routes in `App.tsx` with the appropriate guard: `<Route element={<ProtectedRoute />}>` or `<Route element={<AdminRoute />}>`

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

## Library Documentation

Always use Context7 to fetch up-to-date docs before working with any library. Never rely solely on training data for API usage or configuration.

1. Call `mcp__context7__resolve-library-id` with the library name
2. Call `mcp__context7__query-docs` with the ID and a specific query

Apply to: React, Vite, Express, Prisma, Tailwind CSS, shadcn/ui, React Router, SendGrid, Anthropic SDK, and any other library in this project.
