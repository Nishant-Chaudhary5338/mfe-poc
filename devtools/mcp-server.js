import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { genLoginPage, genFormPage, genDetailPage, genCrud, genTests, inferFields } from './generators/index.js';
import { appMeta, patchAppTsx, writeRouteFile, cap } from './generators/utils.js';
import { runReview } from './generators/review.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REGISTRY_PATH = join(__dirname, 'data', 'registry.json');

function readRegistry() {
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')); } catch { return []; }
}

const server = new McpServer({ name: 'tvplus-devtools', version: '1.0.0' });

// ── Tool 1: list_plugins ─────────────────────────────────────────────────────
server.tool('list_plugins', 'List all registered MFE plugins', {}, () => {
  const reg = readRegistry();
  return { content: [{ type: 'text', text: JSON.stringify(reg, null, 2) }] };
});

// ── Tool 2: scaffold_plugin ──────────────────────────────────────────────────
server.tool('scaffold_plugin', 'Scaffold a new MFE plugin app', {
  id: z.string().describe('Plugin ID (e.g. "billing")'),
  label: z.string().describe('Display label (e.g. "Billing")'),
  port: z.number().describe('Dev server port (e.g. 3005)'),
  color: z.string().optional().describe('Brand color hex (e.g. "#1428A0")'),
  routes: z.array(z.string()).optional().describe('Initial route names'),
}, ({ id, label, port, color = '#1428A0', routes = [] }) => {
  const result = spawnSync('curl', [
    '-s', '-X', 'POST', 'http://localhost:5001/api/scaffold',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({ id, label, port, color, routes }),
  ], { encoding: 'utf8' });
  return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
});

// ── Tool 3: add_route ────────────────────────────────────────────────────────
server.tool('add_route', 'Add a new route to an existing plugin', {
  appId: z.string().describe('Plugin ID'),
  name: z.string().describe('Route component name (e.g. "Invoices")'),
  path: z.string().describe('Route path (e.g. "/invoices")'),
}, ({ appId, name, path }) => {
  const result = spawnSync('curl', [
    '-s', '-X', 'POST', 'http://localhost:5001/api/route/add',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({ appId, name, path }),
  ], { encoding: 'utf8' });
  return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
});

// ── Tool 4: generate_login ───────────────────────────────────────────────────
server.tool('generate_login', 'Generate a login page for a plugin', {
  appId: z.string().describe('Plugin ID'),
  endpoint: z.string().describe('Auth API endpoint URL'),
  addRoute: z.boolean().optional().describe('Write file and patch App.tsx'),
}, ({ appId, endpoint, addRoute = false }) => {
  const { label, color } = appMeta(appId);
  const code = genLoginPage({ endpoint, label, color });
  if (addRoute) {
    const appDir = join(ROOT, 'apps', appId);
    writeRouteFile(appDir, 'Login.tsx', code);
    patchAppTsx(appDir, 'Login', '/login');
  }
  return { content: [{ type: 'text', text: addRoute ? `Written Login.tsx and patched App.tsx\n\n${code}` : code }] };
});

// ── Tool 5: generate_form ────────────────────────────────────────────────────
server.tool('generate_form', 'Generate a form page using AutoForm + Zod schema', {
  appId: z.string().describe('Plugin ID'),
  pageName: z.string().describe('Page name (e.g. "CreateArticle")'),
  endpoint: z.string().describe('API endpoint URL'),
  method: z.enum(['POST', 'PUT', 'PATCH']).optional().describe('HTTP method'),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'email', 'password', 'number', 'textarea', 'boolean', 'date', 'select']),
    required: z.boolean().optional(),
    label: z.string().optional(),
  })).optional().describe('Field definitions'),
  addRoute: z.boolean().optional().describe('Write file and patch App.tsx'),
}, ({ appId, pageName, endpoint, method = 'POST', fields = [], addRoute = false }) => {
  const { color } = appMeta(appId);
  const code = genFormPage({ pageName, endpoint, method, fields, color });
  if (addRoute) {
    const appDir = join(ROOT, 'apps', appId);
    const filename = `${cap(pageName)}Page.tsx`;
    writeRouteFile(appDir, filename, code);
    patchAppTsx(appDir, cap(pageName) + 'Page', `/${pageName.toLowerCase()}`);
  }
  return { content: [{ type: 'text', text: code }] };
});

// ── Tool 6: generate_detail ──────────────────────────────────────────────────
server.tool('generate_detail', 'Generate a detail/view page for a resource', {
  appId: z.string().describe('Plugin ID'),
  pageName: z.string().describe('Page name (e.g. "Article")'),
  endpoint: z.string().describe('API endpoint with :id param'),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
  })).optional(),
  addRoute: z.boolean().optional(),
}, ({ appId, pageName, endpoint, fields = [], addRoute = false }) => {
  const code = genDetailPage({ pageName, endpoint, fields });
  if (addRoute) {
    const appDir = join(ROOT, 'apps', appId);
    writeRouteFile(appDir, `${cap(pageName)}DetailPage.tsx`, code);
    patchAppTsx(appDir, `${cap(pageName)}DetailPage`, `/${pageName.toLowerCase()}/:id`);
  }
  return { content: [{ type: 'text', text: code }] };
});

// ── Tool 7: generate_crud ────────────────────────────────────────────────────
server.tool('generate_crud', 'Generate full CRUD suite (List + Detail + Form + EditForm)', {
  appId: z.string().describe('Plugin ID'),
  resource: z.string().describe('Resource name singular (e.g. "Article")'),
  baseEndpoint: z.string().describe('Base REST endpoint (e.g. "/api/articles")'),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'email', 'password', 'number', 'textarea', 'boolean', 'date', 'select']),
    required: z.boolean().optional(),
    label: z.string().optional(),
  })).optional(),
  addRoute: z.boolean().optional().describe('Write all 4 files and patch App.tsx'),
}, ({ appId, resource, baseEndpoint, fields = [], addRoute = false }) => {
  const { color } = appMeta(appId);
  const pages = genCrud({ resource, baseEndpoint, fields, color });
  if (addRoute) {
    const appDir = join(ROOT, 'apps', appId);
    for (const page of Object.values(pages)) {
      writeRouteFile(appDir, page.filename, page.code);
      patchAppTsx(appDir, page.routeName, page.route);
    }
  }
  const summary = Object.entries(pages)
    .map(([k, p]) => `${p.filename} → ${p.route}`)
    .join('\n');
  const allCode = Object.entries(pages)
    .map(([k, p]) => `\n// ── ${p.filename} ──\n${p.code}`)
    .join('\n');
  return { content: [{ type: 'text', text: addRoute ? `Generated and written:\n${summary}\n\n${allCode}` : allCode }] };
});

// ── Tool 8: generate_tests ───────────────────────────────────────────────────
server.tool('generate_tests', 'Generate Vitest tests for a component', {
  sourceCode: z.string().describe('The full source code of the component'),
  componentName: z.string().describe('Component file name without extension (e.g. "ArticleList")'),
}, ({ sourceCode, componentName }) => {
  const code = genTests({ sourceCode, componentName });
  return { content: [{ type: 'text', text: code }] };
});

// ── Tool 9: run_review ───────────────────────────────────────────────────────
server.tool('run_review', 'Run TypeScript check + code quality review on a plugin', {
  appId: z.string().describe('Plugin ID to review'),
}, ({ appId }) => {
  const result = runReview({ appId });
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// ── Tool 10: infer_fields ────────────────────────────────────────────────────
server.tool('infer_fields', 'Infer field definitions from a JSON sample response or OpenAPI schema snippet', {
  apiDoc: z.string().describe('JSON string — either a sample API response or an OpenAPI schema object with "properties"'),
}, ({ apiDoc }) => {
  const result = inferFields(apiDoc);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// ── Tool 11: smart_generate ──────────────────────────────────────────────────
server.tool('smart_generate',
  'One-shot: infer fields from API doc then generate + write pages. pageType: login | form | detail | crud',
  {
    appId: z.string().describe('Plugin ID'),
    pageType: z.enum(['login', 'form', 'detail', 'crud']).describe('Page type to generate'),
    endpoint: z.string().describe('API endpoint URL (use :id for parameterised routes)'),
    apiDoc: z.string().optional().describe('JSON sample response or OpenAPI schema — fields are inferred automatically'),
    pageName: z.string().optional().describe('Page/resource name (e.g. "Article"). Required for form, detail, crud.'),
    method: z.enum(['POST', 'PUT', 'PATCH']).optional().describe('HTTP method for form pages (default POST)'),
    resource: z.string().optional().describe('Resource name for CRUD (singular, e.g. "Article")'),
    addRoute: z.boolean().optional().describe('Write files and patch App.tsx (default false — preview only)'),
  },
  ({ appId, pageType, endpoint, apiDoc, pageName, method = 'POST', resource, addRoute = false }) => {
    const inferred = apiDoc ? inferFields(apiDoc) : { fields: [] };
    if (inferred.error && apiDoc) return { content: [{ type: 'text', text: `Field inference failed: ${inferred.error}` }] };
    const fields = inferred.fields;

    const { label, color } = appMeta(appId);
    const appDir = join(ROOT, 'apps', appId);
    let summary = '';
    const lines = [];

    if (pageType === 'login') {
      const code = genLoginPage({ endpoint, label, color });
      if (addRoute) { writeRouteFile(appDir, 'Login.tsx', code); patchAppTsx(appDir, 'Login', '/login'); }
      lines.push(`// ── Login.tsx ──\n${code}`);
      summary = addRoute ? 'Written Login.tsx → /login' : 'Preview only (addRoute: false)';

    } else if (pageType === 'form') {
      const name = pageName || 'Form';
      const code = genFormPage({ pageName: name, endpoint, method, fields, color });
      const filename = `${name.charAt(0).toUpperCase() + name.slice(1)}Page.tsx`;
      if (addRoute) { writeRouteFile(appDir, filename, code); patchAppTsx(appDir, filename.replace('.tsx',''), `/${name.toLowerCase()}`); }
      lines.push(`// ── ${filename} ──\n${code}`);
      summary = addRoute ? `Written ${filename}` : 'Preview only (addRoute: false)';

    } else if (pageType === 'detail') {
      const name = pageName || 'Detail';
      const cname = name.charAt(0).toUpperCase() + name.slice(1);
      const code = genDetailPage({ pageName: name, endpoint, fields });
      const filename = `${cname}DetailPage.tsx`;
      if (addRoute) { writeRouteFile(appDir, filename, code); patchAppTsx(appDir, filename.replace('.tsx',''), `/${name.toLowerCase()}/:id`); }
      lines.push(`// ── ${filename} ──\n${code}`);
      summary = addRoute ? `Written ${filename}` : 'Preview only (addRoute: false)';

    } else if (pageType === 'crud') {
      const res_name = resource || pageName || 'Resource';
      const pages = genCrud({ resource: res_name, baseEndpoint: endpoint, fields, color });
      if (addRoute) {
        for (const page of Object.values(pages)) {
          writeRouteFile(appDir, page.filename, page.code);
          patchAppTsx(appDir, page.routeName, page.route);
        }
      }
      for (const page of Object.values(pages)) lines.push(`// ── ${page.filename} (${page.route}) ──\n${page.code}`);
      summary = addRoute ? `Written ${Object.values(pages).map(p => p.filename).join(', ')}` : 'Preview only (addRoute: false)';
    }

    const header = [
      `[smart_generate] appId=${appId} pageType=${pageType} addRoute=${addRoute}`,
      apiDoc ? `Fields inferred from ${inferred.source}: ${fields.map(f => f.name).join(', ') || 'none'}` : 'No apiDoc provided — no fields',
      summary,
      '',
    ].join('\n');

    return { content: [{ type: 'text', text: header + lines.join('\n\n') }] };
  }
);

// ── Tool 12: build_plugin ────────────────────────────────────────────────────
server.tool('build_plugin', 'Build a plugin and return the result', {
  appId: z.string().describe('Plugin ID to build'),
}, ({ appId }) => {
  const result = spawnSync('pnpm', ['--filter', appId, 'build'], {
    cwd: ROOT, shell: true, encoding: 'utf8',
  });
  const out = (result.stdout || '') + (result.stderr || '');
  return { content: [{ type: 'text', text: result.status === 0 ? `Build succeeded:\n${out}` : `Build failed:\n${out}` }] };
});

// ── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
