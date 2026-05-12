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

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- PostgreSQL database (local or [Neon](https://neon.tech))
- `backend/.env` configured (see env vars below)

### Environment variables (`backend/.env`)

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:5173"

SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="Admin@1234!"
SEED_AGENT1_EMAIL="agent1@example.com"
SEED_AGENT1_PASSWORD="Agent@1234!"
```

### Backend

```bash
cd backend
bun install
bun run prisma generate
export $(grep -v '^#' .env | xargs) && bun run prisma migrate deploy
bun run seed.ts        # creates admin + agent users from .env (idempotent)
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

```text
Write e2e test cases for the authentication system. Cover all scenarios & edge cases.
Then update the memory & .md files.
Add the prompt in the README.md
```

**Security hardening**

```text
do a security review of this project
```

```text
fix the medium severity issues
```

```text
disable rate limiting outside production
```

**Admin — user management**

```text
build the admin users page. admins can create and deactivate agent accounts.
```

**Claude Code configuration**

```text
add a code-reviewer subagent
```

```text
move the testing instructions from CLAUDE.md to e2e-test-writer
```

```text
update CLAUDE.md. add instructions for using e2e-test-writer for writing tests
```

**Housekeeping**

```text
update the project implementation-plan.md, project-scope.md, README.md & tech-stack.md if needed
```
