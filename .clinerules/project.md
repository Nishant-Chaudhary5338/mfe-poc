# TVPlus Plugin MFE — Complete Project Reference
# Last updated: 2026-05-13 — Post MF v2 migration + Tailwind v4 production setup

## What This Project Is
Micro-Frontend POC for TVPlus broadcast platform. A shell app loads independent remote plugins at runtime via **Module Federation v2** (`@module-federation/vite`). Each plugin is independently built, served, deployed, and has its own Redux store + RTK Query. DevTools provides scaffolding, building, chunk comparison, and code generation.

Production-grade features implemented:
- MF v2 with native ESM loading (no script tag injection)
- Tailwind v4 with Signal & Flame design system
- Redux Toolkit + RTK Query per remote app
- Dual auth: shell (portal access) + app (API tokens)
- CSS injection via `vite-plugin-css-injected-by-js` (no CSS link needed in shell)
- sessionStorage-based active app persistence across refreshes
- Error boundaries around every remote load
- DevTools chunk hash comparison working with MF v2 chunk format

---

## Monorepo Layout

```
apps/
  shell/          port 3000 — host app, loads remotes via dynamic import()
  sms/            port 3001 — Smart Monitoring System (dual auth, RTK metrics/alerts)
  qca/            port 3002 — QC Automation (dual auth, RTK checks/rules)
  cms/            port 3003 — Content Management System (dual auth, RTK articles)
  mam/            port 3004 — Media Asset Management (SHELL AUTH ONLY, RTK assets/jobs)
packages/
  shared-ui/      @repo/shared-ui — shadcn CSS variables + 19 Radix UI components
  auth/           @repo/auth — AuthProvider, useAuth (with window bridge fallback)
  utils/          @repo/utils — string, validation, error helpers
  tailwind-config/ @repo/tailwind-config — Signal & Flame design tokens (shared-styles.css)
  ui/             @repo/ui — 48 pre-built components (Card, DataTable, Badge, Button, etc.)
  typescript-config/ @repo/typescript-config — base.json + vite.json TS configs
devtools/
  server.js       Express API on port 5001 (build, scaffold, snapshot, mock API)
  client/         Vite React UI on port 5173
  generators/     Code generation (login/form/detail/list/crud/tests)
  data/
    registry.json Source of truth for plugin registry (dev)
  mcp-server.js   MCP server for Cline integration
tests/
  e2e/
    portal.test.py  Playwright test suite (login, portal, remotes, CSS, auth)
    screenshots/    Auto-generated test screenshots
```

---

## Key Commands

```bash
pnpm install                          # install all workspaces
pnpm dev                              # build remotes + preview remotes + dev shell (HMR on shell)
pnpm dev:hmr                          # turbo dev all apps (requires Console Ninja disabled)
pnpm build:mfe                        # build all remote plugins
pnpm --filter shell build             # build shell
pnpm --filter sms build               # build one plugin
pnpm devtools                         # start DevTools API (5001) + UI (5173)
pnpm snapshot                         # snapshot chunk hashes for all apps
pnpm compare                          # compare chunks vs last snapshot

# E2E tests (requires apps built and served)
python tests/e2e/portal.test.py       # run all Playwright tests
pytest tests/e2e/portal.test.py -v    # with pytest integration
```

---

## ⚠️ CRITICAL RULES — Read Before Touching CSS

### 1. NEVER add `* { padding: 0 }` to any index.html

```html
<!-- ❌ KILLS ALL SPACING UTILITIES — this was the root cause of all spacing failures -->
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
</style>

<!-- ✅ Tailwind v4 @layer base handles this. Just add font links: -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans..." rel="stylesheet" />
```

Tailwind v4 puts ALL utilities inside `@layer utilities`. CSS outside any `@layer` (unlayered) beats any layered rule. `* { padding: 0 }` silently overrides every px-, py-, gap-, m- class. Discovered via Playwright CSS audit.

### 2. CSS import order in main.tsx is load-bearing

```ts
// apps/sms,qca,cms,mam — EXACT ORDER REQUIRED
import './index.css';                // Tailwind entry (local file, scanned by @tailwindcss/vite)
import '@repo/shared-ui/styles.css'; // shadcn variables (@layer base only)
import '@repo/ui/styles.css';        // @repo/ui component styles (last = wins conflicts)

// apps/shell — shell doesn't use @repo/ui components
import './index.css';
import '@repo/shared-ui/styles.css';
```

### 3. src/index.css must exist and have @import "tailwindcss"

```css
/* apps/*/src/index.css — DO NOT REMOVE */
@import "tailwindcss";
@import "@repo/tailwind-config";
```

`@tailwindcss/vite` only scans for utilities when `@import "tailwindcss"` is in a LOCAL file. Node_modules chain is not scanned. This local file is the trigger.

---

## ⚠️ CRITICAL RULES — Module Federation v2

### 4. Load remoteEntry.js with import(), not script tags

```ts
// ✅ apps/shell/src/RemoteLoader.tsx
const container = await import(/* @vite-ignore */ url) as MFContainer;
await container.init({});
const mod = await container.get('./App');
```

MF v2 generates ESM modules, not classic scripts. `@module-federation/runtime`'s `loadRemote()` injects script tags — fails with "Cannot use import statement outside a module" (RUNTIME-001). Use native `import()` instead.

### 5. remoteEntry.js is at dist root, not dist/assets

```
MF v1: dist/assets/remoteEntry.js    ← old path
MF v2: dist/remoteEntry.js           ← new path, no /assets/ prefix
```
Registry URLs in `devtools/data/registry.json` and `apps/shell/public/registry.json` must use the v2 path.

### 6. CSS must be injected into remoteEntry.js

Remote apps have no HTML — no `<link>` tag for CSS. Use `vite-plugin-css-injected-by-js`:
```ts
// apps/sms,qca,cms,mam vite.config.ts — in plugins array
cssInjectedByJsPlugin(), // BEFORE federation()
```
Result: remoteEntry.js grows from ~166 bytes to ~128KB (CSS inlined). Auto-injects `<style>` on import.

---

## Auth Architecture

### Two independent auth layers

```
Layer 1: Shell auth (@repo/auth + AuthProvider in shell)
  - Controls WHICH apps you see in the portal (RBAC)
  - Token: localStorage 'tvplus_auth_token' (base64 JSON mock JWT)
  - Bridge: window.__tvplus_auth = { user, token } — set by AuthProvider useEffect

Layer 2: App auth (Redux authSlice per app)
  - Controls API access (token for DevTools mock API calls)
  - Token: localStorage '{app}_auth_token'
  - POSTs to http://localhost:5001/api/mock/auth/login
  - Password for all mock users: 'password123'
```

### Auth patterns by app

| App | Login | API token source |
|---|---|---|
| SMS | Own login form (dual auth) | App token from authSlice |
| QCA | Own login form (dual auth) | App token from authSlice |
| CMS | Own login form (dual auth) | App token from authSlice |
| MAM | Shell auth only (no own login) | Shell bridge token |

### useAuth() in remotes reads from window bridge

```ts
// packages/auth/src/context.tsx — fallback when no AuthProvider context
const bridged = (globalThis as any).__tvplus_auth;
return { user: bridged?.user, token: bridged?.token, ... };
```
Shell's `AuthProvider` keeps `window.__tvplus_auth` in sync. Remotes call `useAuth()` and get shell user automatically.

---

## Redux + RTK Query Architecture

### Store structure (SMS/QCA/CMS pattern)

```
apps/sms/src/store/
  index.ts      — configureStore, typed hooks (useAppSelector, useAppDispatch)
  authSlice.ts  — auth state: { user, token, loading, error } + loginAsync thunk
  api.ts        — createApi with endpoints + type exports
```

### RTK Query auth injection

```ts
// All remote api.ts files
baseQuery: fetchBaseQuery({
  baseUrl: 'http://localhost:5001',
  prepareHeaders: (headers, { getState }) => {
    const appToken   = (getState() as RootState).auth.token;   // own login token
    const shellToken = (globalThis as any).__tvplus_auth?.token; // bridge fallback
    const token = appToken || shellToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
}),
```

### Mock API endpoints (DevTools server port 5001)

| Path | App | Data |
|---|---|---|
| POST /api/mock/auth/login | All | email + password → { token, user } |
| GET /api/mock/auth/me | All | Bearer token → { user } |
| GET /api/mock/metrics | SMS | Service health metrics |
| GET /api/mock/alerts | SMS | Active/firing alerts |
| GET /api/mock/checks | QCA | QC check results |
| GET /api/mock/rules | QCA | QC rule definitions |
| GET /api/mock/articles | CMS | Content articles |
| GET /api/mock/assets | MAM | Media asset library |
| GET /api/mock/jobs | MAM | Transcoding job queue |
| GET /api/mock/incidents | SMS | Incident history |

All endpoints support full CRUD via `mockCrud()` pattern.

---

## Design System

### Signal & Flame (packages/tailwind-config/shared-styles.css)

```css
--signal-500: #1428A0   /* Signal Blue — primary, trust, action, SMS/Shell */
--flame-500:  #F4511E   /* Flame Orange — energy, urgency, MAM */
--signal-400: #546BE8   /* Purple — QCA accent */
--signal-700: #0D1B70   /* Dark Navy — CMS accent, sidebar bg */

/* Neutral palette */
--neutral-50:  #F7F8FC  /* Page backgrounds */
--neutral-100: #ECEEF5  /* Card borders */
--neutral-500: #636B8A  /* Muted text */
--neutral-900: #0D1020  /* Primary text */
```

### Font stack

```
DM Sans   → body text (font-sans in Signal & Flame config)
Sora      → headings, brand (font-[Sora] in Tailwind arbitrary)
DM Mono   → code, metrics
Inter     → @repo/ui component library default (from dist/index.css theme)
```

### @repo/ui component usage

```ts
import { Button, Card, CardContent, CardHeader, CardTitle,
         DataTable, Badge, Skeleton, Progress, Input, Label } from '@repo/ui'
import type { ColumnDef } from '@tanstack/react-table'
```

Components use shadcn token variables (--primary, --background, etc.) from `@repo/shared-ui/styles.css`.

---

## Plugin Registry

```json
// devtools/data/registry.json (authoritative) + apps/shell/public/registry.json (fallback)
[
  {
    "id": "sms",
    "label": "Smart Monitoring System",
    "url": "http://localhost:3001/remoteEntry.js",  // MF v2: no /assets/ prefix
    "requiredRoles": ["admin", "viewer", "ops"],
    "disabled": false
  }
]
```

Shell fetches from `http://localhost:5001/api/registry` at startup (fallback: `/registry.json`).

---

## Adding a Route Manually

1. Create `apps/<id>/src/routes/<Name>.tsx`
2. Add lazy import + NavLink + Route to `apps/<id>/src/App.tsx`:
   ```tsx
   const Name = lazy(() => import('./routes/Name.tsx'));
   // in navItems: { path: '/name', label: 'Name', icon: '🔧', end: false }
   // in Routes: <Route path="/name" element={<Name />} />
   ```
3. `pnpm --filter <id> build`
4. DevTools → Build & Compare → Take snapshot (establishes baseline)

Or use DevTools UI → Route Manager (auto-generates and rebuilds).

---

## Adding a New Plugin Manually

1. Copy `apps/sms/` to `apps/<newid>/`
2. Update `vite.config.ts`: name, base URL, server.port, preview.port
3. Update `package.json`: set `"name": "<newid>"`
4. Ensure `index.html` does NOT have `* { padding: 0 }` inline style
5. Ensure `src/index.css` has `@import "tailwindcss"; @import "@repo/tailwind-config";`
6. Update store token key: `const TOKEN_KEY = '<newid>_auth_token'`
7. Add to `devtools/data/registry.json` and `apps/shell/public/registry.json`
8. `pnpm install && pnpm --filter <newid> build`

Or use DevTools UI → New Plugin (fully automated).

---

## Chunk Hash Comparison — MF v2 Update

MF v2 produces 24+ chunks per app (vs ~6 with v1). The `normalizeChunkName()` function
strips 8-char hashes from all filenames including the new `_virtual_mf_*` chunks:
```
App-ABC12345.js                                → App
_virtual_mf___mfe_internal__sms__loadShare__react-ABC12345.js → _virtual_mf___mfe_internal__sms__loadShare__react
```
Comparison is FULLY FUNCTIONAL with MF v2. Test: `pnpm snapshot && pnpm compare`.

---

## DevTools API Reference (port 5001)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/registry` | GET | Get all plugins |
| `/api/registry` | PUT | Update full registry |
| `/api/apps` | GET | Get apps with build status |
| `/api/scaffold` | POST | Create new plugin: `{ id, label, port, color, routes[] }` |
| `/api/route/add` | POST | Add route: `{ appId, routeName }` |
| `/api/route` | DELETE | Delete route: `{ appId, routeName }` |
| `/api/build` | POST | Build plugin (SSE stream): `{ appId }` |
| `/api/snapshot` | POST | Take chunk snapshot: `{ appId }` |
| `/api/compare` | GET | Compare current vs snapshot: `?appId=sms` |
| `/api/deploy` | POST | Copy dist to deploys/: `{ appId }` |
| `/api/deploy/:appId/history` | GET | Deploy history |
| `/api/mock/auth/login` | POST | Mock login: `{ email, password }` |
| `/api/mock/auth/me` | GET | Get current user from Bearer token |
| `/api/mock/metrics` | GET/POST/PUT/DELETE | SMS system metrics |
| `/api/mock/alerts` | GET/POST/PUT/DELETE | SMS alerts |
| `/api/mock/checks` | GET/POST/PUT/DELETE | QCA check results |
| `/api/mock/rules` | GET/POST/PUT/DELETE | QCA rules |
| `/api/mock/articles` | GET/POST/PUT/DELETE | CMS articles |
| `/api/mock/assets` | GET/POST/PUT/DELETE | MAM media assets |
| `/api/mock/jobs` | GET/POST/PUT/DELETE | MAM transcoding jobs |
| `/api/mock/incidents` | GET/POST/PUT/DELETE | SMS incidents |
| `/api/mock/reset` | POST | Re-seed all mock data |
| `/api/generate/login` | POST | Generate login page |
| `/api/generate/crud` | POST | Generate CRUD pages |
| `/api/generate/tests` | POST | Generate Vitest tests |
| `/api/review` | POST | Run code review |
| `/api/restart-previews` | POST | Kill + restart preview servers |
| `/api/health` | GET | Health check |
| `/api/revision` | GET | Build revision (shell polls for hot reload) |
