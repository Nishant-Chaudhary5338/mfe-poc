import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { spawn, spawnSync } from 'child_process';

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
  const registry = readRegistry();
  const filtered = registry.filter(e => e.id !== req.params.id);
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
      dependencies: { '@repo/shared-ui': 'workspace:*', react: '^19.2.4', 'react-dom': '^19.2.4', 'react-router-dom': '^7.6.0' },
      devDependencies: {
        '@originjs/vite-plugin-federation': '^1.4.1',
        '@types/react': '^19.1.0', '@types/react-dom': '^19.1.0',
        '@vitejs/plugin-react': '^6.0.1', typescript: '^5.8.3', vite: '^8.0.0',
      },
    };
    writeFileSync(join(appDir, 'package.json'), JSON.stringify(pkg, null, 2));
    files.push(`apps/${id}/package.json`);

    // vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  base: 'http://localhost:${port}/',
  plugins: [
    react(),
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
    const main = `import { StrictMode } from 'react';
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
    const navLinks = initialRoutes.map((r, i) => `          <NavLink to="${i === 0 ? '/' : r.path}" ${i === 0 ? 'end ' : ''}style={({ isActive }) => tab(isActive)}>${cap(r.name)}</NavLink>`).join('\n');
    const routeEls = initialRoutes.map((r, i) => `              <Route path="${i === 0 ? '/' : r.path}" element={<${cap(r.name)} />} />`).join('\n');

    const appTsx = `import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import type { CSSProperties } from 'react';

const COLOR = '${COLOR}';
const COLOR_DARK = '${COLOR_DARK}';

${lazys}

function tab(isActive: boolean): CSSProperties {
  return {
    padding: '7px 18px', borderRadius: 20,
    background: isActive ? COLOR : 'transparent',
    color: isActive ? 'white' : '#4A5170',
    border: \`1.5px solid \${isActive ? COLOR : '#D6D9E8'}\`,
    textDecoration: 'none', fontSize: 13,
    fontWeight: isActive ? 600 : 500, display: 'inline-block',
  };
}

export default function App() {
  useEffect(() => {
    console.log('${label} mounted');
    return () => console.log('${label} unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F7F8FC', minHeight: '100vh' }}>
        <div style={{ background: \`linear-gradient(135deg, \${COLOR} 0%, \${COLOR_DARK} 100%)\`, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 11, color: 'white', letterSpacing: '0.08em' }}>
            ${id.toUpperCase().slice(0, 4)}
          </div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: 'white' }}>${label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>TVPlus Plugin Platform</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '14px 28px', borderBottom: '1px solid #D6D9E8', background: 'white' }}>
${navLinks}
        </div>
        <div style={{ padding: 28 }}>
          <Suspense fallback={<div style={{ color: '#8C94B0', fontSize: 14, padding: 20 }}>Loading...</div>}>
            <Routes>
${routeEls}
            </Routes>
          </Suspense>
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
      registry.push({ id, label, url: `http://localhost:${port}/assets/remoteEntry.js` });
      writeRegistry(registry);
    }

    // Link workspace dependencies
    spawnSync('pnpm', ['install', '--frozen-lockfile=false'], { cwd: ROOT, shell: true, stdio: 'ignore' });

    // Build the new plugin so it's immediately ready for preview and compare
    spawnSync('pnpm', ['--filter', id, 'build'], { cwd: ROOT, shell: true, stdio: 'ignore' });

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Route Add ───────────────────────────────────────────────────────────────

app.post('/api/route/add', (req, res) => {
  const { appId, name, path: routePath } = req.body;
  if (!appId || !name) return res.status(400).json({ error: 'appId, name required' });

  const appDir = join(ROOT, 'apps', appId);
  if (!existsSync(appDir)) return res.status(404).json({ error: `apps/${appId} not found` });

  const routeFile = join(appDir, 'src', 'routes', `${name}.tsx`);
  if (existsSync(routeFile)) return res.status(409).json({ error: `Route ${name} already exists` });

  try {
    // Write route file
    const routeTsx = `export default function ${cap(name)}() {
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
    // Insert NavLink before last </NavLink> closing or before </div> of nav
    src = src.replace(
      /(<NavLink[^>]*>[^<]*<\/NavLink>)(\s*<\/div>)/,
      `$1\n          <NavLink to="${rPath}" style={({ isActive }) => tab(isActive)}>${cap(name)}</NavLink>$2`
    );
    // Insert Route before </Routes>
    src = src.replace(
      /(<\/Routes>)/,
      `              <Route path="${rPath}" element={<${cap(name)} />} />\n            $1`
    );

    writeFileSync(appTsxPath, src);

    res.json({ success: true, routeFile: `apps/${appId}/src/routes/${name}.tsx`, path: rPath });
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
    ? ['--filter', 'sms', '--filter', 'qca', '--filter', 'cms', '--filter', 'mam', 'build']
    : ['--filter', appId, 'build'];

  const send = (type, line) => res.write(`data: ${JSON.stringify({ type, line })}\n\n`);

  // Snapshot current dist BEFORE building so compare shows what this build changed
  const targets = appId === 'all' ? ['sms', 'qca', 'cms', 'mam'] : [appId];
  targets.forEach(id => autoSnapshot(id));

  send('stdout', `Building ${appId === 'all' ? 'all remotes' : appId}...\n`);

  const proc = spawn('pnpm', args, { cwd: ROOT, shell: true });
  proc.stdout.on('data', d => send('stdout', d.toString()));
  proc.stderr.on('data', d => send('stderr', d.toString()));
  proc.on('close', code => {
    send('done', `\nProcess exited with code ${code}`);
    if (code === 0) {
      buildRevision++;
      send('stdout', '\n✓ Build complete — shell will reload automatically.\n');
    }
    res.write(`data: ${JSON.stringify({ type: 'exit', code })}\n\n`);
    res.end();
  });
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

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(5001, () => {
  console.log('DevTools API running on http://localhost:5001');
});
