# Session Behaviour & Dev Rules

## Session Start
- At the START of every session, call the memory tool to search for context about this project
- Search for: project structure, mfe patterns, devtools, auth, recent decisions
- Before reading a file you've read in a previous session, check memory first
- Save key decisions, patterns, and architectural changes to memory after significant tasks

## Token Saving
- Do not read a file unless directly needed for the current task
- Do not explore directory trees unless asked
- Prefer targeted reads (specific line ranges) over reading entire files
- Use memory context instead of re-reading files already seen this session

---

## Dev Rules

### Code Style
- Use TypeScript strict — no `any`, no implicit returns on functions that should return a value
- All new components use `@repo/shared-ui` components — never raw HTML inputs, buttons, or tables
- All styles use Tailwind CSS v4 utility classes — no inline `style={{}}` blobs in new code
- DevTools UI exception: existing DevTools pages use inline styles (CSS vars pattern) — match that pattern when editing them, don't mix Tailwind into DevTools UI

### Components & Pages
- Generated pages (login/form/detail/crud) must use `@repo/shared-ui` + Zod validation — no exceptions
- Use `AutoForm` from shared-ui for forms whenever possible — it handles Zod schema → form fields automatically
- Use `DataTable` from shared-ui for lists — it handles sort/filter/pagination
- New routes in plugins must follow the lazy import pattern: `const Page = lazy(() => import('./routes/Page.tsx'))`

### Auth & RBAC
- Never hardcode role checks — always use `useAuth()` and `hasRole()` from `@repo/auth`
- New pages that require a role must be gated with the registry `requiredRoles` array — not just in-component checks
- The `AuthProvider` lives in the shell only — plugins get auth context via the shared singleton

### DevTools Server
- `devtools/server.js` does NOT hot-reload — always restart after changes: `node devtools/server.js`
- All new API endpoints must stream logs via SSE when triggering builds — follow the existing `/api/build` pattern
- Never hardcode app IDs in server.js — always read from `devtools/data/registry.json`

### Module Federation
- Every new package shared across shell and plugins must be added to the `shared` block in ALL vite.config.ts files
- New shared packages must have `singleton: true` to prevent duplicate instances across the federation boundary
- After adding a shared package, rebuild all remotes: `pnpm build:mfe`

### Git & Files
- Never commit `dist/`, `deploys/`, `scripts/snapshot-*.json` — they are gitignored
- Never commit `devtools/data/dev-session.json`, `memory.json`, `.claude/` — local only
- `.clinerules/` IS committed — it's the project context for Cline at the office
- `devtools/data/registry.json` IS committed — it's the source of truth for plugin config

### Adding Features
- New DevTools UI pages go in `devtools/client/src/pages/` and must be registered in `devtools/client/src/App.tsx` (Page type + NAV array + render switch)
- New generator templates go in `devtools/generators/templates/` and must be exported from `devtools/generators/index.js`
- New MCP tools go in `devtools/mcp-server.js` — follow the existing tool registration pattern

### What NOT to Do
- Do NOT run `vite dev` on remote plugins (sms/qca/cms/mam) — only `vite build` + `vite preview`
- Do NOT add `manualChunks` to any vite.config.ts — it breaks the chunk hash comparison system
- Do NOT hardcode plugin/app lists anywhere — always read from `/api/apps` or `registry.json`
- Do NOT create new shared components outside `packages/shared-ui/` — that's the single source of truth
- Do NOT use `console.log` in production code — use proper error boundaries or toast notifications
