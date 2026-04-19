import { test, expect } from './fixtures/auth.ts';

test.describe('Studio page — navigation', () => {
  test('Code Studio tab is visible in sidebar and navigates correctly', async ({ authedPage: page }) => {
    // Find "Code Studio" nav item in sidebar
    const studioBtn = page.getByRole('button', { name: /code studio/i });
    await expect(studioBtn).toBeVisible();
    await studioBtn.click();

    // Page heading should update
    await expect(page.getByRole('heading', { name: 'Code Studio' })).toBeVisible();

    // All 5 tab buttons should be visible
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /form/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /detail/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /crud/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /review/i })).toBeVisible();
  });
});

test.describe('Studio — CRUD tab', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /code studio/i }).click();
    await page.waitForTimeout(300);
    // CRUD tab should be active by default (default tab)
    const crudBtn = page.getByRole('button', { name: /⚡ crud/i });
    if (await crudBtn.isVisible()) await crudBtn.click();
  });

  test('plugin dropdown has apps from registry', async ({ authedPage: page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    // Should have at least the 4 registered apps
    expect(options.some(o => /sms|qca|cms|mam/i.test(o))).toBe(true);
  });

  test('generates CRUD code and shows 4 file tabs', async ({ authedPage: page }) => {
    // Select plugin
    await page.locator('select').first().selectOption('sms');

    // Fill resource and endpoint
    const inputs = page.locator('input[placeholder]');
    await inputs.nth(0).fill('Article');           // resource
    await inputs.nth(1).fill('/api/articles');     // baseEndpoint

    // Add a field
    await page.getByRole('button', { name: /\+ add field/i }).click();
    const fieldNameInput = page.locator('input[placeholder="name"]').first();
    await fieldNameInput.fill('title');

    // Click Generate
    await page.getByRole('button', { name: /^generate$/i }).click();

    // Wait for code preview
    await expect(page.locator('pre')).toBeVisible({ timeout: 15_000 });

    // 4 file tabs should appear
    await expect(page.getByRole('button', { name: /ArticleList\.tsx/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ArticleDetail\.tsx/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ArticleForm\.tsx/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ArticleEditForm\.tsx/i })).toBeVisible();

    // Generated code references shared-ui
    const preText = await page.locator('pre').textContent();
    expect(preText).toContain('@repo/shared-ui');
    expect(preText).toContain('import');
  });

  test('switching file tabs changes code preview content', async ({ authedPage: page }) => {
    await page.locator('select').first().selectOption('sms');
    const inputs = page.locator('input[placeholder]');
    await inputs.nth(0).fill('Product');
    await inputs.nth(1).fill('/api/products');
    await page.getByRole('button', { name: /^generate$/i }).click();
    await expect(page.locator('pre')).toBeVisible({ timeout: 15_000 });

    const listText = await page.locator('pre').textContent();
    await page.getByRole('button', { name: /ProductDetail\.tsx/i }).click();
    const detailText = await page.locator('pre').textContent();
    expect(listText).not.toBe(detailText);
    expect(detailText).toContain('Skeleton');
  });

  test('"Write to app" button appears after generation', async ({ authedPage: page }) => {
    await page.locator('select').first().selectOption('sms');
    const inputs = page.locator('input[placeholder]');
    await inputs.nth(0).fill('Tag');
    await inputs.nth(1).fill('/api/tags');
    await page.getByRole('button', { name: /^generate$/i }).click();
    await expect(page.locator('pre')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /write to app/i })).toBeVisible();
  });
});

test.describe('Studio — Login tab', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /code studio/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /🔑 login/i }).click();
  });

  test('generates login page code', async ({ authedPage: page }) => {
    await page.locator('select').first().selectOption('sms');
    // Default endpoint is already filled
    await page.getByRole('button', { name: /^generate$/i }).click();
    await expect(page.locator('pre')).toBeVisible({ timeout: 15_000 });

    const code = await page.locator('pre').textContent();
    expect(code).toContain('LoginPage');
    expect(code).toContain('fetch');
    expect(code).toContain('@repo/shared-ui');
  });

  test('"Write to app" button appears after generating login page', async ({ authedPage: page }) => {
    await page.locator('select').first().selectOption('sms');
    await page.getByRole('button', { name: /^generate$/i }).click();
    await expect(page.locator('pre')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /write to app/i })).toBeVisible();
  });
});

test.describe('Studio — Form tab', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /code studio/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /📝 form/i }).click();
  });

  test('generates form page with AutoForm', async ({ authedPage: page }) => {
    await page.locator('select').first().selectOption('sms');
    const inputs = page.locator('input[placeholder]');
    await inputs.nth(0).fill('CreateArticle');
    await inputs.nth(1).fill('/api/articles');

    // Add 2 fields
    await page.getByRole('button', { name: /\+ add field/i }).click();
    await page.locator('input[placeholder="name"]').nth(0).fill('title');
    await page.getByRole('button', { name: /\+ add field/i }).click();
    await page.locator('input[placeholder="name"]').nth(1).fill('content');
    // Change second field type to textarea (select[0]=plugin, select[1]=field1-type, select[2]=field2-type)
    await page.locator('select').nth(2).selectOption('textarea');

    await page.getByRole('button', { name: /^generate$/i }).click();
    await expect(page.locator('pre')).toBeVisible({ timeout: 15_000 });

    const code = await page.locator('pre').textContent();
    expect(code).toContain('AutoForm');
    expect(code).toContain('z.object');
    expect(code).toContain('title');
    expect(code).toContain('content');
  });
});

test.describe('Studio — Review tab', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /code studio/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /🎯 review/i }).click();
  });

  test('runs review and shows a grade', async ({ authedPage: page }) => {
    await page.locator('select').first().selectOption('sms');
    await page.getByRole('button', { name: /run review/i }).click();

    // Grade should appear (A-F letter in a large div)
    await expect(page.locator('text=/^[ABCDF]$/')).toBeVisible({ timeout: 20_000 });

    // JSON preview should appear
    await expect(page.locator('pre')).toBeVisible({ timeout: 10_000 });
    const json = await page.locator('pre').textContent();
    expect(json).toContain('grade');
    expect(json).toContain('tsErrors');
  });
});
