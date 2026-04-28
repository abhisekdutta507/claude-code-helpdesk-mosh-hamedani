import { test, expect } from '@playwright/test'

test('home page shows welcome message', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /welcome, admin/i })).toBeVisible()
})

test('sign out redirects to login', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login')
})
