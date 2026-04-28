import { test as setup } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, '.auth/admin.json')

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('admin@test.local')
  await page.locator('#password').fill('TestAdmin@1234!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
  await page.context().storageState({ path: authFile })
})
