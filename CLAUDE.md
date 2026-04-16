# CLAUDE.md — TVPlus MFE POC

This file gives AI assistants (Claude, Cline, etc.) the context needed to work effectively in this repo.

## What This Project Is

A **Micro-Frontend (MFE) proof-of-concept** for TVPlus, built with Vite + React + Module Federation (`@originjs/vite-plugin-federation`). It demonstrates:

1. **Plugin MFE Architecture** — each app (SMS, QCA, CMS, MAM) is independently built and served. The shell loads them at runtime via `remoteEntry.js`.
2. **Route-level code splitting** — each route within a plugin is a separate chunk. Adding a new route only adds one new chunk; existing route chunks are unchanged (proven by content-hash comparison).
3. **DevTools** — a companion web UI + API server for scaffolding plugins, adding routes, building, and comparing chunk hashes across builds.

## Monorepo Layout

```
apps/
  shell/          # Host app — loads remote plugins at runtime (port 3000)
  sms/            # Smart Monitoring System remote plugin (port 3001)
  qca/            # QC Automation remote plugin (port 3002)
  cms/            # Content Management System remote plugin (port 3003)
  mam/            # Media Asset Management remote plugin (port 3004)
  <new-plugin>/   # Scaffolded via DevTools UI — gets next available port
packages/
  shared-ui/      # Shared React components (Button, Card, PageHeader)
devtools/
  server.js       # Express API server (port 5001) — build, compare, scaffold, registry
  client/         # Vite React app (port 5173) — DevTools UI
docs/
  MFE-ARCHITECTURE.md  # Full architecture reference
scripts/
  snapshot-*.json      # Per-app chunk snapshots (gitignored, machine-local)
```

## Key Commands

```bash
# Install everything
pnpm install

# Full dev environment (builds remotes first, then runs remotes in preview + shell in dev)
pnpm dev

# Build all remote plugins
pnpm build:mfe

# Build a specific plugin
pnpm --filter sms build

# DevTools (API server + UI together)
pnpm devtools
```

## Architecture Decisions

### Why `pnpm dev` builds before running
`@originjs/vite-plugin-federation` requires built artifacts for remotes — you cannot run a remote in Vite dev mode and have the shell consume it (it uses a different module protocol). The root `dev` script does: build remotes → run remotes in `vite preview` → run shell in `vite dev`.

### Registry
The shell fetches `http://localhost:5001/api/registry` on every load. Each entry maps a plugin ID to its `remoteEntry.js` URL. The DevTools API reads/writes `devtools/data/registry.json`. The shell's own copy at `apps/shell/public/registry.json` is the production fallback.

### Chunk hash comparison
DevTools compares builds using content-MD5 of each `.js` file (not filename hashes). Before hashing, all 8-character Vite hash suffixes are stripped from the file content — this prevents "hash chaining" (where one chunk's hash change cascades through import URLs into unrelated chunks). Chunks are matched by logical name (filename with hash stripped). This is implemented in `md5Dir()` and `normalizeChunkName()` in `devtools/server.js`.

### Scaffolding a new plugin
DevTools UI → New Plugin → fills in ID, label, port, color, routes → POST `/api/scaffold` → creates `apps/<id>/` with all config files → runs `pnpm install` → runs `pnpm --filter <id> build` → registers in registry. No terminal needed.

## Windows-Specific Notes (Office PC)

The project is Mac/Linux-first. On Windows, some things need adjustment:

### Kill port before starting
Mac/Linux: `lsof -ti:5001 | xargs kill -9`
Windows (PowerShell):
```powershell
$pid = (netstat -ano | Select-String ":5001 ").ToString().Split()[-1]
Stop-Process -Id $pid -Force
```
Or use: `npx kill-port 5001` (cross-platform, install once with `npm i -g kill-port`)

### Shell scripts
`devtools/server.js` uses `spawnSync('sh', ...)` in `restartPreview`. On Windows, change to:
```js
spawnSync('cmd', ['/c', `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`], ...)
```
Or wrap the kill logic in a Node `child_process` call instead of a shell command.

### `pnpm devtools` background process
The script `node devtools/server.js & pnpm --filter devtools-client dev` uses `&` (Unix background operator). On Windows CMD this won't work. Use two separate terminals, or install `concurrently`:
```bash
npx concurrently "node devtools/server.js" "pnpm --filter devtools-client dev"
```
Or update `package.json`:
```json
"devtools": "concurrently \"node devtools/server.js\" \"pnpm --filter devtools-client dev\""
```

### Line endings
A `.gitattributes` file ensures consistent line endings. Already in the repo.

### Path separators
All Node.js code uses `path.join()` — safe on Windows. Do not hardcode `/` in file paths.

## Patterns to Follow When Modifying

- **Adding a route manually**: Add lazy import + NavLink + Route to `apps/<id>/src/App.tsx`. Follow the existing pattern exactly. Run `pnpm --filter <id> build` after.
- **Adding a plugin manually**: Copy an existing app folder, update `vite.config.ts` (name, port, base URL), add to `devtools/data/registry.json` and `apps/shell/public/registry.json`.
- **DevTools server changes**: Restart `node devtools/server.js` — it does not hot-reload.
- **Snapshot files**: Never commit `scripts/snapshot-*.json`. They are machine-local build baselines. Each developer gets their own by building once.

## Do Not

- Do not run `vite dev` on remote plugins and try to load them in the shell — use `vite preview` (built artifacts only).
- Do not add `manualChunks` to vite configs — it restructures chunk layout and breaks snapshot comparisons.
- Do not hardcode app lists anywhere — always read from `/api/apps` (DevTools) or `registry.json` (shell).
- Do not commit `dist/` or `deploys/` — they are gitignored.
