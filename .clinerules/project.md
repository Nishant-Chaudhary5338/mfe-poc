# TVPlus Plugin-Based MFE — AI Context

**Repo type:** pnpm monorepo — `apps/`, `packages/`, `devtools/` as workspace packages (pnpm-workspace.yaml).

**Create a new plugin:** Follow the pattern in `apps/sms/`. Needs `package.json` (name: `<id>`), `vite.config.ts` (exposes `App` via `@originjs/vite-plugin-federation`), `src/App.tsx`, `src/routes/*.tsx`. Use port range 3001–3009.

**Register a plugin:** Add entry to `devtools/data/registry.json`: `{ "id": "<id>", "label": "<label>", "url": "http://localhost:<port>/assets/remoteEntry.js" }`. Shell fetches registry at runtime from `http://localhost:5001/api/registry` (env: `VITE_REGISTRY_URL`). Or use the DevTools Scaffold UI at http://localhost:5173.

**Shared packages:**
- `@repo/shared-ui` — `Card`, `Button`, `PageHeader` components (`packages/shared-ui/index.ts`)

**Design tokens:** Signal Blue `#1428A0`, Flame Orange `#F4511E`, neutral bg `#070910`, card `#1E2235`. Fonts: DM Sans (body), Sora (headings), DM Mono (code). CSS vars defined in `devtools/client/index.html`.

**DevTools backend:** Express API on port 5001 (`devtools/server.js`). Routes: `/api/registry` (CRUD), `/api/apps`, `/api/scaffold`, `/api/route/add`, `/api/build` (SSE), `/api/snapshot`, `/api/compare`, `/api/health`.

**DevTools frontend:** React/Vite at port 5173 (`devtools/client/`). Vite proxies `/api/*` → 5001.

**Shell:** `apps/shell` at port 3000. Remote MFEs lazy-loaded via Module Federation at runtime — not bundled into the shell. Each app exposes a single `App` component via `remoteEntry.js`.

**Run everything:** `pnpm devtools` (DevTools), `pnpm dev` (shell + all remotes preview).
