# AI-Powered Helpdesk

A ticket management system that uses AI to automatically classify, summarize, and suggest replies for support emails — delivering faster, more personalized responses while freeing up agents for complex issues.

## Getting Started

### Backend

```bash
cd backend
bun install
bun run dev
```

Runs on **http://localhost:3000**

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Runs on **http://localhost:5173**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | Database sessions |
| AI | Claude API (Anthropic) |
| Email | SendGrid |
| Deployment | Vercel (frontend), Neon (database) |

## Project Structure

```
/
├── frontend/          — React 19 + Vite
├── backend/           — Express 5 + TypeScript
├── CLAUDE.md          — AI assistant instructions
└── implementation-plan.md
```

## Claude Code Prompts Used to Build This

```text
Read @project-scope.md. Review it and ask me clarifying questions. Help me find gaps or things I haven't thought through.
```

```text
Suggest a tech stack for this project.
```

```text
Create an implementation plan. Break the project into small tasks and group them into phases.
```

```text
Complete the Phase 1 from @implementation-plan.md use bun as a package manager. And use context7 for up-to-date docs.
```

```text
In the frontend app. in @App.tsx call the /api/health api and display a message.
```

```text
Include project overview, tech stack & key conventions in the CLAUDE.md.
```
