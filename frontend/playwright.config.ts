import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, 'e2e/.auth/admin.json')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
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
      command: 'NODE_ENV=test bun run start',
      cwd: path.join(__dirname, '../backend'),
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
