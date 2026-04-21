# Implementation Plan

## Phase 1 — Project Setup

- [x] Create monorepo root with `/frontend` and `/backend` folders
- [x] Initialize `/backend`: Node.js + Express + TypeScript
- [x] Initialize `/frontend`: React 19 + TypeScript (Vite)

---

## Phase 2 — Configuration

- [ ] Configure Tailwind CSS and shadcn/ui in `/frontend`
- [ ] Set up React Router in `/frontend`
- [ ] Configure ESLint and Prettier for both apps
- [ ] Set up `.env` structure for both apps

---

## Phase 3 — Database & Authentication

- [ ] Provision Neon PostgreSQL instance
- [ ] Initialize Prisma and connect to Neon
- [ ] Define `User` schema (id, email, password hash, role: admin/agent)
- [ ] Define `Session` schema
- [ ] Run initial migration
- [ ] Implement session middleware in Express
- [ ] Build login and logout API endpoints
- [ ] Build login page (frontend)
- [ ] Protect routes with auth middleware (backend + frontend)
- [ ] Seed admin user on first deploy

---

## Phase 4 — Ticket Core

- [ ] Define `Ticket` schema (id, subject, body, fromEmail, status, category, createdAt, updatedAt)
- [ ] Run migration
- [ ] Build ticket CRUD endpoints (create, list, get by ID, update status/category)
- [ ] Add filtering (by status, category) and sorting (by date) to list endpoint
- [ ] Build ticket list page with filter controls
- [ ] Build ticket detail page

---

## Phase 5 — Email Integration

- [ ] Set up SendGrid account, verify domain
- [ ] Implement Inbound Parse webhook endpoint → create ticket from inbound email
- [ ] Implement outbound reply via SendGrid API
- [ ] Build reply UI in ticket detail view
- [ ] Auto-set ticket status to **Resolved** when reply is sent

---

## Phase 6 — AI Features

- [ ] Set up Claude API client (Anthropic SDK)
- [ ] Auto-classify ticket category on creation
- [ ] Generate AI summary for each ticket
- [ ] Generate AI-suggested reply
- [ ] Display classification, summary, and suggested reply in ticket detail UI
- [ ] Allow agent to edit and send the suggested reply

---

## Phase 7 — User Management (Admin)

- [ ] Build list agents endpoint + page
- [ ] Build create agent endpoint + form
- [ ] (Optional) Deactivate/delete agent

---

## Phase 8 — Dashboard

- [ ] Ticket stats endpoint (counts by status)
- [ ] Dashboard page with summary cards and recent tickets

---

## Phase 9 — Deployment

- [ ] Configure Vercel project for frontend
- [ ] Configure Neon production database
- [ ] Set production environment variables
- [ ] Configure SendGrid Inbound Parse for production domain
- [ ] End-to-end smoke test
