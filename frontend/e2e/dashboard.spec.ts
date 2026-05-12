import { test, expect } from '@playwright/test'

test('home page shows welcome message', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /welcome, admin/i })).toBeVisible()
})

// Sign-out must use its own fresh session — calling signOut deletes the session
// from the database, which would break concurrent tests using the shared session.
// Use unauthenticated state so the test can log in fresh and own its session.
test.describe('sign out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('sign out redirects to login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('admin@test.local')
    await page.locator('#password').fill('TestAdmin@1234!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/')

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')
  })
})
