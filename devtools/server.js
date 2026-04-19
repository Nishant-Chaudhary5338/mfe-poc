import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { spawn, spawnSync } from 'child_process';
import { genLoginPage, genFormPage, genDetailPage, genCrud, genTests, inferFields } from './generators/index.js';
import { appMeta, patchAppTsx, writeRouteFile } from './generators/utils.js';
import { runReview } from './generators/review.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REGISTRY_PATH = join(__dirname, 'data', 'registry.json');

// Track running preview processes so we can restart them after a build
const previewProcs = new Map(); // appId → ChildProcess
let buildRevision = 0;

const HARDCODED_PORTS = { shell: '3000' };

function portForApp(appId) {
  const reg = readRegistrySafe();
  const entry = reg.find(e => e.id === appId);
  if (!entry) return null;
  const m = entry.url.match(/:(\d+)\//);
  return m ? m[1] : null;
}

function readRegistrySafe() {
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')); } catch { return []; }
}

function restartPreview(appId) {
  const port = HARDCODED_PORTS[appId] || portForApp(appId);
  if (!port) return;
  // Kill tracked process if any
  if (previewProcs.has(appId)) {
    try { previewProcs.get(appId).kill('SIGTERM'); } catch {}
    previewProcs.delete(appId);
  }
  // Force-kill anything else holding the port (e.g. process started by pnpm dev)
  spawnSync('sh', ['-c', `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`], { stdio: 'ignore' });
  setTimeout(() => {
    const proc = spawn('pnpm', ['--filter', appId, 'preview'], { cwd: ROOT, shell: true, stdio: 'ignore' });
    previewProcs.set(appId, proc);
    proc.on('exit', () => previewProcs.delete(appId));
  }, 1200);
}

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────────────

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function readRegistry() {
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
}

function writeRegistry(data) {
  writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
}

function normalizeChunkName(filename) {
  // Vite hashes are exactly 8 chars of [A-Za-z0-9_-] (base64url, hyphens allowed)
  return filename.replace(/-[A-Za-z0-9_-]{8}\.(js|css)$/, '').replace(/\.(js|css)$/, '');
}

function labelChunk(filename, manifest = {}) {
  const manifestEntry = Object.values(manifest).find(e => {
    const f = e.file || '';
    return f === `assets/${filename}` || f.endsWith(`/${filename}`);
  });
  const src = manifestEntry?.src || '';
  const base = filename.replace(/-[A-Za-z0-9_-]{8}\.js$/, '').replace(/\.js$/, '');

  if (filename === 'remoteEntry.js')
    return { source: 'Module Federation', tag: 'MFE', description: 'Remote manifest — shell reads this to locate all chunks at runtime' };
  if (base.startsWith('__federation_expose_')) {
    const exposed = base.replace('__federation_expose_', '');
    return { source: 'Module Federation', tag: 'MFE', description: `Expose wrapper for ${exposed} — entry point the shell calls when loading this plugin` };
  }
  if (base === 'index' || (src && src.includes('main.tsx')))
    return { source: src || 'src/main.tsx', tag: 'Entry', description: 'App entry bundle — bootstraps the React app' };
  if (base === 'App' || (src && src.endsWith('App.tsx')))
    return { source: src || 'src/App.tsx', tag: 'Entry', description: 'Main app component — router + nav layout' };
  if (src && src.includes('routes/')) {
    const routeName = src.split('/').pop().replace(/\.(tsx|jsx|ts|js)$/, '');
    return { source: src, tag: 'Route', description: `Lazy route — only downloads when user first navigates to ${routeName}` };
  }
  if (/^[A-Z]/.test(base))
    return { source: `src/routes/${base}.tsx`, tag: 'Route', description: `Lazy route — only downloads when user first navigates to ${base}` };
  if (/react|vendor|lodash|emotion/i.test(base))
    return { source: 'node_modules', tag: 'Vendor', description: 'Third-party dependency bundle' };
  return { source: src || '', tag: '', description: '' };
}

function md5Dir(dir) {
  const result = {};
  if (!existsSync(dir)) return result;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.js') && !file.endsWith('.css')) continue;
    const raw = readFileSync(join(dir, file), 'utf8');
    // Strip hash suffixes from chunk URL references before hashing so that
    // import URL rotation (other chunks changing hash) doesn't count as a content change.
    // Vite hashes are exactly 8 chars of [A-Za-z0-9_-] (hyphens allowed in base64url).
    const normalized = raw.replace(/-[A-Za-z0-9_-]{8}\.(js|css)/g, '.$1');
    const size = statSync(join(dir, file)).size;
    result[file] = { hash: createHash('md5').update(normalized).digest('hex'), size };
  }
  return result;
}

function getPort(url) {
  try { return new URL(url).port; } catch { return '?'; }
}

function countRoutes(appId) {
  const routesDir = join(ROOT, 'apps', appId, 'src', 'routes');
  if (!existsSync(routesDir)) return 0;
  return readdirSync(routesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx')).length;
}

function isBuilt(appId) {
  return existsSync(join(ROOT, 'apps', appId, 'dist', 'assets', 'remoteEntry.js'));
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/revision', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ revision: buildRevision });
});

// ─── Registry ────────────────────────────────────────────────────────────────

app.get('/api/registry', (_req, res) => {
  res.json(readRegistry());
});

app.post('/api/registry', (req, res) => {
  const { id, label, url } = req.body;
  if (!id || !label || !url) return res.status(400).json({ error: 'id, label, url required' });
  const registry = readRegistry();
  if (registry.find(e => e.id === id)) return res.status(409).json({ error: `App "${id}" already registered` });
  registry.push({ id, label, url });
  writeRegistry(registry);
  res.json(registry);
});

app.patch('/api/registry/:id', (req, res) => {
  const registry = readRegistry();
  const idx = registry.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  registry[idx] = { ...registry[idx], ...req.body };
  writeRegistry(registry);
  res.json(registry[idx]);
});

app.delete('/api/registry/:id', (req, res) => {
  const { id } = req.params;
  const registry = readRegistry();
  const entry = registry.find(e => e.id === id);
  if (!entry) return res.status(404).json({ error: 'Not found' });

  // Kill tracked preview process
  if (previewProcs.has(id)) {
    try { previewProcs.get(id).kill('SIGTERM'); } catch {}
    previewProcs.delete(id);
  }
  // Force-kill anything holding the port
  const port = portForApp(id);
  if (port) {
    spawnSync('sh', ['-c', `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`], { stdio: 'ignore' });
  }

  // Delete app files from disk
  const appDir = join(ROOT, 'apps', id);
  if (existsSync(appDir)) {
    rmSync(appDir, { recursive: true, force: true });
  }

  const filtered = registry.filter(e => e.id !== id);
  writeRegistry(filtered);
  res.json(filtered);
});

// ─── Apps ────────────────────────────────────────────────────────────────────

app.get('/api/apps', (_req, res) => {
  const registry = readRegistry();
  const apps = registry.map(entry => ({
    ...entry,
    port: getPort(entry.url),
    built: isBuilt(entry.id),
    routeCount: countRoutes(entry.id),
  }));
  res.json(apps);
});

app.get('/api/apps/:id/routes', (req, res) => {
  const routesDir = join(ROOT, 'apps', req.params.id, 'src', 'routes');
  if (!existsSync(routesDir)) return res.json([]);
  const routes = readdirSync(routesDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'))
    .map(f => f.replace(/\.(tsx|jsx)$/, ''));
  res.json(routes);
});

// ─── Scaffold ────────────────────────────────────────────────────────────────

app.post('/api/scaffold', (req, res) => {
  const { id, label, port, color, routes } = req.body;
  if (!id || !label || !port) return res.status(400).json({ error: 'id, label, port required' });

  const appDir = join(ROOT, 'apps', id);
  if (existsSync(appDir)) return res.status(409).json({ error: `apps/${id} already exists` });

  const files = [];
  const COLOR = color || '#1428A0';
  const COLOR_DARK = COLOR + '99';
  const initialRoutes = routes && routes.length > 0 ? routes : [{ name: 'Home', path: '/' }];

  try {
    mkdirSync(join(appDir, 'src', 'routes'), { recursive: true });

    // package.json
    const pkg = {
      name: id, private: true, version: '0.0.0', type: 'module',
      scripts: { dev: `vite --port ${port}`, build: 'vite build', preview: `vite preview --port ${port}`, typecheck: 'tsc --noEmit' },
      dependencies: { '@repo/auth': 'workspace:*', '@repo/shared-ui': 'workspace:*', react: '^19.2.4', 'react-dom': '^19.2.4', 'react-router-dom': '^7.6.0', zod: '^3.23.8' },
      devDependencies: {
        '@originjs/vite-plugin-federation': '^1.4.1',
        '@tailwindcss/vite': '^4.1.5',
        '@types/react': '^19.1.0', '@types/react-dom': '^19.1.0',
        '@vitejs/plugin-react': '^6.0.1', tailwindcss: '^4.1.5', typescript: '^5.8.3', vite: '^8.0.0',
      },
    };
    writeFileSync(join(appDir, 'package.json'), JSON.stringify(pkg, null, 2));
    files.push(`apps/${id}/package.json`);

    // vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  base: 'http://localhost:${port}/',
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: '${id}',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/App.tsx' },
      shared: {
        react: { singleton: true, requiredVersion: false, eager: true },
        'react-dom': { singleton: true, requiredVersion: false, eager: true },
        'react/jsx-runtime': { singleton: true, requiredVersion: false, eager: true },
        'react-router-dom': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  server: { port: ${port}, cors: true },
  preview: { port: ${port}, cors: true },
  build: { target: 'esnext', minify: false, cssCodeSplit: false },
});
`;
    writeFileSync(join(appDir, 'vite.config.ts'), viteConfig);
    files.push(`apps/${id}/vite.config.ts`);

    // tsconfig.json
    writeFileSync(join(appDir, 'tsconfig.json'), JSON.stringify({ extends: '../../tsconfig.base.json', include: ['src'] }, null, 2));
    files.push(`apps/${id}/tsconfig.json`);

    // tsconfig.node.json
    const tscNode = { compilerOptions: { target: 'ES2022', lib: ['ES2023'], module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler', allowImportingTsExtensions: true, isolatedModules: true, moduleDetection: 'force', noEmit: true }, include: ['vite.config.ts'] };
    writeFileSync(join(appDir, 'tsconfig.node.json'), JSON.stringify(tscNode, null, 2));
    files.push(`apps/${id}/tsconfig.node.json`);

    // index.html
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${label}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    writeFileSync(join(appDir, 'index.html'), html);
    files.push(`apps/${id}/index.html`);

    // vite-env.d.ts
    writeFileSync(join(appDir, 'src', 'vite-env.d.ts'), '/// <reference types="vite/client" />\n');
    files.push(`apps/${id}/src/vite-env.d.ts`);

    // main.tsx
    const main = `import '@repo/shared-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
    writeFileSync(join(appDir, 'src', 'main.tsx'), main);
    files.push(`apps/${id}/src/main.tsx`);

    // App.tsx
    const lazys = initialRoutes.map(r => `const ${cap(r.name)} = lazy(() => import('./routes/${r.name}.tsx'));`).join('\n');
    const navItemsArr = initialRoutes.map((r, i) => `  { path: '${i === 0 ? '/' : r.path}', label: '${cap(r.name)}', icon: '📄', end: ${i === 0} },`).join('\n');
    const routeEls = initialRoutes.map((r, i) => `              <Route path="${i === 0 ? '/' : r.path}" element={<${cap(r.name)} />} />`).join('\n');

    const appTsx = `import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@repo/auth';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

const COLOR = '${COLOR}';
const COLOR_DARK = '${COLOR_DARK}';

${lazys}

const navItems = [
${navItemsArr}
];

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('${label} mounted');
    return () => console.log('${label} unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Sidebar */}
        <nav style={{ width: 220, background: COLOR_DARK, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 10, color: 'white', letterSpacing: '0.08em', flexShrink: 0 }}>
                ${id.toUpperCase().slice(0, 4)}
              </div>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>${label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>TVPlus Platform</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {navItems.map(item => (
              <NavLink key={item.path} to={item.path} end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', textDecoration: 'none',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                  borderLeft: isActive ? \`3px solid \${COLOR}\` : '3px solid transparent',
                  fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.12s',
                })}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: (roleColors[user.role] ?? '#4A5170') + '28', border: \`1px solid \${roleColors[user.role] ?? '#4A5170'}50\`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                  {user.role === 'admin' ? '👑' : user.role === 'ops' ? '⚙️' : user.role === 'editor' ? '✏️' : '👁️'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: roleColors[user.role] ?? '#4A5170', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{user.role}</div>
                </div>
              </div>
            )}
            <button
              onClick={() => (globalThis as any).__tvplus_goHome?.()}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >← Portal</button>
          </div>
        </nav>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>${label}</span>
            <div style={{ marginLeft: 'auto' }}>
              {user && <span style={{ fontSize: 12, color: '#475569', background: '#F1F5F9', padding: '3px 10px', borderRadius: 12 }}>👤 {user.name}</span>}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: '#F7F8FC', padding: 28 }}>
            <Suspense fallback={<div style={{ color: '#8C94B0', fontSize: 14, padding: 20 }}>Loading...</div>}>
              <Routes>
${routeEls}
              </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
`;
    writeFileSync(join(appDir, 'src', 'App.tsx'), appTsx);
    files.push(`apps/${id}/src/App.tsx`);

    // Route files
    for (const route of initialRoutes) {
      const routeTsx = `export default function ${cap(route.name)}() {
  return (
    <div>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: '0 0 16px' }}>${cap(route.name)}</h2>
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #ECEEF5', color: '#636B8A', fontSize: 14 }}>
        Welcome to the ${cap(route.name)} page of ${label}.
      </div>
    </div>
  );
}
`;
      writeFileSync(join(appDir, 'src', 'routes', `${route.name}.tsx`), routeTsx);
      files.push(`apps/${id}/src/routes/${route.name}.tsx`);
    }

    // Register in registry
    const registry = readRegistry();
    if (!registry.find(e => e.id === id)) {
      registry.push({ id, label, url: `http://localhost:${port}/assets/remoteEntry.js`, requiredRoles: ['admin', 'ops', 'editor', 'viewer'] });
      writeRegistry(registry);
    }

    // Link workspace dependencies
    spawnSync('pnpm', ['install', '--frozen-lockfile=false'], { cwd: ROOT, shell: true, stdio: 'ignore' });

    // Build the new plugin so it's immediately ready for preview and compare
    spawnSync('pnpm', ['--filter', id, 'build'], { cwd: ROOT, shell: true, stdio: 'ignore' });

    // Start vite preview for the new plugin so the shell can load it immediately
    restartPreview(id);

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Route Add ───────────────────────────────────────────────────────────────

function generateTableRoute(name, endpoint, columns, description) {
  const compName = cap(name);
  const badgeCols = columns.filter(c => c.type === 'badge');
  const filterKey = badgeCols[0]?.key || null;

  const colsDef = columns.map(c => {
    const parts = [`key: '${c.key}'`, `label: '${c.label}'`, `type: '${c.type || 'text'}'`];
    if (c.bold) parts.push('bold: true');
    return `  { ${parts.join(', ')} }`;
  }).join(',\n');

  const filterState = filterKey ? `\n  const [filter, setFilter] = useState('');` : '';
  const statusCompute = filterKey
    ? `\n  const allStatuses = [...new Set(allData.map((r) => r['${filterKey}']).filter(Boolean))];\n  const data = filter ? allData.filter(r => r['${filterKey}'] === filter) : allData;`
    : '\n  const data = allData;';

  const filterUI = filterKey ? `\n        {allStatuses.length > 0 && (\n          <select value={filter} onChange={e => setFilter(e.target.value)} style={{\n            padding: '7px 12px', borderRadius: 7, border: '1.5px solid #E2E8F0',\n            background: 'white', fontSize: 12, color: '#475569', cursor: 'pointer', outline: 'none',\n          }}>\n            <option value=''>All</option>\n            {allStatuses.map(s => <option key={s} value={String(s)}>{String(s)}</option>)}\n          </select>\n        )}` : '';

  return `import { useState, useEffect } from 'react';

const BASE_URL = '${endpoint}';

const COLS = [
${colsDef},
];

const STATUS_COLORS: Record<string, [string, string]> = {
  draft:        ['#FFF7ED', '#C2410C'],
  published:    ['#F0FDF4', '#15803D'],
  archived:     ['#F1F5F9', '#64748B'],
  ready:        ['#F0FDF4', '#15803D'],
  processing:   ['#EFF6FF', '#1D4ED8'],
  error:        ['#FEF2F2', '#DC2626'],
  open:         ['#FEF2F2', '#DC2626'],
  investigating:['#FFF7ED', '#C2410C'],
  resolved:     ['#F0FDF4', '#15803D'],
  low:          ['#F0FDF4', '#15803D'],
  medium:       ['#FFFBEB', '#D97706'],
  high:         ['#FFF0F0', '#DC2626'],
  critical:     ['#FDF4FF', '#9333EA'],
};

type Row = Record<string, any>;
type Col = { key: string; label: string; type?: string; bold?: boolean };

function Cell({ col, row }: { col: Col; row: Row }) {
  const v = row[col.key];
  if (col.type === 'badge') {
    const [bg, color] = STATUS_COLORS[String(v)] ?? ['#F1F5F9', '#64748B'];
    return (
      <td style={{ padding: '13px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color, textTransform: 'capitalize', letterSpacing: '0.04em' }}>{String(v)}</span>
      </td>
    );
  }
  if (col.type === 'date') {
    return <td style={{ padding: '13px 16px', color: '#8C94B0', fontSize: 12 }}>{v ? new Date(v).toLocaleDateString() : '—'}</td>;
  }
  if (col.type === 'tags') {
    return (
      <td style={{ padding: '13px 16px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(Array.isArray(v) ? v : []).map((t: string) => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EEF2FF', color: '#4F46E5' }}>{t}</span>
          ))}
        </div>
      </td>
    );
  }
  return <td style={{ padding: '13px 16px', fontWeight: col.bold ? 600 : 400, color: col.bold ? '#1E2235' : '#636B8A' }}>{String(v ?? '—')}</td>;
}

export default function ${compName}() {
  const [allData, setAllData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);${filterState}

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(BASE_URL)
      .then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
      .then(d => { setAllData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);
${statusCompute}

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>${compName}</h2>
          <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>${description || compName + ' data from API'}</p>
        </div>${filterUI}
      </div>

      {loading && (
        <div style={{ color: '#8C94B0', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>Loading\u2026</div>
      )}
      {error && (
        <div style={{ color: '#DC2626', background: '#FEF2F2', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
          Failed to load: {error}
        </div>
      )}
      {!loading && !error && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ECEEF5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #ECEEF5' }}>
                {COLS.map(c => (
                  <th key={c.key} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#8C94B0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: Row, i: number) => (
                <tr key={row.id ?? i} style={{ borderBottom: i < data.length - 1 ? '1px solid #F7F8FC' : 'none' }}>
                  {COLS.map(col => <Cell key={col.key} col={col} row={row} />)}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} style={{ padding: '32px 16px', textAlign: 'center', color: '#8C94B0', fontSize: 13 }}>
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
`;
}

app.post('/api/route/add', (req, res) => {
  const { appId, name, path: routePath, endpoint, columns, description } = req.body;
  if (!appId || !name) return res.status(400).json({ error: 'appId, name required' });

  const appDir = join(ROOT, 'apps', appId);
  if (!existsSync(appDir)) return res.status(404).json({ error: `apps/${appId} not found` });

  const routeFile = join(appDir, 'src', 'routes', `${name}.tsx`);
  if (existsSync(routeFile)) return res.status(409).json({ error: `Route ${name} already exists` });

  try {
    // Write route file — table template when endpoint+columns provided, else placeholder
    const useTable = endpoint && Array.isArray(columns) && columns.length > 0;
    const routeTsx = useTable
      ? generateTableRoute(name, endpoint, columns, description)
      : `export default function ${cap(name)}() {
  return (
    <div>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: '0 0 16px' }}>${cap(name)}</h2>
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #ECEEF5', color: '#636B8A', fontSize: 14 }}>
        ${cap(name)} route content goes here.
      </div>
    </div>
  );
}
`;
    writeFileSync(routeFile, routeTsx);

    // Patch App.tsx
    const appTsxPath = join(appDir, 'src', 'App.tsx');
    let src = readFileSync(appTsxPath, 'utf8');
    const rPath = routePath || `/${name.toLowerCase()}`;

    // Insert lazy import after last lazy line
    src = src.replace(
      /(const \w+ = lazy\([^;]+\);)(?![\s\S]*const \w+ = lazy)/,
      `$1\nconst ${cap(name)} = lazy(() => import('./routes/${name}.tsx'));`
    );
    // Insert into navItems array (sidebar pattern) — append before closing ];
    src = src.replace(
      /(const navItems = \[[\s\S]*?)\];/,
      `$1  { path: '${rPath}', label: '${cap(name)}', icon: '📄', end: false },\n];`
    );
    // Insert Route before </Routes>
    src = src.replace(
      /(<\/Routes>)/,
      `              <Route path="${rPath}" element={<${cap(name)} />} />\n            $1`
    );

    writeFileSync(appTsxPath, src);

    res.json({
      success: true,
      routeFile: `apps/${appId}/src/routes/${name}.tsx`,
      path: rPath,
      generatedCode: routeTsx,
      tableMode: useTable,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Delete Route ────────────────────────────────────────────────────────────

app.delete('/api/route', (req, res) => {
  const { appId, routeName } = req.body;
  if (!appId || !routeName) return res.status(400).json({ error: 'appId, routeName required' });

  const appDir = join(ROOT, 'apps', appId);
  const routeFile = join(appDir, 'src', 'routes', `${routeName}.tsx`);
  if (!existsSync(routeFile)) return res.status(404).json({ error: `Route ${routeName} not found` });

  try {
    const appTsxPath = join(appDir, 'src', 'App.tsx');
    let src = readFileSync(appTsxPath, 'utf8');
    const Name = cap(routeName);
    const rPath = `/${routeName.toLowerCase()}`;

    // Remove lazy import line
    src = src.replace(new RegExp(`\\nconst ${Name}\\s*=\\s*lazy\\(\\(\\)\\s*=>\\s*import\\(['"]\\./routes/${routeName}\\.tsx['"]\\)\\);`), '');
    // Remove navItem entry (handles trailing comma)
    src = src.replace(new RegExp(`\\n?\\s*\\{[^}]*path:\\s*['"]${rPath}['"][^}]*\\},?`), '');
    // Remove Route JSX element
    src = src.replace(new RegExp(`\\n?\\s*<Route\\s+path=['"]${rPath}['"]\\s+element=\\{<${Name}\\s*\\/>\\}\\s*\\/>`) , '');

    writeFileSync(appTsxPath, src);
    unlinkSync(routeFile);

    res.json({ success: true, removed: routeName });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Build (SSE) ─────────────────────────────────────────────────────────────

app.post('/api/build', (req, res) => {
  const { appId } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const args = appId === 'all'
    ? ['build', '--filter=sms', '--filter=qca', '--filter=cms', '--filter=mam']
    : ['build', `--filter=${appId}`];

  const send = (type, line) => res.write(`data: ${JSON.stringify({ type, line })}\n\n`);

  // Snapshot current dist BEFORE building so compare shows what this build changed
  const targets = appId === 'all' ? ['sms', 'qca', 'cms', 'mam'] : [appId];
  targets.forEach(id => autoSnapshot(id));

  send('stdout', `Building ${appId === 'all' ? 'all remotes' : appId}...\n`);

  const proc = spawn('turbo', args, { cwd: ROOT, shell: true });
  proc.stdout.on('data', d => send('stdout', d.toString()));
  proc.stderr.on('data', d => send('stderr', d.toString()));
  proc.on('close', code => {
    send('done', `\nProcess exited with code ${code}`);
    if (code === 0) {
      buildRevision++;
      send('stdout', '\n✓ Build complete — restarting preview server(s)...\n');
      targets.forEach(id => restartPreview(id));
      setTimeout(() => {
        send('stdout', '✓ Preview server(s) restarted on correct ports.\n');
        res.write(`data: ${JSON.stringify({ type: 'exit', code })}\n\n`);
        res.end();
      }, 1600);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'exit', code })}\n\n`);
      res.end();
    }
  });
});

// ─── Users (mock SSO) ────────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
  res.json([
    { id: '1', name: 'Alice Admin',  email: 'alice@tvplus.com', role: 'admin'  },
    { id: '2', name: 'Bob Ops',      email: 'bob@tvplus.com',   role: 'ops'    },
    { id: '3', name: 'Carol Editor', email: 'carol@tvplus.com', role: 'editor' },
    { id: '4', name: 'Dave Viewer',  email: 'dave@tvplus.com',  role: 'viewer' },
  ]);
});

// ─── Mock API ────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: '1', name: 'Nishant',       email: 'alice@tvplus.com',  role: 'admin'  },
  { id: '2', name: 'Bob Ops',      email: 'bob@tvplus.com',    role: 'ops'    },
  { id: '3', name: 'Carol Editor', email: 'carol@tvplus.com',  role: 'editor' },
  { id: '4', name: 'Dave Viewer',  email: 'dave@tvplus.com',   role: 'viewer' },
];

function seedMockData() {
  return {
    articles: [
      { id: 'a1', title: 'Launch Day Recap',          status: 'published', author: 'alice@tvplus.com', createdAt: '2026-01-10T09:00:00Z', tags: ['news', 'launch']      },
      { id: 'a2', title: 'Channel Guide Q1',           status: 'published', author: 'carol@tvplus.com', createdAt: '2026-01-15T10:30:00Z', tags: ['guide']               },
      { id: 'a3', title: 'Upcoming Sports Events',     status: 'draft',     author: 'carol@tvplus.com', createdAt: '2026-02-01T08:00:00Z', tags: ['sports', 'draft']     },
      { id: 'a4', title: 'HD Upgrade Announcement',    status: 'published', author: 'alice@tvplus.com', createdAt: '2026-02-14T12:00:00Z', tags: ['tech']                },
      { id: 'a5', title: 'March Movie Highlights',     status: 'draft',     author: 'carol@tvplus.com', createdAt: '2026-03-01T07:45:00Z', tags: ['movies']              },
      { id: 'a6', title: 'Parental Controls Guide',    status: 'published', author: 'bob@tvplus.com',   createdAt: '2026-03-10T11:00:00Z', tags: ['guide', 'family']     },
      { id: 'a7', title: 'App Update Notes v2.4',      status: 'archived',  author: 'alice@tvplus.com', createdAt: '2026-03-20T14:00:00Z', tags: ['tech', 'release']     },
      { id: 'a8', title: 'Easter Weekend Schedule',    status: 'published', author: 'carol@tvplus.com', createdAt: '2026-04-01T09:00:00Z', tags: ['schedule']            },
      { id: 'a9', title: 'Streaming Quality Tips',     status: 'draft',     author: 'bob@tvplus.com',   createdAt: '2026-04-10T10:00:00Z', tags: ['tech', 'tips']        },
      { id: 'a10', title: 'Annual Report 2025',        status: 'archived',  author: 'alice@tvplus.com', createdAt: '2026-04-15T16:00:00Z', tags: ['corporate']           },
    ],
    assets: [
      { id: 'as1', name: 'hero-banner.jpg',      type: 'image', size: 204800,  uploadedBy: 'alice@tvplus.com', url: '/mock/assets/hero-banner.jpg',      status: 'ready'      },
      { id: 'as2', name: 'promo-video.mp4',      type: 'video', size: 52428800, uploadedBy: 'bob@tvplus.com',  url: '/mock/assets/promo-video.mp4',      status: 'ready'      },
      { id: 'as3', name: 'logo-dark.svg',        type: 'image', size: 8192,    uploadedBy: 'alice@tvplus.com', url: '/mock/assets/logo-dark.svg',        status: 'ready'      },
      { id: 'as4', name: 'channel-guide.pdf',    type: 'pdf',   size: 1048576, uploadedBy: 'carol@tvplus.com', url: '/mock/assets/channel-guide.pdf',    status: 'ready'      },
      { id: 'as5', name: 'thumbnail-sports.jpg', type: 'image', size: 102400,  uploadedBy: 'carol@tvplus.com', url: '/mock/assets/thumbnail-sports.jpg', status: 'ready'      },
      { id: 'as6', name: 'intro-jingle.mp3',     type: 'audio', size: 3145728, uploadedBy: 'bob@tvplus.com',  url: '/mock/assets/intro-jingle.mp3',     status: 'processing' },
      { id: 'as7', name: 'broken-upload.jpg',    type: 'image', size: 0,       uploadedBy: 'dave@tvplus.com', url: '/mock/assets/broken-upload.jpg',    status: 'error'      },
      { id: 'as8', name: 'q2-report.xlsx',       type: 'doc',   size: 512000,  uploadedBy: 'alice@tvplus.com', url: '/mock/assets/q2-report.xlsx',       status: 'ready'      },
    ],
    incidents: [
      { id: 'i1', title: 'Stream dropout on HD channels',   severity: 'high',     status: 'investigating', assignedTo: 'bob@tvplus.com',  createdAt: '2026-04-10T02:15:00Z' },
      { id: 'i2', title: 'Login failures for iOS app',      severity: 'critical', status: 'open',          assignedTo: 'alice@tvplus.com', createdAt: '2026-04-12T08:30:00Z' },
      { id: 'i3', title: 'EPG data missing for Channel 7',  severity: 'medium',   status: 'investigating', assignedTo: 'carol@tvplus.com', createdAt: '2026-04-13T11:00:00Z' },
      { id: 'i4', title: 'Slow VOD load times',             severity: 'low',      status: 'resolved',      assignedTo: 'bob@tvplus.com',  createdAt: '2026-04-14T09:00:00Z' },
      { id: 'i5', title: 'Push notification delays',        severity: 'medium',   status: 'resolved',      assignedTo: 'dave@tvplus.com', createdAt: '2026-04-15T14:00:00Z' },
      { id: 'i6', title: 'Ad insertion failure prime time', severity: 'high',     status: 'open',          assignedTo: 'alice@tvplus.com', createdAt: '2026-04-17T20:00:00Z' },
    ],
    tokens: {},
  };
}

let mockDb = seedMockData();

// Auth
app.post('/api/mock/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (password !== 'password123') return res.status(401).json({ error: 'Invalid credentials' });
  const user = MOCK_USERS.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = `mock-token-${user.id}-${Date.now()}`;
  mockDb.tokens[token] = user;
  res.json({ token, user });
});

app.get('/api/mock/auth/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = token ? mockDb.tokens[token] : null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user });
});

// Reset
app.post('/api/mock/reset', (_req, res) => {
  mockDb = seedMockData();
  res.json({ ok: true, message: 'Mock data re-seeded' });
});

function mockCrud(app, path, getCollection) {
  const idField = 'id';

  app.get(path, (req, res) => {
    let items = getCollection();
    const filters = { ...req.query };
    for (const [k, v] of Object.entries(filters)) {
      items = items.filter(item => String(item[k]) === String(v));
    }
    res.json(items);
  });

  app.get(`${path}/:id`, (req, res) => {
    const item = getCollection().find(i => i[idField] === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.post(path, (req, res) => {
    const col = getCollection();
    const newItem = { id: `${path.split('/').pop()}-${Date.now()}`, ...req.body };
    col.push(newItem);
    res.status(201).json(newItem);
  });

  app.put(`${path}/:id`, (req, res) => {
    const col = getCollection();
    const idx = col.findIndex(i => i[idField] === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    col[idx] = { ...col[idx], ...req.body, id: req.params.id };
    res.json(col[idx]);
  });

  app.delete(`${path}/:id`, (req, res) => {
    const col = getCollection();
    const idx = col.findIndex(i => i[idField] === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    col.splice(idx, 1);
    res.status(204).end();
  });
}

mockCrud(app, '/api/mock/articles', () => mockDb.articles);
mockCrud(app, '/api/mock/assets',   () => mockDb.assets);
mockCrud(app, '/api/mock/incidents', () => mockDb.incidents);

// ─── Dev Session (persisted in JSON) ─────────────────────────────────────────

const SESSION_PATH = join(__dirname, 'data', 'dev-session.json');

function readDevSession() {
  try { return JSON.parse(readFileSync(SESSION_PATH, 'utf8')); }
  catch { return { user: null }; }
}

app.get('/api/dev-session', (req, res) => {
  res.json(readDevSession());
});

app.post('/api/dev-session', (req, res) => {
  const { user } = req.body;
  writeFileSync(SESSION_PATH, JSON.stringify({ user: user ?? null }, null, 2));
  res.json({ user: user ?? null });
});

app.delete('/api/dev-session', (req, res) => {
  writeFileSync(SESSION_PATH, JSON.stringify({ user: null }, null, 2));
  res.json({ user: null });
});

// ─── Restart Previews ────────────────────────────────────────────────────────

app.post('/api/restart-previews', (req, res) => {
  const ids = req.body.ids || ['sms', 'qca', 'cms', 'mam'];
  ids.forEach(id => restartPreview(id));
  res.json({ ok: true, restarting: ids });
});

// ─── Snapshot ────────────────────────────────────────────────────────────────

function autoSnapshot(appId) {
  const assetsDir = join(ROOT, 'apps', appId, 'dist', 'assets');
  const manifestPath = join(ROOT, 'apps', appId, 'dist', '.vite', 'manifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const raw = md5Dir(assetsDir);
  const chunks = {};
  for (const [f, info] of Object.entries(raw)) {
    chunks[f] = { ...info, ...labelChunk(f, manifest) };
  }
  const snapshotPath = join(ROOT, 'scripts', `snapshot-${appId}.json`);
  writeFileSync(snapshotPath, JSON.stringify({ appId, timestamp: new Date().toISOString(), chunks }, null, 2));
  return Object.keys(chunks).length;
}

app.post('/api/snapshot', (req, res) => {
  const { appId } = req.body;
  if (!appId) return res.status(400).json({ error: 'appId required' });
  const count = autoSnapshot(appId);
  res.json({ success: true, chunks: count, path: `scripts/snapshot-${appId}.json` });
});

// ─── Compare ─────────────────────────────────────────────────────────────────

app.get('/api/compare', (req, res) => {
  const { appId } = req.query;
  if (!appId) return res.status(400).json({ error: 'appId required' });
  const snapshotPath = join(ROOT, 'scripts', `snapshot-${appId}.json`);
  const snap = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, 'utf8')).chunks : {};
  const manifestPath = join(ROOT, 'apps', appId, 'dist', '.vite', 'manifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const rawCurrent = md5Dir(join(ROOT, 'apps', appId, 'dist', 'assets'));
  const current = {};
  for (const [f, info] of Object.entries(rawCurrent)) {
    current[f] = { ...info, ...labelChunk(f, manifest) };
  }

  // Normalize by stripping hash suffix so "App-OLD.js" and "App-NEW.js" compare as the same logical chunk
  const snapByBase = {};
  for (const [f, info] of Object.entries(snap)) {
    snapByBase[normalizeChunkName(f)] = { ...info, filename: f };
  }
  const currentByBase = {};
  for (const [f, info] of Object.entries(current)) {
    currentByBase[normalizeChunkName(f)] = { ...info, filename: f };
  }

  const unchanged = [], modified = [], added = [], deleted = [];
  for (const [base, info] of Object.entries(currentByBase)) {
    const entry = { name: info.filename, baseName: base, size: info.size, source: info.source, tag: info.tag, description: info.description };
    if (!snapByBase[base]) {
      added.push(entry);
    } else if (snapByBase[base].hash !== info.hash) {
      modified.push({ ...entry, oldSize: snapByBase[base].size, oldName: snapByBase[base].filename });
    } else {
      unchanged.push(entry);
    }
  }
  for (const [base, info] of Object.entries(snapByBase)) {
    if (!currentByBase[base]) deleted.push({ name: info.filename, baseName: base, source: info.source, tag: info.tag, description: info.description });
  }
  res.json({ unchanged, modified, added, deleted });
});

// ─── Deploy ──────────────────────────────────────────────────────────────────

app.post('/api/deploy', (req, res) => {
  const { appId, version } = req.body;
  if (!appId || !version) return res.status(400).json({ error: 'appId, version required' });
  const src = join(ROOT, 'apps', appId, 'dist');
  const dest = join(ROOT, 'deploys', appId, version);
  if (!existsSync(src)) return res.status(400).json({ error: `No dist for ${appId}. Build first.` });

  function copyDir(s, d) {
    mkdirSync(d, { recursive: true });
    for (const f of readdirSync(s)) {
      const sf = join(s, f), df = join(d, f);
      if (statSync(sf).isDirectory()) copyDir(sf, df);
      else copyFileSync(sf, df);
    }
  }
  copyDir(src, dest);
  writeFileSync(join(dest, 'deploy-meta.json'), JSON.stringify({ appId, version, deployedAt: new Date().toISOString() }, null, 2));
  res.json({ success: true, path: `deploys/${appId}/${version}` });
});

// ─── Code Generation ─────────────────────────────────────────────────────────

app.post('/api/generate/login', (req, res) => {
  try {
    const { appId, endpoint, addRoute = false } = req.body;
    if (!appId || !endpoint) return res.status(400).json({ error: 'appId and endpoint required' });
    const { label, color } = appMeta(appId);
    const code = genLoginPage({ endpoint, label, color });
    if (addRoute) {
      const appDir = join(ROOT, 'apps', appId);
      writeRouteFile(appDir, 'Login.tsx', code);
      patchAppTsx(appDir, 'Login', '/login');
    }
    res.json({ code, filename: 'Login.tsx', route: '/login' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/generate/form', (req, res) => {
  try {
    const { appId, pageName, endpoint, method = 'POST', fields = [], addRoute = false } = req.body;
    if (!appId || !pageName || !endpoint) return res.status(400).json({ error: 'appId, pageName and endpoint required' });
    const { color } = appMeta(appId);
    const code = genFormPage({ pageName, endpoint, method, fields, color });
    const filename = `${cap(pageName)}Page.tsx`;
    const route = `/${pageName.toLowerCase()}`;
    if (addRoute) {
      const appDir = join(ROOT, 'apps', appId);
      writeRouteFile(appDir, filename, code);
      patchAppTsx(appDir, cap(pageName) + 'Page', route);
    }
    res.json({ code, filename, route });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/generate/detail', (req, res) => {
  try {
    const { appId, pageName, endpoint, fields = [], addRoute = false } = req.body;
    if (!appId || !pageName || !endpoint) return res.status(400).json({ error: 'appId, pageName and endpoint required' });
    const code = genDetailPage({ pageName, endpoint, fields });
    const filename = `${cap(pageName)}DetailPage.tsx`;
    const route = `/${pageName.toLowerCase()}/:id`;
    if (addRoute) {
      const appDir = join(ROOT, 'apps', appId);
      writeRouteFile(appDir, filename, code);
      patchAppTsx(appDir, cap(pageName) + 'DetailPage', route);
    }
    res.json({ code, filename, route });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/generate/crud', (req, res) => {
  try {
    const { appId, resource, baseEndpoint, fields = [], addRoute = false } = req.body;
    if (!appId || !resource || !baseEndpoint) return res.status(400).json({ error: 'appId, resource and baseEndpoint required' });
    const { color } = appMeta(appId);
    const pages = genCrud({ resource, baseEndpoint, fields, color });
    if (addRoute) {
      const appDir = join(ROOT, 'apps', appId);
      for (const page of Object.values(pages)) {
        writeRouteFile(appDir, page.filename, page.code);
        patchAppTsx(appDir, page.routeName, page.route);
      }
    }
    res.json({ pages, resource });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/infer-fields', (req, res) => {
  try {
    const { apiDoc } = req.body;
    if (!apiDoc) return res.status(400).json({ error: 'apiDoc required' });
    const result = inferFields(apiDoc);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// One-shot: infer fields from apiDoc then generate + optionally write
app.post('/api/generate/smart', (req, res) => {
  try {
    const { appId, pageType, endpoint, apiDoc, pageName, method = 'POST', resource, addRoute = false } = req.body;
    if (!appId || !pageType || !endpoint) return res.status(400).json({ error: 'appId, pageType and endpoint required' });

    const inferred = apiDoc ? inferFields(apiDoc) : { fields: [] };
    if (inferred.error && apiDoc) return res.status(400).json({ error: inferred.error });
    const fields = inferred.fields;

    const { label, color } = appMeta(appId);
    const appDir = join(ROOT, 'apps', appId);
    let result;

    if (pageType === 'login') {
      const code = genLoginPage({ endpoint, label, color });
      if (addRoute) { writeRouteFile(appDir, 'Login.tsx', code); patchAppTsx(appDir, 'Login', '/login'); }
      result = { pages: { login: { code, filename: 'Login.tsx', route: '/login' } }, fields };

    } else if (pageType === 'form') {
      const name = pageName || 'Form';
      const code = genFormPage({ pageName: name, endpoint, method, fields, color });
      const filename = `${cap(name)}Page.tsx`;
      const route = `/${name.toLowerCase()}`;
      if (addRoute) { writeRouteFile(appDir, filename, code); patchAppTsx(appDir, cap(name) + 'Page', route); }
      result = { pages: { form: { code, filename, route } }, fields };

    } else if (pageType === 'detail') {
      const name = pageName || 'Detail';
      const code = genDetailPage({ pageName: name, endpoint, fields });
      const filename = `${cap(name)}DetailPage.tsx`;
      const route = `/${name.toLowerCase()}/:id`;
      if (addRoute) { writeRouteFile(appDir, filename, code); patchAppTsx(appDir, cap(name) + 'DetailPage', route); }
      result = { pages: { detail: { code, filename, route } }, fields };

    } else if (pageType === 'crud') {
      const res_name = resource || pageName || 'Resource';
      const pages = genCrud({ resource: res_name, baseEndpoint: endpoint, fields, color });
      if (addRoute) {
        for (const page of Object.values(pages)) {
          writeRouteFile(appDir, page.filename, page.code);
          patchAppTsx(appDir, page.routeName, page.route);
        }
      }
      result = { pages, fields };

    } else {
      return res.status(400).json({ error: `Unknown pageType "${pageType}". Use: login, form, detail, crud` });
    }

    res.json({ ...result, inferredFrom: inferred.source || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/generate/tests', (req, res) => {
  try {
    const { sourceCode, componentName } = req.body;
    if (!sourceCode || !componentName) return res.status(400).json({ error: 'sourceCode and componentName required' });
    const code = genTests({ sourceCode, componentName });
    res.json({ code, filename: `${componentName}.test.tsx` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/review', (req, res) => {
  try {
    const { appId } = req.body;
    if (!appId) return res.status(400).json({ error: 'appId required' });
    const result = runReview({ appId });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/deploy/:appId/history', (req, res) => {
  try {
    const { appId } = req.params;
    const deploysDir = join(ROOT, 'deploys', appId);
    if (!existsSync(deploysDir)) return res.json([]);
    const versions = readdirSync(deploysDir)
      .filter(f => statSync(join(deploysDir, f)).isDirectory())
      .map(v => {
        try {
          const meta = JSON.parse(readFileSync(join(deploysDir, v, 'deploy-meta.json'), 'utf8'));
          return meta;
        } catch { return { appId, version: v }; }
      })
      .sort((a, b) => (b.deployedAt || '').localeCompare(a.deployedAt || ''));
    res.json(versions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── IXD Generator ──────────────────────────────────────────────────────────

const IXD_TOOL_PATH = '/Users/nishantchaudhary/Desktop/my-turborepo/tools/ixd-generator/build/ixd-generator/src/index.js';

function callMcpTool(serverPath, toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '';
    let reqId = 2;
    let initialized = false;
    const timeout = setTimeout(() => { child.kill(); reject(new Error('MCP tool timeout after 30s')); }, 30000);

    child.stdout.on('data', chunk => {
      buf += chunk.toString();
      for (const line of buf.split('\n')) {
        if (!line.trim() || !line.includes('"jsonrpc"')) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 1 && msg.result && !initialized) {
            initialized = true;
            child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'initialized', params: {} }) + '\n');
            setTimeout(() => {
              child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: reqId, method: 'tools/call', params: { name: toolName, arguments: args } }) + '\n');
            }, 50);
          } else if (msg.id === reqId && msg.result) {
            clearTimeout(timeout);
            // Return full content array (text + image blocks)
            const content = msg.result.content || [];
            const textBlock = content.find(c => c.type === 'text');
            const imageBlock = content.find(c => c.type === 'image');
            let parsed = null;
            try { parsed = textBlock ? JSON.parse(textBlock.text) : null; } catch { parsed = { raw: textBlock?.text }; }
            child.kill();
            resolve({ data: parsed, image: imageBlock || null });
          } else if (msg.error) {
            clearTimeout(timeout);
            child.kill();
            reject(new Error(msg.error.message || 'MCP error'));
          }
        } catch {}
      }
      buf = buf.split('\n').slice(-1).join('');
    });

    child.on('error', err => { clearTimeout(timeout); reject(err); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'devtools', version: '1.0' } } }) + '\n');
  });
}

// POST /api/ixd/read-file — read a PDF page or image, return metadata + base64 image
app.post('/api/ixd/read-file', async (req, res) => {
  try {
    const { filePath, page = 1 } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath required' });
    if (!existsSync(filePath)) return res.status(400).json({ error: `File not found: ${filePath}` });
    const result = await callMcpTool(IXD_TOOL_PATH, 'read_design_file', { file_path: filePath, page });
    res.json({ success: true, meta: result.data, image: result.image });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/ixd/list-pages — get PDF page count
app.post('/api/ixd/list-pages', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath required' });
    const result = await callMcpTool(IXD_TOOL_PATH, 'list_pdf_pages', { file_path: filePath });
    res.json({ success: true, ...result.data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/ixd/catalog — get @repo/ui component catalog
app.post('/api/ixd/catalog', async (req, res) => {
  try {
    const { componentsDir, packageName = '@repo/ui' } = req.body;
    if (!componentsDir) return res.status(400).json({ error: 'componentsDir required' });
    const result = await callMcpTool(IXD_TOOL_PATH, 'get_ui_catalog', { components_dir: componentsDir, package_name: packageName });
    res.json({ success: true, ...result.data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Lighthouse ──────────────────────────────────────────────────────────────

const LH_DATA_DIR = join(__dirname, 'data');

function analyzeHtmlFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const issues = [];
  let score = 100;

  if (!content.includes('<title>') || content.includes('<title></title>')) {
    issues.push('Missing or empty <title> tag'); score -= 10;
  }
  if (!content.includes('name="description"')) {
    issues.push('Missing meta description'); score -= 5;
  }
  if (!content.includes('name="viewport"')) {
    issues.push('Missing viewport meta tag'); score -= 10;
  }
  if (!content.includes('lang=')) {
    issues.push('Missing lang attribute on <html>'); score -= 5;
  }
  const imgNoAlt = content.match(/<img(?![^>]*alt=)[^>]*>/g);
  if (imgNoAlt) {
    issues.push(`${imgNoAlt.length} image(s) missing alt attribute`); score -= imgNoAlt.length * 5;
  }
  const scriptBlocks = content.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
  for (const s of scriptBlocks) {
    if (s.length > 10000) { issues.push('Large inline script (>10 KB) — consider an external file'); score -= 10; break; }
  }
  if (content.match(/<script(?![^>]*defer)(?![^>]*async)(?![^>]*type=["']module["'])[^>]*src=/)) {
    issues.push('Render-blocking <script> without defer/async'); score -= 10;
  }
  if (!content.includes('rel="icon"') && !content.includes("rel='icon'")) {
    issues.push('Missing favicon link'); score -= 3;
  }
  return { score: Math.max(0, score), issues };
}

function parseLighthouseReport(outputPath, url) {
  if (!existsSync(outputPath)) throw new Error(`Lighthouse did not produce output at ${outputPath}`);
  const report = JSON.parse(readFileSync(outputPath, 'utf-8'));
  const cats = report.categories || {};
  const audits = report.audits || {};
  const sc = (v) => v == null ? null : Math.round(v * 100);
  const metrics = {
    performance:   sc(cats.performance?.score),
    accessibility: sc(cats.accessibility?.score),
    bestPractices: sc(cats['best-practices']?.score),
    seo:           sc(cats.seo?.score),
    fcp:  audits['first-contentful-paint']?.numericValue  ?? null,
    lcp:  audits['largest-contentful-paint']?.numericValue ?? null,
    tbt:  audits['total-blocking-time']?.numericValue     ?? null,
    cls:  audits['cumulative-layout-shift']?.numericValue ?? null,
    si:   audits['speed-index']?.numericValue             ?? null,
  };
  const failedAudits = Object.entries(audits)
    .filter(([, a]) => a.score !== null && a.score < 1)
    .map(([key, a]) => ({ name: key, score: Math.round((a.score || 0) * 100), title: a.title, description: (a.description || '').slice(0, 200) }))
    .sort((a, b) => a.score - b.score);
  return { url, metrics, audits: failedAudits, timestamp: new Date().toISOString() };
}

function runLighthouseAsync(url, outputPath, categories = ['performance', 'accessibility', 'best-practices', 'seo']) {
  return new Promise((resolve, reject) => {
    const flags = categories.map(c => `--only-categories=${c}`).join(' ');
    const cmd = `npx lighthouse "${url}" --output=json --output-path="${outputPath}" ${flags} --chrome-flags="--headless --no-sandbox --disable-gpu"`;
    const proc = spawn('sh', ['-c', cmd], { stdio: 'ignore' });
    const timer = setTimeout(() => { proc.kill(); reject(new Error('Lighthouse timed out after 120s')); }, 120000);
    proc.on('close', () => {
      clearTimeout(timer);
      try { resolve(parseLighthouseReport(outputPath, url)); }
      catch (e) { reject(e); }
    });
    proc.on('error', (e) => { clearTimeout(timer); reject(e); });
  });
}

// POST /api/lighthouse/static — static audit of a plugin's dist/index.html (no Chrome needed)
app.post('/api/lighthouse/static', (req, res) => {
  const { appId } = req.body;
  if (!appId) return res.status(400).json({ error: 'appId required' });
  const htmlPath = join(ROOT, 'apps', appId, 'dist', 'index.html');
  if (!existsSync(htmlPath)) return res.status(404).json({ error: `dist/index.html not found for ${appId} — build first` });
  try {
    const result = analyzeHtmlFile(htmlPath);
    const stored = { appId, type: 'static', ...result, timestamp: new Date().toISOString() };
    writeFileSync(join(LH_DATA_DIR, `lighthouse-${appId}.json`), JSON.stringify(stored, null, 2));
    res.json({ success: true, ...stored });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/lighthouse/live — full Lighthouse audit (requires Chrome + preview server running)
app.post('/api/lighthouse/live', async (req, res) => {
  const { appId, url } = req.body;
  if (!appId && !url) return res.status(400).json({ error: 'appId or url required' });
  const port = appId ? portForApp(appId) : null;
  const targetUrl = url || (port ? `http://localhost:${port}` : null);
  if (!targetUrl) return res.status(400).json({ error: `Cannot resolve URL for appId: ${appId}` });

  // Pre-flight: check the preview server is actually responding before spending 2 min on Lighthouse
  try {
    const { default: http } = await import('http');
    await new Promise((resolve, reject) => {
      const req = http.get(targetUrl, r => { r.resume(); resolve(r.statusCode); });
      req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
      req.on('error', reject);
    });
  } catch {
    return res.status(503).json({
      error: `Preview server not responding at ${targetUrl}. Run pnpm dev first, then retry.`,
      hint: port ? `Expected server on port ${port}` : undefined,
    });
  }

  const slug = (appId || 'custom') + targetUrl.replace(/[^a-z0-9]/gi, '-');
  const outPath = join(LH_DATA_DIR, `lh-report-${slug}.json`);
  try {
    const result = await runLighthouseAsync(targetUrl, outPath);
    const allNull = Object.values(result.metrics).every(v => v === null);
    if (allNull) {
      return res.status(422).json({
        error: `Lighthouse connected but all scores are null — the page likely errored on load. Open ${targetUrl} in a browser to check.`,
        url: targetUrl,
      });
    }
    const stored = { appId: appId || 'custom', type: 'live', url: targetUrl, ...result };
    writeFileSync(join(LH_DATA_DIR, `lighthouse-${appId || 'custom'}.json`), JSON.stringify(stored, null, 2));
    res.json({ success: true, ...stored });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/lighthouse/batch — audit multiple URLs in parallel (each gets its own Chrome process)
app.post('/api/lighthouse/batch', async (req, res) => {
  const { targets } = req.body; // [{ appId, url }]
  if (!Array.isArray(targets) || targets.length === 0)
    return res.status(400).json({ error: 'targets must be a non-empty array of { appId, url }' });

  const results = await Promise.all(
    targets.map(async ({ appId, url }) => {
      const start = Date.now();
      // Pre-flight check
      try {
        const { default: http } = await import('http');
        await new Promise((resolve, reject) => {
          const r = http.get(url, res => { res.resume(); resolve(res.statusCode); });
          r.setTimeout(3000, () => { r.destroy(); reject(new Error('timeout')); });
          r.on('error', reject);
        });
      } catch {
        return { appId, url, success: false, error: `Preview server not responding at ${url}`, duration: Date.now() - start };
      }

      const slug = (appId || 'custom') + url.replace(/[^a-z0-9]/gi, '-');
      const outPath = join(LH_DATA_DIR, `lh-report-${slug}.json`);
      try {
        const result = await runLighthouseAsync(url, outPath);
        const allNull = Object.values(result.metrics).every(v => v === null);
        if (allNull) return { appId, url, success: false, error: 'All scores null — page did not render', duration: Date.now() - start };
        const stored = { appId, type: 'live', url, ...result };
        writeFileSync(join(LH_DATA_DIR, `lighthouse-${appId}-${slug.slice(-8)}.json`), JSON.stringify(stored, null, 2));
        return { appId, url, success: true, ...result, duration: Date.now() - start };
      } catch (e) {
        return { appId, url, success: false, error: e.message, duration: Date.now() - start };
      }
    })
  );

  res.json({ results, total: results.length, passed: results.filter(r => r.success).length });
});

// GET /api/lighthouse/:appId — retrieve last stored result
app.get('/api/lighthouse/:appId', (req, res) => {
  const { appId } = req.params;
  const p = join(LH_DATA_DIR, `lighthouse-${appId}.json`);
  if (!existsSync(p)) return res.status(404).json({ error: 'No audit result found — run an audit first' });
  try { res.json(JSON.parse(readFileSync(p, 'utf-8'))); } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/lighthouse — all stored results
app.get('/api/lighthouse', (_req, res) => {
  const registry = readRegistrySafe();
  const results = registry
    .filter(e => e.id !== 'shell')
    .map(e => {
      const p = join(LH_DATA_DIR, `lighthouse-${e.id}.json`);
      return existsSync(p) ? JSON.parse(readFileSync(p, 'utf-8')) : { appId: e.id, score: null };
    });
  res.json(results);
});

// ─── JSON Diff ────────────────────────────────────────────────────────────────

function diffJson(before, after, path = '') {
  const changes = [];
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of allKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    const bVal = (before || {})[key];
    const aVal = (after || {})[key];
    if (!(key in (before || {}))) {
      changes.push({ path: fullPath, type: 'added', value: aVal });
    } else if (!(key in (after || {}))) {
      changes.push({ path: fullPath, type: 'removed', oldValue: bVal });
    } else if (typeof bVal === 'object' && bVal !== null && typeof aVal === 'object' && aVal !== null && !Array.isArray(bVal) && !Array.isArray(aVal)) {
      changes.push(...diffJson(bVal, aVal, fullPath));
    } else if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      changes.push({ path: fullPath, type: 'changed', oldValue: bVal, value: aVal });
    }
  }
  return changes;
}

// POST /api/json/diff — deep diff two JSON objects
app.post('/api/json/diff', (req, res) => {
  const { before, after } = req.body;
  if (before === undefined || after === undefined) return res.status(400).json({ error: 'before and after required' });
  try {
    const changes = diffJson(
      typeof before === 'string' ? JSON.parse(before) : before,
      typeof after  === 'string' ? JSON.parse(after)  : after,
    );
    res.json({ changes, hasChanges: changes.length > 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(5001, () => {
  console.log('DevTools API running on http://localhost:5001');

  // Auto-start vite preview for registered apps whose port is not yet occupied.
  // This recovers scaffolded apps after a devtools server restart without
  // killing preview servers already started by `pnpm dev`.
  const registered = readRegistrySafe();
  for (const entry of registered) {
    if (entry.id === 'shell') continue;
    const distDir = join(ROOT, 'apps', entry.id, 'dist');
    if (!existsSync(distDir)) continue;
    const port = portForApp(entry.id);
    if (!port) continue;
    // Check if something is already serving this port — if so, skip
    const portInUse = spawnSync('sh', ['-c', `lsof -ti:${port} 2>/dev/null | head -1`], { encoding: 'utf8' }).stdout.trim();
    if (portInUse) continue; // Already served (e.g. by pnpm dev)
    restartPreview(entry.id);
  }
});
