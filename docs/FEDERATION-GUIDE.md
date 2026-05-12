# Module Federation v2 — Complete Guide
# ========================================
# Everything about @module-federation/vite, how loading works,
# dev vs production modes, chunk comparison, and the full MFE lifecycle.

---

## What is Module Federation v2?

Module Federation allows multiple independently-built JavaScript applications to
share code at runtime — without bundling everything together at build time.

In this project:
- **Shell** (host): loads remote apps dynamically from a registry
- **Remotes** (SMS, QCA, CMS, MAM): expose their React root component as `./App`

MF v2 (`@module-federation/vite` v1.15.4) is the official Vite plugin from the
Module Federation team (ByteDance/Zack Jackson). It replaced the community
`@originjs/vite-plugin-federation` plugin used in MF v1.

---

## Key Differences: MF v1 vs MF v2

| Aspect | MF v1 (@originjs) | MF v2 (@module-federation) |
|---|---|---|
| Plugin | `@originjs/vite-plugin-federation` | `@module-federation/vite` |
| Import style | `import federation from '...'` (default) | `import { federation } from '...'` (named) |
| remoteEntry.js location | `dist/assets/remoteEntry.js` | `dist/remoteEntry.js` (root) |
| remoteEntry.js format | Classic script (IIFE) | ES module (import/export) |
| Shell loading | Script tag injection | Native `import()` |
| Dev mode | Must build + preview (no HMR) | Can use vite dev with proper setup |
| TypeScript types | No | Generated (.d.ts per exposed module) |
| Chunk count | ~6 chunks | ~24 chunks (virtual MF modules) |
| CSS | Separate file, not injected | Requires `vite-plugin-css-injected-by-js` |
| Shared scope | Implicit | Explicit `init()` call |

---

## Build Output Structure

### Shell (`apps/shell/dist/`)

```
dist/
  index.html                  ← serves the shell UI
  mf-entry-bootstrap-0.js     ← MF bootstrap (handles shared module init)
  assets/
    style-XXX.css             ← shell's Tailwind CSS
    index-XXX.js              ← shell main bundle
    App-XXX.js                ← shell App component
    RemoteLoader-XXX.js       ← remote loading logic
```

### Remote (`apps/sms/dist/`)

```
dist/
  index.html                  ← only used for standalone mode
  remoteEntry.js              ← MF container: exports { init, get }
  mf-entry-bootstrap-0.js     ← MF bootstrap
  @mf-types/                  ← TypeScript type declarations (auto-generated)
  assets/
    App-XXX.js                ← App component bundle
    Login-XXX.js              ← Login page (lazy chunk)
    Dashboard-XXX.js          ← Dashboard page (lazy chunk)
    api-XXX.js                ← RTK Query + @repo/ui bundle (~1.4MB in dev)
    store-XXX.js              ← Redux store
    _virtual_mf-*.js          ← MF internal: shared dep negotiation
    dist-XXX.js               ← react-router-dom bundle
    rolldown-runtime-XXX.js   ← build runtime
    hostInit-XXX.js           ← federation init
```

**Note on CSS**: When `vite-plugin-css-injected-by-js` is active, there is NO `style-*.css` file. The CSS is inlined into the JS bundle (visible in `assets/api-XXX.js` or similar large bundle).

---

## How the Shell Loads Remotes

### 1. Registry fetch

On startup, shell fetches the plugin registry:

```ts
// apps/shell/src/App.tsx
fetch('http://localhost:5001/api/registry')
  .catch(() => fetch('/registry.json'))  // DevTools server → fallback static
  .then(r => r.json())
  .then(data => setRegistry(data))
```

### 2. User clicks app card

`openApp(app)` is called, saves to `sessionStorage`, renders `<RemoteLoader>`.

### 3. RemoteLoader loads the remote

```ts
// apps/shell/src/RemoteLoader.tsx
async function loadRemoteApp(id: string, url: string): Promise<ComponentType> {
  // Re-use cached containers
  if (containerCache.has(id)) { ... }

  // Load remoteEntry.js as ES module (cache-busted for fresh builds)
  const container = await import(/* @vite-ignore */ `${url}?_t=${Date.now()}`) as MFContainer

  // Validate container API
  if (typeof container.get !== 'function') throw new Error(...)

  // Initialize shared scope (shared modules handled at build time by vite plugin)
  try { await container.init({}) } catch { /* already initialized */ }

  containerCache.set(id, container)

  // Get the exposed './App' module
  const factory = await container.get('./App')
  const mod = factory()
  return mod.default
}
```

### 4. CSS auto-injects

When `import(url)` loads `remoteEntry.js`, the inlined CSS (from `vite-plugin-css-injected-by-js`) automatically creates `<style>` tags in the shell's document.

### 5. React component renders

The returned `mod.default` is the remote app's React component. Shell renders it:
```tsx
return <Component />  // full-screen, no shell chrome
```

---

## vite.config.ts Anatomy

### Remote app (sms/qca/cms/mam)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'   // named import
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  base: 'http://localhost:3001/',  // absolute base URL for all assets
  plugins: [
    cssInjectedByJsPlugin(),       // FIRST: inlines CSS into JS bundle
    react(),
    tailwindcss(),
    federation({
      name: 'sms',                 // must be unique across all remotes
      filename: 'remoteEntry.js',  // output at dist/remoteEntry.js (NOT dist/assets/)
      exposes: {
        './App': './src/App.tsx',   // shell loads this
      },
      shared: {
        // Shared singletons — only one copy in memory across shell + remote
        react:               { singleton: true, eager: true, requiredVersion: false },
        'react-dom':         { singleton: true, eager: true, requiredVersion: false },
        'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: false },
        'react-router-dom':  { singleton: true, requiredVersion: false },
        // '@repo/auth' is NOT listed — remotes read from window bridge instead
      },
    }),
  ],
  server:  { port: 3001, cors: true },
  preview: { port: 3001, cors: true },
  build: {
    target: 'esnext',    // required by MF v2 (uses top-level await)
    minify: false,       // easier debugging, smaller diffs in chunk comparison
    cssCodeSplit: false, // single CSS output (overridden by cssInjectedByJs anyway)
  },
})
```

### Shell (`apps/shell`)

```ts
federation({
  name: 'shell',
  remotes: {},  // empty — we load dynamically via registry, not statically
  shared: {
    react:               { singleton: true, eager: true, requiredVersion: false },
    'react-dom':         { singleton: true, eager: true, requiredVersion: false },
    'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: false },
    '@repo/auth':        { singleton: true, eager: true, requiredVersion: false },
    // @repo/auth is shared from shell so remotes can access AuthProvider context
  },
})
```

---

## Error Reference

### RUNTIME-001 — Failed to get remoteEntry exports

```
[ Federation Runtime ]: Failed to get remoteEntry exports. #RUNTIME-001
args: {"remoteName":"sms","remoteEntryUrl":"http://localhost:3001/remoteEntry.js"}
```

**Cause**: `@module-federation/runtime`'s `loadRemote()` loads remoteEntry.js as a
classic script via `<script>` tag. MF v2 remoteEntry is an ES module (uses `import/export`).
Classic scripts can't have `import` statements → browser throws "Cannot use import statement outside a module".

**Fix**: Use native `import()` instead of `@module-federation/runtime`:
```ts
const container = await import(/* @vite-ignore */ url)
```

### CSS not applied after remote loads

**Cause**: Remote CSS lives in `dist/assets/style-XXX.css`. When shell loads the remote
as a JS module (not the remote's HTML), the CSS file is never linked.

**Fix**: Add `vite-plugin-css-injected-by-js` to the remote's vite.config.ts.
Verify: remoteEntry.js should be > 10KB (CSS inlined).

### "Cannot use import statement outside a module" in console

**Cause**: RUNTIME-001, see above.

### Type declarations not generated (#TYPE-001)

```
[ Module Federation DTS ] Error: Failed to generate type declaration. #TYPE-001
```

**Status**: Non-critical warning. TypeScript types for the exposed `./App` module
are not auto-generated. The builds succeed. For now, the shell's RemoteLoader
uses a manual `MFContainer` interface type. Fix: configure the DTS plugin in vite.config.ts.

### Hot reload not working in dev mode

**Cause**: `pnpm dev:hmr` (turbo dev all apps) fails when Console Ninja VS Code extension
is running — it crashes vite preview processes.

**Fix**: Disable Console Ninja or use `pnpm dev` (build + preview mode).

---

## Chunk Hash Comparison with MF v2

MF v2 produces more chunks than v1 due to virtual modules for shared dep negotiation:

```
MF v1 chunks (~6):
  App-XXX.js, Dashboard-XXX.js, Login-XXX.js, dist-XXX.js, api-XXX.js, store-XXX.js

MF v2 chunks (~24):
  App-XXX.js, Dashboard-XXX.js, Login-XXX.js         ← same app logic chunks
  _virtual_mf-localSharedImportMap-XXX.js             ← shared map
  _virtual_mf___mfe_internal__sms__loadShare__react-XXX.js  ← react shared chunk
  _virtual_mf___mfe_internal__sms__loadShare__react-dom-XXX.js
  _virtual_mf___mfe_internal__sms__loadShare__react-router-dom-XXX.js
  _virtual_mf___mfe_internal__sms__prebuild__react-dom-XXX.js
  ... (multiple variants for different module targets)
  virtual_mf-REMOTE_ENTRY_ID-XXX.js                  ← remoteEntry body
  virtual_mf-exposes-XXX.js                           ← exposes registry
  rolldown-runtime-XXX.js                             ← build runtime
  hostInit-XXX.js, index-XXX.js                       ← init modules
```

The DevTools `normalizeChunkName()` handles both formats:
```js
function normalizeChunkName(filename) {
  return filename
    .replace(/-[A-Za-z0-9_-]{8}\.(js|css)$/, '')  // strip 8-char hash
    .replace(/\.(js|css)$/, '')                     // strip extension
}
```

**The key insight**: If only `Login.tsx` changes:
- `Login-XXX.js` gets a new hash (content changed) → CHANGED ⚠️
- `App-XXX.js`, `Dashboard-XXX.js`, `api-XXX.js` stay identical → UNCHANGED ✅
- ALL `_virtual_mf_*` chunks stay identical → UNCHANGED ✅

This proves route-level code splitting works correctly with MF v2.

---

## dev mode vs preview mode

### pnpm dev (default — recommended for development)

```bash
# What it does:
# 1. Clears ports 3000-3004
# 2. Builds all remotes (pnpm build:mfe)
# 3. Starts preview servers for remotes (vite preview --port 3001..3004)
# 4. Starts shell in vite dev mode (HMR for shell code changes)
pnpm dev
```

- Shell: HMR enabled (fast iteration on shell code)
- Remotes: need rebuild for changes (`pnpm --filter sms build && DevTools → Restart Previews`)
- remoteEntry.js: served from `dist/` via Vite preview → stable, 128KB with CSS

### pnpm dev:hmr (experimental — true HMR all apps)

```bash
# What it does: turbo dev for all apps simultaneously
# All apps run in vite dev mode
pnpm dev:hmr
```

- Requires Console Ninja disabled (it crashes vite processes)
- remoteEntry.js in dev mode is a virtual endpoint, not a file
- Shell's native `import()` must point to the dev server URL
- Known issue: RUNTIME-001 can still occur without proper dev mode setup
- Future: Migrate to `@module-federation/enhanced/vite` for proper dev HMR

### Production

```bash
# Build all apps
pnpm build:mfe && pnpm --filter shell build

# Deploy to CDN/static hosting:
# Each dist/ is a self-contained deployment unit
# Update registry URLs to CDN URLs
# Shell reads new registry → loads from CDN → no shell redeploy needed
```

---

## Adding a New Remote App (Manual)

### Step 1: Create app directory

```bash
cp -r apps/sms apps/mynewapp
```

### Step 2: Update vite.config.ts

```ts
// apps/mynewapp/vite.config.ts
federation({
  name: 'mynewapp',              // unique name
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App.tsx' },
  // ... same shared config
})
// base, server.port, preview.port → new unique port (e.g., 3005)
```

### Step 3: Update package.json

```json
{ "name": "mynewapp" }
```

### Step 4: Create store structure

```
apps/mynewapp/src/store/
  index.ts       (copy + update reducerPath)
  authSlice.ts   (update TOKEN_KEY = 'mynewapp_auth_token')
  api.ts         (define your endpoints)
```

### Step 5: Create src/index.css (REQUIRED for Tailwind)

```css
@import "tailwindcss";
@import "@repo/tailwind-config";
```

### Step 6: Update main.tsx CSS imports

```ts
import './index.css';
import '@repo/shared-ui/styles.css';
import '@repo/ui/styles.css';
```

### Step 7: Do NOT add * { padding: 0 } to index.html

Leave index.html clean — just Google Fonts links if needed.

### Step 8: Add to registry

```json
// devtools/data/registry.json
{ "id": "mynewapp", "url": "http://localhost:3005/remoteEntry.js", ... }
```

### Step 9: Install + build

```bash
pnpm install
pnpm --filter mynewapp build
```

---

## Shared Dependencies — What and Why

Shared modules prevent duplicate instances of key packages:

```ts
shared: {
  react: { singleton: true, eager: true }
  // singleton: only ONE React instance in memory (required for hooks)
  // eager: pre-initialize at shell startup (avoids async init issues)
}
```

**What to share**: React ecosystem singletons (react, react-dom, react/jsx-runtime, react-router-dom), auth context (`@repo/auth`).

**What NOT to share**: `@reduxjs/toolkit`, `react-redux` — each remote needs its own store. Sharing would create one global store, which breaks isolation.

**What's optional**: `@repo/shared-ui` can be shared to reduce bundle size, but currently each remote bundles its own copy for maximum isolation.

---

## The Container Protocol

MF v2 `remoteEntry.js` exposes two functions:

```ts
interface MFContainer {
  init(shareScope: Record<string, unknown>): void | Promise<void>
  get(module: string): Promise<() => { default: ComponentType; [key: string]: any }>
}
```

- `init(shareScope)`: Registers the remote's shared modules. Shell calls this to negotiate which React/etc. version to use.
- `get('./App')`: Returns a factory function. Calling the factory returns the module exports. `module.default` is the React component.

In our `RemoteLoader.tsx`, we call `init({})` with empty scope because shared modules are already handled at build time by the vite plugin. The empty object means "no shared scope from caller" — each remote uses its own pre-resolved shared deps.
