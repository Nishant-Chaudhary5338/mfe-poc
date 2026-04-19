#!/usr/bin/env node
// dev-remotes.js — build or preview all registered remote plugins dynamically.
// Usage:
//   node scripts/dev-remotes.js build    — build all remotes
//   node scripts/dev-remotes.js preview  — vite preview all remotes in parallel
//
// Reads app IDs from devtools/data/registry.json so scaffolded apps are included.

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REGISTRY = join(ROOT, 'devtools', 'data', 'registry.json');

const mode = process.argv[2]; // 'build' | 'preview'
if (!mode || !['build', 'preview'].includes(mode)) {
  console.error('Usage: node scripts/dev-remotes.js build|preview');
  process.exit(1);
}

// Read registry; fall back to the 4 core apps if file missing
let registry;
try {
  registry = JSON.parse(readFileSync(REGISTRY, 'utf8')).filter(e => e.id !== 'shell');
} catch {
  registry = [
    { id: 'sms', url: 'http://localhost:3001/assets/remoteEntry.js' },
    { id: 'qca', url: 'http://localhost:3002/assets/remoteEntry.js' },
    { id: 'cms', url: 'http://localhost:3003/assets/remoteEntry.js' },
    { id: 'mam', url: 'http://localhost:3004/assets/remoteEntry.js' },
  ];
}

const apps = registry.map(e => e.id);

if (apps.length === 0) {
  console.log('No remote apps found in registry.');
  process.exit(0);
}

function extractPort(url) {
  try { return new URL(url).port; } catch { return null; }
}

function killPort(port) {
  if (!port) return;
  spawnSync('sh', ['-c', `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`], { stdio: 'ignore' });
}

console.log(`[dev-remotes] ${mode} → ${apps.join(', ')}`);

const filters = apps.flatMap(id => ['--filter', id]);

if (mode === 'build') {
  const r = spawnSync('pnpm', [...filters, 'build'], { cwd: ROOT, shell: true, stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

if (mode === 'preview') {
  // Kill any stale processes on the app ports before starting fresh previews
  for (const entry of registry) {
    const port = extractPort(entry.url);
    if (port) {
      console.log(`[dev-remotes] clearing port ${port} (${entry.id})`);
      killPort(port);
    }
  }

  // Small delay to let OS release the ports before binding
  await new Promise(r => setTimeout(r, 600));

  const procs = apps.map(id => {
    const p = spawn('pnpm', ['--filter', id, 'preview'], { cwd: ROOT, shell: true, stdio: 'inherit' });
    p.on('exit', code => {
      if (code) console.error(`[dev-remotes] ${id} preview exited with code ${code}`);
    });
    return p;
  });

  const kill = () => { procs.forEach(p => { try { p.kill(); } catch {} }); };
  process.on('SIGINT', kill);
  process.on('SIGTERM', kill);
}
