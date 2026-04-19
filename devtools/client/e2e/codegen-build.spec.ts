import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const API = 'http://localhost:5001';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');
const SMS_DIR = join(ROOT, 'apps/sms');
const SMS_ROUTES = join(SMS_DIR, 'src/routes');
const SMS_APP_TSX = join(SMS_DIR, 'src/App.tsx');

function cleanupE2ERoutes() {
  // Remove any E2E-generated route files
  const patterns = ['E2ETest', 'E2ELogin', 'E2EForm'];
  for (const prefix of patterns) {
    for (const suffix of ['List.tsx', 'Detail.tsx', 'Form.tsx', 'EditForm.tsx', '.tsx']) {
      const f = join(SMS_ROUTES, `${prefix}${suffix}`);
      if (existsSync(f)) unlinkSync(f);
    }
  }
  // Restore App.tsx to git HEAD
  spawnSync('git', ['checkout', 'apps/sms/src/App.tsx'], { cwd: ROOT });
}

test.describe('Code generation → TypeScript build pipeline', () => {
  test.afterEach(cleanupE2ERoutes);

  test('generate CRUD → write to sms → TypeScript build passes', async ({ request }) => {
    // Step 1: Generate CRUD with addRoute: true
    const res = await request.post(`${API}/api/generate/crud`, {
      data: {
        appId: 'sms',
        resource: 'E2ETest',
        baseEndpoint: '/api/e2etests',
        fields: [
          { name: 'title', type: 'text', required: true, label: 'Title' },
          { name: 'count', type: 'number', required: false, label: 'Count' },
        ],
        addRoute: true,
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('pages');

    // Step 2: Verify files were created on disk
    expect(existsSync(join(SMS_ROUTES, 'E2ETestList.tsx'))).toBe(true);
    expect(existsSync(join(SMS_ROUTES, 'E2ETestDetail.tsx'))).toBe(true);
    expect(existsSync(join(SMS_ROUTES, 'E2ETestForm.tsx'))).toBe(true);
    expect(existsSync(join(SMS_ROUTES, 'E2ETestEditForm.tsx'))).toBe(true);

    // Step 3: Verify App.tsx was patched
    const appTsx = readFileSync(SMS_APP_TSX, 'utf8');
    expect(appTsx).toContain('E2ETestList');

    // Step 4: Run TypeScript build
    const buildResult = spawnSync('pnpm', ['--filter', 'sms', 'build'], {
      cwd: ROOT,
      shell: true,
      encoding: 'utf8',
      timeout: 60_000,
    });
    const buildOutput = (buildResult.stdout || '') + (buildResult.stderr || '');
    // If build failed, show the error
    if (buildResult.status !== 0) {
      console.error('Build failed:\n', buildOutput);
    }
    expect(buildResult.status).toBe(0);
  });

  test('generate Login → write to sms → TypeScript build passes', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/login`, {
      data: {
        appId: 'sms',
        endpoint: '/api/auth/login',
        addRoute: true,
      },
    });
    expect(res.ok()).toBe(true);

    // Verify file created
    expect(existsSync(join(SMS_ROUTES, 'Login.tsx'))).toBe(true);

    // Verify App.tsx was patched
    const appTsx = readFileSync(SMS_APP_TSX, 'utf8');
    expect(appTsx).toContain('Login');

    // Run build
    const buildResult = spawnSync('pnpm', ['--filter', 'sms', 'build'], {
      cwd: ROOT,
      shell: true,
      encoding: 'utf8',
      timeout: 60_000,
    });
    if (buildResult.status !== 0) {
      console.error('Build output:\n', (buildResult.stdout || '') + (buildResult.stderr || ''));
    }
    expect(buildResult.status).toBe(0);
  });

  test('generate Form → write to sms → TypeScript build passes', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/form`, {
      data: {
        appId: 'sms',
        pageName: 'E2EForm',
        endpoint: '/api/e2eforms',
        method: 'POST',
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Name' },
          { name: 'email', type: 'email', required: true, label: 'Email' },
          { name: 'active', type: 'boolean', required: false, label: 'Active' },
        ],
        addRoute: true,
      },
    });
    expect(res.ok()).toBe(true);

    expect(existsSync(join(SMS_ROUTES, 'E2EFormPage.tsx'))).toBe(true);

    const buildResult = spawnSync('pnpm', ['--filter', 'sms', 'build'], {
      cwd: ROOT,
      shell: true,
      encoding: 'utf8',
      timeout: 60_000,
    });
    if (buildResult.status !== 0) {
      console.error('Build output:\n', (buildResult.stdout || '') + (buildResult.stderr || ''));
    }
    expect(buildResult.status).toBe(0);
  });

  test('generated code content is valid React/TypeScript', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/crud`, {
      data: {
        appId: 'cms',
        resource: 'Post',
        baseEndpoint: '/api/posts',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'body', type: 'textarea', required: false },
          { name: 'published', type: 'boolean', required: false },
        ],
      },
    });
    expect(res.ok()).toBe(true);
    const { pages } = await res.json();

    // List page: navigate in scope, not window.location
    expect(pages.list.code).not.toContain('window.location.href');
    expect(pages.list.code).toContain('useNavigate');
    expect(pages.list.code).toContain('navigate(');

    // Form page: required string has .min(1)
    expect(pages.form.code).toContain("min(1, 'Required')");

    // Detail page: uses Skeleton for loading
    expect(pages.detail.code).toContain('<Skeleton');

    // Login page: redirect if already logged in
    const loginRes = await request.post(`${API}/api/generate/login`, {
      data: { appId: 'cms', endpoint: '/api/auth/login' },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.code).toContain("localStorage.getItem('auth_token')");
    expect(loginBody.code).toContain("navigate('/')");
  });
});
