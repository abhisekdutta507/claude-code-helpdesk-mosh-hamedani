---
name: E2E infrastructure setup learnings
description: Playwright webServer config, port strategy, bun PATH in child processes, env var handling for test vs dev backends
type: project
---

## Port strategy

- Dev backend runs on port 3000, dev frontend on port 5173.
- Test backend runs on port **3001**, test frontend on port **5174** to avoid conflicts.
- `playwright.config.ts` uses `baseURL: 'http://localhost:5174'`.

## Vite test mode

- `frontend/.env.test` sets `VITE_API_URL=http://localhost:3001`.
- Vite webServer uses `--mode test --port 5174` to load `.env.test`.
- Command in config: `${bunBin} run dev -- --mode test --port 5174`

## Backend webServer env

- Backend reads `.env.test` only when `NODE_ENV=test` and cwd is the backend dir.
- `playwright.config.ts` parses `backend/.env.test` with a `parseEnvFile()` helper and passes vars explicitly via `webServer.env`.
- Must include `CORS_ORIGIN=http://localhost:5174` in `.env.test` (not 5173 — the test frontend is on 5174).

## webServer must use `stdout: 'pipe'`

- Without `stdout: 'pipe'` on the backend webServer, Playwright suppresses its output and silently treats startup failures as "already running" (due to `reuseExistingServer: true`). Always add `stdout: 'pipe', stderr: 'pipe'` to the backend entry.

## Bun PATH in child processes

- Playwright webServer commands, and all `execSync` calls in `global.setup.ts`, run in non-interactive shells where `bun` is NOT on PATH.
- Always use the full path: `${process.env.HOME}/.bun/bin/bun` (or `~/.bun/bin/bun` when expanded).
- In `global.setup.ts`, augment the env's PATH: `env.PATH = \`${bunDir}:\${env.PATH}\`` so that scripts like `seed` which internally call `bun run ...` also find bun.

## Stale server processes

- `reuseExistingServer: true` reuses whatever is on the port without verifying it's the right backend.
- After a failed test run, the test backend may remain on port 3001/5174. Kill before re-running: `lsof -i :3001 -sTCP:LISTEN | awk 'NR>1 {print $2}' | xargs kill`.
