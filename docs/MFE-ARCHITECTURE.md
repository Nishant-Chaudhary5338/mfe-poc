# TVPlus Plugin MFE Architecture

## Overview

This project implements a **Micro-Frontend (MFE) architecture** using **Vite Module Federation** (`@originjs/vite-plugin-federation`). The core idea: each business domain (SMS, QCA, CMS, MAM) is a fully independent web application — independently built, independently deployed, and loaded at runtime by a central host called the **shell**.

```
┌─────────────────────────────────────────────────┐
│                  Shell (port 3000)               │
│                                                  │
│  Fetches registry → loads remoteEntry.js         │
│  Mounts plugin App component inside itself       │
│                                                  │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│   │ SMS  │  │ QCA  │  │ CMS  │  │ MAM  │       │
│   │:3001 │  │:3002 │  │:3003 │  │:3004 │       │
│   └──────┘  └──────┘  └──────┘  └──────┘       │
└─────────────────────────────────────────────────┘
```

---

## How Module Federation Works

Module Federation is a Vite/Webpack feature that allows one application (the **shell**) to consume JavaScript modules from another application (a **remote**) at runtime — no build-time coupling.

### Remote (plugin) side

Each plugin's `vite.config.ts` declares what it **exposes**:

```ts
federation({
  name: 'sms',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App.tsx',   // the shell will import this
  },
  shared: {
    react: { singleton: true, eager: true },
    'react-dom': { singleton: true, eager: true },
    'react-router-dom': { singleton: true },
  },
})
```

Building this produces a `dist/assets/remoteEntry.js` — a small manifest that tells the shell where all the plugin's chunks live and what shared modules it needs.

### Shell side

The shell's `vite.config.ts` declares the **remotes** it wants to consume. At runtime it fetches `registry.json` (from the DevTools API or its own `public/` folder) and dynamically calls `__federation_method_setRemote` to register each plugin's `remoteEntry.js` URL. Then `__federation_method_getRemote` fetches and executes it, returning the React component.

```ts
// Shell RemoteLoader (simplified)
await __federation_method_setRemote(id, { url: entry.url, format: 'esm' });
const mod = await __federation_method_getRemote(id, './App');
const App = mod.default;
// render <App /> inside shell layout
```

### Shared modules

`react`, `react-dom`, and `react-router-dom` are declared as `shared: { singleton: true }`. This means only **one copy** of React runs across the shell and all plugins. The shell provides it; plugins reuse it. Without this, each plugin would bundle its own React and they'd conflict.

---

## Plugin Registry

The registry is a JSON array mapping plugin IDs to their `remoteEntry.js` URL:

```json
[
  { "id": "sms", "label": "Smart Monitoring System", "url": "http://localhost:3001/assets/remoteEntry.js" },
  { "id": "qca", "label": "QC Automation",           "url": "http://localhost:3002/assets/remoteEntry.js" }
]
```

- **Dev/demo**: shell fetches from `http://localhost:5001/api/registry` (DevTools server)
- **Production**: shell fetches from its own `public/registry.json` (or a CDN endpoint)

Changing a URL in the registry redirects the shell to a different build of that plugin — zero downtime, no redeployment of the shell.

---

## Route-Level Code Splitting

Each plugin uses React's `lazy()` + React Router for its own internal routing:

```tsx
// apps/sms/src/App.tsx
const Dashboard = lazy(() => import('./routes/Dashboard.tsx'));
const Alerts    = lazy(() => import('./routes/Alerts.tsx'));
const Incidents = lazy(() => import('./routes/Incidents.tsx'));
```

Vite sees these dynamic `import()` calls and **splits each route into its own chunk**:

```
dist/assets/Dashboard-Xq55Gds7.js   5.0 kB   ← only loads when user visits /
dist/assets/Alerts-DiVvoFn6.js      4.9 kB   ← only loads when user visits /alerts
dist/assets/Incidents-7x8CsK7t.js   5.1 kB   ← only loads when user visits /incidents
```

### What this means for QA

When you add a new route (e.g. `Analytics`):
- Vite builds one new chunk: `Analytics-[hash].js`
- `App.tsx` changes (new lazy import + route) → its chunk gets a new hash
- `remoteEntry.js` changes (references updated App) → its hash changes
- **All other route chunks are byte-for-byte identical** — same content, same hash

The DevTools Build & Compare tool proves this. Adding one route shows:

```
1 Added    → Analytics-[hash].js        (new)
2 Modified → App-[hash].js, remoteEntry.js  (expected — entry changed)
N Unchanged → Dashboard, Alerts, Incidents, Services, Settings  (untouched)
```

"Unchanged" means those routes need **zero re-testing** after the deployment.

---

## How Chunk Hash Comparison Works

### The problem with filename hashes

Vite appends content hashes to filenames: `Alerts-DiVvoFn6.js`. These rotate on every build — even if the file content is identical. You cannot compare filenames directly.

### Content-MD5 approach

The DevTools snapshot system:

1. **Before building** — reads every `.js` file in `dist/assets/`, computes MD5 of file content, stores `{ normalizedName → MD5 }` as a snapshot JSON.
2. **After building** — does the same for the new `dist/assets/`.
3. **Compare** — matches chunks by normalized name (filename with hash stripped), compares MD5 hashes.

### Hash chaining problem and the fix

When `App.tsx` changes, its chunk gets a new hash. The `remoteEntry.js` imports App by its hashed filename URL, so its content changes too. Any chunk that imports a chunk whose filename changed will also have different content — even if its own logic is identical. This is **hash chaining**.

Example: `Alerts.tsx` doesn't change, but it imports `react-router-dom` via:
```js
import { NavLink } from './__federation_shared_react-router-dom-BMk89lC8.js'
```
If the shared module chunk rotates to `C--zgmsd`, Alerts's content changes (same byte count, different URL string) → different raw MD5.

**The fix** — before computing MD5, strip all 8-character Vite hash suffixes from the file content:
```js
const normalized = raw.replace(/-[A-Za-z0-9_-]{8}\.(js|css)/g, '.$1');
// "react-router-dom-BMk89lC8.js" → "react-router-dom.js"
// "react-router-dom-C--zgmsd.js" → "react-router-dom.js"  (same!)
```

After normalization, Alerts's content is identical across both builds → same MD5 → **Unchanged**. Only chunks whose actual logic changed get different MD5 → **Modified**.

The same regex is used in `normalizeChunkName()` to match old and new filenames by their logical name (without hash), correctly classifying Added / Deleted / Modified / Unchanged.

---

## Plugin MFE Isolation Proof

When you add a **new plugin** (scaffold + build), the existing plugins are unaffected:

- SMS, QCA, CMS, MAM are each built independently
- Their `dist/` folders do not change
- Their chunk hashes do not change
- The shell loads the new plugin by reading the updated registry

The DevTools "All Remotes" compare shows:
```
SMS  → 0 Added  0 Modified  0 Deleted  N Unchanged  ✓ Isolated
QCA  → 0 Added  0 Modified  0 Deleted  N Unchanged  ✓ Isolated
CMS  → 0 Added  0 Modified  0 Deleted  N Unchanged  ✓ Isolated
MAM  → 0 Added  0 Modified  0 Deleted  N Unchanged  ✓ Isolated
NEW  → 14 Added  (all chunks are new — expected)     NEW PLUGIN
```

Existing plugins require **zero re-testing** when a new plugin is added or removed.

---

## Development Flow

### First-time setup

```bash
pnpm install
pnpm build:mfe      # build all remote plugins (required before dev)
pnpm dev            # shell in dev mode + remotes in preview mode
```

### Running the DevTools

```bash
pnpm devtools
# → DevTools API:  http://localhost:5001
# → DevTools UI:   http://localhost:5173
```

### Full demo flow (townhall)

1. Open shell at `http://localhost:3000` — shows all plugins live
2. In DevTools → Route Manager → add a route to SMS → Build SMS → Compare
   - Proves: 1 Added, 2 Modified, all other routes Unchanged
3. In DevTools → New Plugin → fill form → Create Plugin
   - Scaffold runs automatically: creates files, installs, builds
4. In DevTools → Build & Compare → "All Remotes" → Compare
   - Proves: all existing plugins 0 Modified, new plugin all-Added
5. Refresh shell at `http://localhost:3000` — new plugin appears in sidebar

### Adding a route manually

1. Create `apps/<id>/src/routes/<Name>.tsx`
2. Add to `apps/<id>/src/App.tsx`:
   ```tsx
   const Name = lazy(() => import('./routes/Name.tsx'));
   // in nav: <NavLink to="/name">Name</NavLink>
   // in routes: <Route path="/name" element={<Name />} />
   ```
3. `pnpm --filter <id> build`

### Scaffolding a plugin manually

1. Copy an existing app folder (e.g. `apps/sms/`) to `apps/<newid>/`
2. Update `vite.config.ts`: change `name`, `base`, `server.port`, `preview.port`
3. Update `package.json`: change `name` to `@mfe/<newid>`
4. Add to `devtools/data/registry.json` and `apps/shell/public/registry.json`
5. `pnpm install && pnpm --filter <newid> build`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/shell/src/RemoteLoader.tsx` | Dynamically loads plugin App components via Module Federation |
| `apps/shell/src/Sidebar.tsx` | Reads registry, renders plugin nav links |
| `apps/shell/public/registry.json` | Shell's own copy of the plugin registry (production fallback) |
| `devtools/server.js` | Express API: scaffold, build (SSE), compare, registry CRUD |
| `devtools/data/registry.json` | Source of truth for DevTools — synced to shell registry on save |
| `packages/shared-ui/` | Shared React components used by plugins |
| `apps/*/vite.config.ts` | Federation config per plugin: name, port, exposed modules, shared deps |

---

## Benefits Summary

| Concern | Traditional SPA | Plugin MFE |
|---------|----------------|------------|
| Deploy scope | Entire app | Only the changed plugin |
| Team coupling | High — shared build | None — independent repos possible |
| QA scope after change | Full regression | Only affected plugin + routes |
| Runtime dependency | Compile-time bundled | Loaded on demand |
| Route download | All upfront | Only when navigated to |
| New feature rollout | Full redeploy | Update registry URL |
