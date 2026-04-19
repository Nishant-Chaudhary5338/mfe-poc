# TVPlus Plugin MFE — Project Reference

## What This Project Is
Micro-Frontend POC for TVPlus. Shell app loads remote plugins at runtime via Vite Module Federation. Each plugin is independently built, served, and deployed. DevTools provides a web UI + API for scaffolding, building, comparing, and code generation.

---

## Monorepo Layout

```
apps/
  shell/          port 3000 — host app, loads remotes via registry
  sms/            port 3001 — Smart Monitoring System
  qca/            port 3002 — QC Automation
  cms/            port 3003 — Content Management System
  mam/            port 3004 — Media Asset Management
packages/
  shared-ui/      @repo/shared-ui — 19 Radix UI + Tailwind components
  auth/           @repo/auth — AuthProvider, useAuth, RBAC, mock users
  utils/          @repo/utils — string, validation, error helpers
devtools/
  server.js       Express API on port 5001
  client/         Vite React UI on port 5173
  generators/     Code generation modules (login/form/detail/list/crud/tests)
  data/
    registry.json Source of truth for plugin registry (dev)
  mcp-server.js   MCP server — 10 tools for Cline integration
```

---

## Key Commands

```bash
pnpm install                          # install all workspaces
pnpm dev                              # build remotes + preview remotes + dev shell
pnpm build:mfe                        # build all remote plugins
pnpm --filter sms build               # build one plugin
pnpm devtools                         # start DevTools API (5001) + UI (5173)
pnpm --filter devtools-client dev     # DevTools UI only
node devtools/server.js               # DevTools API only (does not hot-reload)
```

---

## Architecture Rules (never violate)

- NEVER run `vite dev` on remote plugins — must `vite build` first, then `vite preview`
- NEVER add `manualChunks` to any vite.config.ts — breaks chunk hash comparison
- NEVER hardcode plugin lists — always read from `/api/apps` or `registry.json`
- React, ReactDOM, react-router-dom, @repo/auth are shared singletons — declared in every vite.config.ts `shared` block
- Remotes must be built before the shell can consume them (Module Federation requirement)

---

## Shared Packages

### @repo/shared-ui (`packages/shared-ui/`)
19 components: Alert, AutoForm, Badge, Button, Card, Checkbox, DataTable, Dialog, Form, Input, Label, Pagination, RadioGroup, Select, Separator, Skeleton, Switch, Table, Textarea
- Import: `import { Button, Card, DataTable } from '@repo/shared-ui'`
- Styles: each app imports `import '@repo/shared-ui/styles.css'` in main.tsx
- No build step needed — consumed directly via workspace link

### @repo/auth (`packages/auth/`)
- `AuthProvider` — wraps shell App.tsx, provides auth context across federation boundary
- `useAuth()` — returns `{ user, login, logout, hasRole }`
- `UserRole`: `'admin' | 'ops' | 'editor' | 'viewer'`
- Mock users: Nishant (admin), Bob (ops), Carol (editor), Dave (viewer)
- Token: base64 JSON in localStorage key `tvplus_auth_token`
- RBAC: registry entries have `requiredRoles[]`, shell filters `visibleApps` before rendering
- Declared as shared singleton in every vite.config.ts

### @repo/utils (`packages/utils/`)
- String helpers, API helpers, Zod validation utilities, pagination, error handling

---

## Plugin Registry

`devtools/data/registry.json` — source of truth in dev. Structure:
```json
[
  {
    "id": "sms",
    "label": "Smart Monitoring System",
    "url": "http://localhost:3001/assets/remoteEntry.js",
    "requiredRoles": ["admin", "viewer", "ops"],
    "disabled": false
  }
]
```
Shell fetches from `http://localhost:5001/api/registry` at runtime (fallback: `/registry.json`).
Changing `url` redirects shell to a different build instantly — no shell redeploy needed.

---

## Adding a Route Manually

1. Create `apps/<id>/src/routes/<Name>.tsx`
2. In `apps/<id>/src/App.tsx` add:
   ```tsx
   const Name = lazy(() => import('./routes/Name.tsx'));
   // in nav: <NavLink to="/name">Name</NavLink>
   // in routes: <Route path="/name" element={<Suspense fallback={...}><Name /></Suspense>} />
   ```
3. `pnpm --filter <id> build`

---

## Adding a Plugin Manually

1. Copy `apps/sms/` to `apps/<newid>/`
2. Update `apps/<newid>/vite.config.ts`: change `name`, `base`, `server.port`, `preview.port`
3. Update `apps/<newid>/package.json`: set `"name": "<newid>"`
4. Add to `devtools/data/registry.json` and `apps/shell/public/registry.json`
5. `pnpm install && pnpm --filter <newid> build`

Or use DevTools UI → New Plugin (scaffolds automatically).

---

## DevTools API Reference (port 5001)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/registry` | GET | Get all plugins |
| `/api/registry` | PUT | Update full registry |
| `/api/apps` | GET | Get apps with build status + route count |
| `/api/scaffold` | POST | Create new plugin: `{ id, label, port, color, routes[] }` |
| `/api/route/add` | POST | Add route to plugin: `{ appId, routeName }` |
| `/api/build` | POST | Build plugin (SSE stream): `{ appId }` |
| `/api/snapshot` | POST | Take chunk snapshot: `{ appId }` |
| `/api/compare` | POST | Compare current vs snapshot: `{ appId }` |
| `/api/deploy` | POST | Copy dist to deploys/: `{ appId }` |
| `/api/deploy/:appId/history` | GET | Deploy history |
| `/api/generate/login` | POST | Generate login page |
| `/api/generate/form` | POST | Generate form page |
| `/api/generate/detail` | POST | Generate detail page |
| `/api/generate/crud` | POST | Generate full CRUD (4 pages) |
| `/api/generate/tests` | POST | Generate Vitest tests |
| `/api/review` | POST | Run code review + grade |
| `/api/restart-previews` | POST | Kill + restart all vite preview processes |
| `/api/health` | GET | Health check |

---

## DevTools UI Pages (port 5173)

- **Dashboard** — overview, plugin status
- **Registry Manager** — edit plugin URLs, enable/disable
- **Route Manager** — add routes to plugins via UI
- **Build & Compare** — build plugins, snapshot, compare chunk hashes
- **Deploy** — build + deploy plugins, restart previews
- **Access Control** — manage RBAC roles per plugin
- **Code Studio** — generate login/form/detail/CRUD pages, run code review
- **Lighthouse** — performance audits per plugin
- **Dev Login** — switch between mock users for testing RBAC

---

## Code Generation (devtools/generators/)

Generates production-ready pages using @repo/shared-ui + Tailwind CSS v4.

```js
// POST /api/generate/crud
{
  "appId": "sms",
  "resource": "Alert",
  "endpoint": "/api/alerts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "severity", "type": "select", "options": ["low","medium","high"] }
  ]
}
```

Generators: `generators/templates/login.js`, `form.js`, `detail.js`, `list.js`, `crud.js`, `tests.js`
Utils: `generators/utils.js` — `cap()`, `appMeta()`, `patchAppTsx()`, `writeRouteFile()`, `fieldToZod()`

---

## MCP Server (devtools/mcp-server.js)

10 tools available to Cline:
`list_plugins`, `scaffold_plugin`, `add_route`, `generate_login`, `generate_form`, `generate_detail`, `generate_crud`, `generate_tests`, `run_review`, `build_plugin`

Cline registration (VS Code settings.json):
```json
"cline.mcpServers": {
  "tvplus-devtools": {
    "command": "node",
    "args": ["devtools/mcp-server.js"],
    "cwd": "/Users/nishantchaudhary/Developer/mfe-poc"
  }
}
```

---

## Design Tokens

- Signal Blue: `#1428A0` (primary brand)
- Flame Orange: `#F4511E` (accent)
- Dark bg: `#070910`, card bg: `#1E2235`
- Fonts: DM Sans (body), Sora (headings), DM Mono (code)
- CSS vars defined in `devtools/client/index.html`
- All generated pages use Tailwind CSS v4 + @repo/shared-ui components

---

## Chunk Hash Comparison — How It Works

DevTools compares builds using content-MD5, not filename hashes.
- Strips 8-char Vite hash suffixes before hashing: `Dashboard-Xq55Gds7.js` → `Dashboard.js`
- Prevents hash chaining (where one changed chunk cascades into unrelated chunks)
- Implemented in `md5Dir()` and `normalizeChunkName()` in `devtools/server.js`
- "Unchanged" chunks = zero re-testing needed after deploy
