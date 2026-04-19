import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export { expect };

// Matches MOCK_USERS[0] in DevLogin.tsx — admin role
export const ADMIN_USER = { id: '1', name: 'Nishant', email: 'alice@tvplus.com', role: 'admin' };

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page, request }, use) => {
    // Write session directly via API (file-based, no cookies needed)
    const res = await request.post('http://localhost:5001/api/dev-session', {
      data: { user: ADMIN_USER },
    });
    if (!res.ok()) throw new Error(`Auth setup failed: ${res.status()}`);

    await page.goto('/');
    // Wait until sidebar nav buttons are visible (means app rendered past login)
    await page.waitForSelector('aside nav button', { timeout: 15_000 });
    await use(page);

    // Cleanup — delete session after test
    await request.delete('http://localhost:5001/api/dev-session');
  },
});
