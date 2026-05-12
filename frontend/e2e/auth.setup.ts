import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { testUsers } from './test-credentials';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill(testUsers.admin.email);
  await page.locator('#password').fill(testUsers.admin.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
  await page.context().storageState({ path: authFile });
});
