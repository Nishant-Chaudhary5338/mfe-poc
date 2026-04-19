import { test, expect } from '@playwright/test';

test.describe('DevLogin page', () => {
  test.beforeEach(async ({ request }) => {
    // Ensure logged out
    await request.delete('http://localhost:5001/api/dev-session');
  });

  test('shows the login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    // The login page has a "Sign in" button (not a nav sidebar)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 8_000 });
  });

  test('logs in as admin via UI and shows dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /sign in/i }).click();
    // After login, aside sidebar renders with nav buttons — wait for it
    await expect(page.locator('aside')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('aside nav').getByText('Dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('logs out and returns to login screen', async ({ page, request }) => {
    // Login first via API
    await request.post('http://localhost:5001/api/dev-session', {
      data: { user: { id: '1', name: 'Nishant', email: 'alice@tvplus.com', role: 'admin' } },
    });
    await page.goto('/');
    // Sidebar nav is inside <aside><nav> — wait for any nav button to appear
    await page.waitForSelector('aside nav button', { timeout: 15_000 });

    // Click "Out" logout button (text content is exactly "Out")
    await page.getByRole('button', { name: /^Out$/i }).click();
    // Should return to login screen
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10_000 });

    // Cleanup
    await request.delete('http://localhost:5001/api/dev-session');
  });
});
