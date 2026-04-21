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

## Library Documentation

Always use Context7 to fetch up-to-date docs before working with any library. Never rely solely on training data for API usage or configuration.

1. Call `mcp__context7__resolve-library-id` with the library name
2. Call `mcp__context7__query-docs` with the ID and a specific query

Apply to: React, Vite, Express, Prisma, Tailwind CSS, shadcn/ui, React Router, SendGrid, Anthropic SDK, and any other library in this project.
