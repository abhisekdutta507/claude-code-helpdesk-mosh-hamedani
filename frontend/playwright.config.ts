import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, 'e2e/.auth/admin.json');
const backendDir = path.join(__dirname, '../backend');

/** Parse a .env file into a key→value map (strips quotes, skips comments). */
function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  } catch {
    // file may not exist in CI — ignore
  }
  return env;
}

const testEnv = parseEnvFile(path.join(backendDir, '.env.test'));
const bunBin = `${process.env.HOME}/.bun/bin/bun`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  globalSetup: './e2e/global.setup.ts',
  projects: [
    {
      name: 'setup',
      testMatch: ['**/auth.setup.ts'],
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      // Run the test backend on port 3001 so it never conflicts with the dev
      // server on port 3000. Env vars from .env.test are passed explicitly so
      // they take precedence over any inherited shell env.
      command: `${bunBin} index.ts`,
      cwd: backendDir,
      env: {
        ...testEnv,
        NODE_ENV: 'test',
        PORT: '3001',
      },
      port: 3001,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Run Vite in --mode test so it loads frontend/.env.test
      // (VITE_API_URL=http://localhost:3001). Use port 5174 so it does not
      // conflict with the dev server on port 5173.
      command: `${bunBin} run dev -- --mode test --port 5174`,
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
