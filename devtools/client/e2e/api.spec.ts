import { test, expect } from '@playwright/test';

const API = 'http://localhost:5001';

// Shared field definitions for test payloads
const SAMPLE_FIELDS = [
  { name: 'title', type: 'text', required: true, label: 'Title' },
  { name: 'count', type: 'number', required: false, label: 'Count' },
];

test.describe('GET /api/apps', () => {
  test('returns registered apps array', async ({ request }) => {
    const res = await request.get(`${API}/api/apps`);
    expect(res.ok()).toBe(true);
    const apps = await res.json();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThanOrEqual(4);
    for (const app of apps) {
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('label');
      expect(app).toHaveProperty('url');
    }
  });
});

test.describe('POST /api/generate/login', () => {
  test('returns valid login page code', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/login`, {
      data: { appId: 'sms', endpoint: '/api/auth/login' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('filename', 'Login.tsx');
    expect(body).toHaveProperty('route', '/login');
    expect(body.code).toContain('LoginPage');
    expect(body.code).toContain('fetch');
    expect(body.code).toContain('@repo/shared-ui');
    expect(body.code).toContain('/api/auth/login');
    expect(body.code).toContain('useEffect');  // redirect if already logged in
  });

  test('returns 400 if appId missing', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/login`, {
      data: { endpoint: '/api/auth/login' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('POST /api/generate/form', () => {
  test('returns valid AutoForm page code', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/form`, {
      data: {
        appId: 'sms',
        pageName: 'TestForm',
        endpoint: '/api/test',
        method: 'POST',
        fields: SAMPLE_FIELDS,
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('code');
    expect(body.code).toContain('AutoForm');
    expect(body.code).toContain('z.object');
    expect(body.code).toContain('TestFormSchema');
    expect(body.code).toContain('title');
    expect(body.code).toContain("z.string().min(1, 'Required')");  // required field has .min(1)
    expect(body.code).toContain('z.coerce.number().optional()');  // optional number
    expect(body.code).toContain('/api/test');
  });

  test('PUT method generates correct submitText', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/form`, {
      data: { appId: 'sms', pageName: 'EditItem', endpoint: '/api/items/:id', method: 'PUT', fields: [] },
    });
    const body = await res.json();
    expect(body.code).toContain('PUT');
    expect(body.code).toContain('Update EditItem');
  });
});

test.describe('POST /api/generate/detail', () => {
  test('returns valid detail page code', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/detail`, {
      data: {
        appId: 'sms',
        pageName: 'Article',
        endpoint: '/api/articles/:id',
        fields: [{ name: 'title', label: 'Title' }],
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.code).toContain('ArticleDetailPage');
    expect(body.code).toContain('Skeleton');
    expect(body.code).toContain('useParams');
    expect(body.code).toContain('/api/articles/:id');
    expect(body.code).toContain('Title');  // field label rendered
    expect(body).toHaveProperty('filename', 'ArticleDetailPage.tsx');
    expect(body).toHaveProperty('route', '/article/:id');
  });
});

test.describe('POST /api/generate/crud', () => {
  test('returns all 4 pages', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/crud`, {
      data: {
        appId: 'sms',
        resource: 'Article',
        baseEndpoint: '/api/articles',
        fields: SAMPLE_FIELDS,
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('pages');
    const { list, detail, form, editForm } = body.pages;

    // List page
    expect(list.filename).toBe('ArticleList.tsx');
    expect(list.code).toContain('DataTable');
    expect(list.code).toContain('/api/articles');
    // navigate in scope (columns inside component)
    expect(list.code).toContain('navigate(');
    expect(list.code).not.toContain('window.location.href');

    // Detail page
    expect(detail.filename).toBe('ArticleDetail.tsx');
    expect(detail.code).toContain('Skeleton');
    expect(detail.code).toContain('useParams');

    // Form page (Create)
    expect(form.filename).toBe('ArticleForm.tsx');
    expect(form.code).toContain('AutoForm');
    expect(form.code).toContain('POST');

    // Edit form page
    expect(editForm.filename).toBe('ArticleEditForm.tsx');
    expect(editForm.code).toContain('PUT');

    // Routes
    expect(list.route).toBe('/article');
    expect(detail.route).toBe('/article/:id');
    expect(form.route).toBe('/article/new');
    expect(editForm.route).toBe('/article/:id/edit');
  });

  test('returns 400 if resource missing', async ({ request }) => {
    const res = await request.post(`${API}/api/generate/crud`, {
      data: { appId: 'sms', baseEndpoint: '/api/articles' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('POST /api/generate/tests', () => {
  test('generates vitest test file', async ({ request }) => {
    const source = `
      import { useState } from 'react';
      export default function ArticleList() {
        const [data, setData] = useState([]);
        fetch('/api/articles').then(r => r.json()).then(setData);
        return <div>{data.length}</div>;
      }
    `;
    const res = await request.post(`${API}/api/generate/tests`, {
      data: { sourceCode: source, componentName: 'ArticleList' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('filename', 'ArticleList.test.tsx');
    expect(body.code).toContain("from 'vitest'");
    expect(body.code).toContain('describe');
    expect(body.code).toContain('ArticleList');
    // Should NOT import @testing-library (vitest-only; comment mention is okay)
    expect(body.code).not.toContain("from '@testing-library/react'");
    // Should have fetch mock since source uses fetch
    expect(body.code).toContain('fetch');
  });
});

test.describe('POST /api/review', () => {
  test('returns grade and tsErrors for sms app', async ({ request }) => {
    const res = await request.post(`${API}/api/review`, {
      data: { appId: 'sms' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('grade');
    expect(body).toHaveProperty('tsErrors');
    expect(body).toHaveProperty('issues');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(body.grade);
    expect(Array.isArray(body.issues)).toBe(true);
  });

  test('returns error for non-existent appId', async ({ request }) => {
    const res = await request.post(`${API}/api/review`, {
      data: { appId: 'nonexistent' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

test.describe('GET /api/deploy/:appId/history', () => {
  test('returns array for sms', async ({ request }) => {
    const res = await request.get(`${API}/api/deploy/sms/history`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('returns empty array for unknown app', async ({ request }) => {
    const res = await request.get(`${API}/api/deploy/unknown-app/history`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
