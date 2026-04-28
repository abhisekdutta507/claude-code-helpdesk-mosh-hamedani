# AI-Powered Helpdesk

A ticket management system that uses AI to automatically classify, summarize, and suggest replies for support emails — delivering faster, more personalized responses while freeing up agents for complex issues.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | Better Auth (email/password, database sessions) |
| AI | Claude API (Anthropic) |
| Email | SendGrid |
| Deployment | Vercel (frontend), Neon (database) |

## Project Structure

```
/
├── frontend/          — React 19 + Vite (port 5173)
├── backend/           — Express 5 + TypeScript (port 3000)
├── CLAUDE.md          — AI assistant instructions
└── implementation-plan.md
```

## Claude Code Configuration

### Agents vs Skills

Two different Claude Code features live under `.claude/`, each with its own convention:

| Feature | Path | Convention | Purpose |
|---|---|---|---|
| Agent | `.claude/agents/<name>.md` | Single file | Autonomous subagent Claude spawns to handle tasks |
| Skill | `.claude/skills/<name>/SKILL.md` | Folder + file | User-invokable slash command (e.g. `/<name>`) |

**Agents** are a single `.md` file because that's all they need — just a system prompt.

**Skills** use a folder because a skill can bundle multiple supporting files alongside `SKILL.md` (helper scripts, templates, config snippets, etc.). The folder is the skill's package.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL database (local or [Neon](https://neon.tech))
- `.env` files configured in `backend/` (see `.env.example` if available)

### Backend

```bash
cd backend
bun install
bun run dev
```

Runs on **http://localhost:3000**

To seed the initial admin user (run once after migration):

```bash
bun run seed
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Runs on **http://localhost:5173**

---

## Claude Code Prompts Used to Build This

A log of the prompts used to build this project with Claude Code.

**Kick-off & planning**

```text
Read @project-scope.md. Review it and ask me clarifying questions. Help me find gaps or things I haven't thought through.
```

```text
Suggest a tech stack for this project.
```

```text
Create an implementation plan. Break the project into small tasks and group them into phases.
```

**Phase 1 — Core setup**

```text
Complete the Phase 1 from @implementation-plan.md use bun as a package manager. And use context7 for up-to-date docs.
```

```text
In the frontend app. in @App.tsx call the /api/health api and display a message.
```

```text
Include project overview, tech stack & key conventions in the CLAUDE.md.
```

**Database**

```text
Set up Prisma with postgres. Connect the app to postgres database.
```

**Authentication**

Install the Better Auth skill, then prompt Claude to set it up:

```bash
npx skills add better-auth/skills
```

```text
set up better auth with email/password and use database sessions. bare minimum. no ui. ask me clarifying questions.
```

```text
disable the signup endpoint temporarily
```

```text
create a seed script to create an admin user. do not create duplicated users.

use the email: abhisek.dutta.507@gmail.com.

store the credential in a .env. use the credentials from .env.
```

**Testing**

Playwright is the most modern solution for e2e testing.

```text
setup playwright with a separate database for testing
```

**Housekeeping**

```text
update the project implementation-plan.md, project-scope.md, README.md & tech-stack.md if needed
```
