# TVPlus MFE Platform

A production-grade **Micro-Frontend (MFE)** platform for TVPlus broadcast operations. The shell app loads independent plugin apps at runtime via **Module Federation v2**. Each plugin is a standalone React application with its own Redux store, RTK Query API layer, auth system, and Tailwind v4 design system.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Shell (port 3000)                                          │
│  React + @repo/auth + sessionStorage routing                │
│  Loads remotes dynamically via registry                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  RemoteLoader (native import() — not script tags)    │ │
│  │  ↓ import("http://localhost:3001/remoteEntry.js")    │ │
│  │  CSS auto-injects via vite-plugin-css-injected-by-js │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────┬──────────────┬──────────────┬───────────────┘
               │              │              │
    ┌──────────▼───┐  ┌───────▼──────┐  ┌───▼────────────┐
    │  SMS (3001)  │  │  QCA (3002)  │  │  MAM (3004)    │
    │  Dual Auth   │  │  Dual Auth   │  │  Shell Auth    │
    │  RTK: metrics│  │  RTK: checks │  │  RTK: assets   │
    │  Redux store │  │  Redux store │  │  No auth slice │
    └──────────────┘  └──────────────┘  └────────────────┘
               │
    ┌──────────▼──────────────┐
    │  DevTools (5001/5173)   │
    │  Build · Scaffold       │
    │  Compare chunks         │
    │  Mock API (all data)    │
    └─────────────────────────┘
```

---

## Apps

| App | Port | Auth Pattern | Data |
|---|---|---|---|
| Shell | 3000 | `@repo/auth` mock SSO | Registry, portal |
| SMS — Smart Monitoring | 3001 | Shell + own login | Metrics, alerts, incidents |
| QCA — QC Automation | 3002 | Shell + own login | QC checks, rules |
| CMS — Content Management | 3003 | Shell + own login | Articles, schedules |
| MAM — Media Assets | 3004 | **Shell auth only** | Assets, transcoding jobs |
| DevTools API | 5001 | None (dev only) | Mock data + build API |
| DevTools UI | 5173 | None (dev only) | Dashboard, scaffold, compare |

**Auth pattern explained:**
- *Shell + own login*: User logs into shell to see the app in portal (role-based access), then logs into the app to get its own API token. Two independent auth layers.
- *Shell auth only*: App reads the shell's auth token via `window.__tvplus_auth`. No own login form. Demonstrates the future SSO pattern.

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start everything
pnpm dev           # builds remotes → preview remotes → shell dev (HMR on shell)
pnpm devtools      # start DevTools API (5001) + UI (5173)

# 3. Open in browser
# Portal:   http://localhost:3000
# DevTools: http://localhost:5173
```

**Default users (mock SSO):**
- Nishant — admin (sees all 4 apps)
- Bob Ops — ops (SMS, QCA)
- Carol Editor — editor (CMS, MAM)
- Dave Viewer — viewer (all apps, read-only)

**App API password:** `password123` (for all mock users)

---

## Packages

| Package | Description |
|---|---|
| `@repo/auth` | AuthProvider, useAuth hook, RBAC, mock users, window bridge |
| `@repo/shared-ui` | shadcn CSS variables + 19 Radix UI components |
| `@repo/ui` | 48 pre-built components: Card, DataTable, Badge, Button, Dialog, etc. |
| `@repo/tailwind-config` | Signal & Flame design system: color scales, spacing tokens, typography |
| `@repo/typescript-config` | Shared TypeScript configs (base.json, vite.json) |

---

## Design System — Signal & Flame

```
Signal Blue (#1428A0) — primary brand, trust, Shell, SMS
Flame Orange (#F4511E) — energy, urgency, MAM, destructive
Purple (#546BE8)       — QCA accent
Dark Navy (#0D1B70)    — CMS accent, sidebar backgrounds

DM Sans  → body text
Sora     → headings, brand mark
DM Mono  → metrics, code, telemetry
```

Design tokens in `packages/tailwind-config/shared-styles.css`. Imported by every app via `src/index.css`.

---

## CSS Architecture

Tailwind v4 with cascade layers:

```
src/index.css → @import "tailwindcss"     ← utility generation
             → @import "@repo/tailwind-config"  ← Signal & Flame tokens
main.tsx     → import '@repo/shared-ui/styles.css'  ← shadcn variables
             → import '@repo/ui/styles.css'          ← component styles (remotes only)
```

**Critical**: Never add `* { padding: 0 }` to any `index.html`. Unlayered CSS overrides ALL Tailwind `@layer utilities` — this causes all spacing utilities (px-, py-, gap-) to compute to 0px. See `docs/TAILWIND-ARCHITECTURE.md`.

Remote CSS is injected automatically via `vite-plugin-css-injected-by-js` — no `<link>` tag needed in the shell.

---

## Key Commands

```bash
pnpm dev                        # dev environment (recommended)
pnpm dev:hmr                    # true HMR all apps (requires Console Ninja disabled)
pnpm build:mfe                  # build all remote plugins
pnpm --filter sms build         # build one plugin
pnpm devtools                   # DevTools API + UI
pnpm snapshot                   # snapshot chunk hashes
pnpm compare                    # compare chunks vs snapshot

# E2E testing
python tests/e2e/portal.test.py # Playwright test suite
pytest tests/e2e/portal.test.py -v  # with pytest
```

---

## DevTools

DevTools provides a web UI and REST API for:

- **Apps** — view all plugin apps and their status
- **New App** — scaffold a new remote plugin app (previously "New Plugin")
- **New Page** — add a new page/route to an existing app (previously "New Route")
- **Build & Compare** — build apps, take chunk snapshots, compare hashes between builds
- **Deploy** — deploy apps to the local deploys/ directory
- **Mock API** — live REST API for all app data (metrics, assets, articles, etc.)
- **Code Studio** — AI-powered code generation for login/form/detail/CRUD pages
- **Dev Login** — switch between mock users to test RBAC

**Chunk hash comparison** proves that adding/removing a page only changes that page's chunk — no other chunks are affected. Works with MF v2's 24-chunk output.

---

## Documentation

| Document | Contents |
|---|---|
| [docs/TAILWIND-ARCHITECTURE.md](docs/TAILWIND-ARCHITECTURE.md) | Complete Tailwind v4 pipeline, cascade layers, CSS injection in MFE, debugging guide |
| [docs/RTK-MFE-GUIDE.md](docs/RTK-MFE-GUIDE.md) | Redux Toolkit + RTK Query in MFE, dual auth tokens, store patterns, mock API |
| [docs/FEDERATION-GUIDE.md](docs/FEDERATION-GUIDE.md) | MF v2 internals, loading mechanism, build output, error reference, dev vs preview |
| [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) | Real app integration checklist, SSO, production deployment, cross-app communication |
| [docs/MFE-ARCHITECTURE.md](docs/MFE-ARCHITECTURE.md) | Original architecture reference |
| [.clinerules/project.md](.clinerules/project.md) | AI agent rules, critical gotchas, all patterns |
| [CLAUDE.md](CLAUDE.md) | Claude Code / Cline working instructions |

---

## E2E Tests

```
tests/e2e/
  portal.test.py   — Full Playwright test suite
  screenshots/     — Auto-generated during test runs
```

Tests cover: login page CSS, portal grid layout, remote app loading, CSS injection, dual auth pattern, MAM shell-auth-only, back-to-portal navigation, role-based app visibility.

**Run:**
```bash
pip install playwright && playwright install chromium
python tests/e2e/portal.test.py
```

---

## MF v2 Migration Notes

Migrated from `@originjs/vite-plugin-federation` (v1) to `@module-federation/vite` (v2):

| Change | Detail |
|---|---|
| Plugin import | `import { federation }` (named, not default) |
| remoteEntry.js | Now at `dist/remoteEntry.js` (not `dist/assets/`) |
| Loading mechanism | Native `import()` in RemoteLoader (not script tags) |
| CSS | Requires `vite-plugin-css-injected-by-js` for CSS injection |
| Dev mode | `pnpm dev:hmr` (turbo dev) — needs Console Ninja disabled |
| Runtime | Removed `@module-federation/runtime` from shell; use `import()` directly |

---

## Port Reference

| Service | Port | URL |
|---|---|---|
| Shell | 3000 | http://localhost:3000 |
| SMS remote | 3001 | http://localhost:3001/remoteEntry.js |
| QCA remote | 3002 | http://localhost:3002/remoteEntry.js |
| CMS remote | 3003 | http://localhost:3003/remoteEntry.js |
| MAM remote | 3004 | http://localhost:3004/remoteEntry.js |
| DevTools API | 5001 | http://localhost:5001/api/* |
| DevTools UI | 5173 | http://localhost:5173 |
