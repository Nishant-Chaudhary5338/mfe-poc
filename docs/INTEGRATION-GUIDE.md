# Integration Guide — From POC to Production
# =============================================
# Future complex integration patterns, production deployment,
# real app integration checklist, and advanced MFE patterns.

---

## Integrating a Real App as a Remote

### Checklist: What a real app needs to become an MFE remote

A standalone React + Vite + TypeScript app needs these additions:

**Package.json changes:**
```json
"devDependencies": {
  "@module-federation/vite": "^1.15.4",
  "vite-plugin-css-injected-by-js": "^3.x",
  "@repo/tailwind-config": "workspace:*",
  "@tailwindcss/vite": "^4.1.5"
}
```

**vite.config.ts additions:**
```ts
import { federation } from '@module-federation/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

plugins: [
  cssInjectedByJsPlugin(),  // FIRST
  // ... existing plugins
  federation({
    name: 'yourapp',
    filename: 'remoteEntry.js',
    exposes: { './App': './src/App.tsx' },
    shared: {
      react:               { singleton: true, eager: true, requiredVersion: false },
      'react-dom':         { singleton: true, eager: true, requiredVersion: false },
      'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: false },
      'react-router-dom':  { singleton: true, requiredVersion: false },
    },
  }),
],
build: { target: 'esnext', minify: false, cssCodeSplit: false },
base: 'http://localhost:YOURPORT/',
```

**New files to create:**
```
src/index.css       ← @import "tailwindcss"; @import "@repo/tailwind-config";
```

**main.tsx changes:**
```ts
import './index.css';           // ADD as first import
import '@repo/shared-ui/styles.css';  // ADD second
```

**index.html — REMOVE:**
```html
<!-- Remove this if it exists: -->
<style>* { padding: 0; margin: 0; }</style>
```

**App.tsx — ADD back-to-portal button:**
```tsx
<button onClick={() => (globalThis as any).__tvplus_goHome?.()}>
  ← Back to Portal
</button>
```

**Registry update:**
```json
{ "id": "yourapp", "url": "http://localhost:YOURPORT/remoteEntry.js" }
```

### Handling the real app's auth system

**Option 1 (current, dual auth)**: App keeps its own login form.
- Shell login → portal access (role-based)
- App login → app's API token
- Both tokens stored independently in localStorage

**Option 2 (future, SSO)**: Shell passes token to app.
```ts
// In shell App.tsx — set auth in bridge
(globalThis as any).__tvplus_auth = { user, token, apiToken }

// In real app — read from bridge instead of showing login
const shellAuth = (globalThis as any).__tvplus_auth
if (shellAuth?.token) {
  // Use shellAuth.token for API calls, skip login
} else {
  // Show app's own login
}
```

**Option 3 (ideal, shared auth backend)**: Same auth backend, token reuse.
- Shell authenticates with backend → gets JWT
- Real app accepts same JWT for its APIs
- Token passed via `window.__tvplus_auth` bridge
- No second login needed

### Handling RTK Query in a real app

If the real app has its own RTK Query setup:
1. Keep it as-is — each remote has its own RTK instance, no conflicts
2. The `prepareHeaders` needs to read auth from the correct source
3. No need to share RTK Query state with the shell

```ts
// Real app api.ts — read token from own Redux store OR shell bridge
prepareHeaders: (headers, { getState }) => {
  const ownToken   = (getState() as RootState).auth.token   // own login
  const shellToken = (globalThis as any).__tvplus_auth?.token // shell bridge
  const token = ownToken || shellToken
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}
```

---

## Production Deployment

### Environment-based URLs

All hardcoded `http://localhost:*` URLs must become environment variables:

**In each app's vite.config.ts:**
```ts
// Replace hardcoded base URL
base: process.env.VITE_APP_BASE_URL || 'http://localhost:3001/',
```

**In store/api.ts:**
```ts
baseQuery: fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
})
```

**In devtools/data/registry.json — use env-specific files:**
```
registry.dev.json   → localhost URLs
registry.staging.json → https://staging-cdn.tvplus.com/...
registry.prod.json  → https://cdn.tvplus.com/...
```

### CDN Deployment Pattern

Each remote app's `dist/` is an independent deployment unit:

```bash
# Build
pnpm --filter sms build
# → dist/remoteEntry.js (128KB, CSS inlined)
# → dist/assets/*.js (app chunks)

# Deploy to CDN
aws s3 sync apps/sms/dist/ s3://tvplus-cdn/apps/sms/ --delete
# → https://cdn.tvplus.com/apps/sms/remoteEntry.js

# Update registry (production)
curl -X PUT https://registry.tvplus.com/api/v1/apps/sms \
  -d '{"url": "https://cdn.tvplus.com/apps/sms/remoteEntry.js"}'

# Shell picks up new version on next page load — no shell redeploy needed
```

### CI/CD Per App

Each remote has its own pipeline:

```yaml
# .github/workflows/sms.yml
name: SMS Deploy
on:
  push:
    paths: ['apps/sms/**', 'packages/shared-ui/**']

jobs:
  deploy:
    steps:
      - pnpm --filter sms build
      - Upload dist/ to CDN
      - Verify remoteEntry.js accessible (curl check)
      - Update registry URL
      - Notify shell (webhook or registry poll)
```

### Registry as a Service

For production, the registry needs to be a versioned service (not a static JSON file):

```ts
// Registry API spec
GET  /api/v1/registry              → current registry (all apps)
GET  /api/v1/registry/:id          → single app entry
PUT  /api/v1/registry/:id          → update app URL (requires deploy token)
POST /api/v1/registry/:id/rollback → revert to previous URL
GET  /api/v1/registry/:id/history  → deployment history
```

The shell already polls `http://localhost:5001/api/registry` which can be swapped
for a production registry service without any shell code changes.

---

## SSO Token Bridging (Phase 2)

The current auth bridge (`window.__tvplus_auth`) carries the shell's mock JWT.
In production, expand it to full SSO:

### Shell AuthProvider update

```ts
// packages/auth/src/context.tsx
useEffect(() => {
  (globalThis as any).__tvplus_auth = {
    user,
    token,               // shell JWT (mock or real)
    refresh: async () => {
      // Refresh shell token
      const newToken = await refreshShellToken()
      setToken(newToken)
      return newToken
    },
    headers: {           // ready-to-use headers for fetch calls
      Authorization: `Bearer ${token}`
    }
  }
}, [user, token])
```

### Remote app reading the bridge

```ts
// In any remote — read shell token with refresh support
const bridge = (globalThis as any).__tvplus_auth

if (!bridge?.token) {
  // Not loaded inside shell — use own auth
  return showOwnLogin()
}

// Use shell token directly
const response = await fetch('/api/data', {
  headers: bridge.headers   // includes Authorization header
})

// If token expired, refresh via bridge
if (response.status === 401) {
  const newToken = await bridge.refresh()
  // retry with new token
}
```

---

## Cross-App Communication

### Event Bus Pattern (Recommended)

```ts
// packages/auth/src/bridge.ts — or any shared package
export const TVPlusBus = {
  emit<T>(event: string, detail: T) {
    window.dispatchEvent(new CustomEvent(`tvplus:${event}`, { detail }))
  },
  on<T>(event: string, handler: (detail: T) => void) {
    const listener = (e: Event) => handler((e as CustomEvent<T>).detail)
    window.addEventListener(`tvplus:${event}`, listener)
    return () => window.removeEventListener(`tvplus:${event}`, listener)
  }
}

// Usage in SMS:
TVPlusBus.emit('incident-created', { id: 'i7', severity: 'critical' })

// Usage in Shell (notification badge):
TVPlusBus.on('incident-created', ({ id, severity }) => {
  setBadgeCount(prev => prev + 1)
})
```

### Shared State via window.__tvplus

```ts
// Expand bridge for cross-app read-only state
(globalThis as any).__tvplus = {
  auth: { ... },
  state: {
    activeApp: appId,        // which app is currently showing
    notifications: 0,        // unread notification count
    userPreferences: {},     // user settings
  },
  actions: {
    goHome: () => { ... },   // navigate to portal
    openApp: (id) => { ... },// open specific app
    notify: (msg) => { ... } // show shell notification
  }
}
```

---

## Advanced MFE Patterns

### Lazy Sidebar (load remote just for nav info)

Instead of loading the full remote to show a nav item, expose a lightweight manifest:

```ts
// In a remote's vite.config.ts
exposes: {
  './App': './src/App.tsx',
  './manifest': './src/manifest.ts',  // lightweight metadata
}

// manifest.ts
export default {
  label: 'Smart Monitoring',
  icon: '💬',
  color: '#1428A0',
  routes: ['/dashboard', '/alerts', '/incidents'],
  requiredPermissions: ['monitoring:read'],
}
```

Shell loads manifests eagerly, full app lazily.

### Multi-Shell Architecture

Multiple shells can consume the same remotes:

```
Portal Shell (staff dashboard) → SMS, QCA, CMS, MAM
Admin Shell (admin panel)      → SMS, QCA, MAM, DevTools
Mobile Shell (React Native web) → SMS (mobile view), MAM
```

Each shell has its own registry. Remotes expose multiple views:

```ts
exposes: {
  './App': './src/App.tsx',           // full desktop app
  './MobileApp': './src/MobileApp.tsx', // mobile-optimized view
  './Widget': './src/Widget.tsx',     // embeddable widget
}
```

### Remote-to-Remote Communication

If SMS needs to open MAM to show an asset:

```ts
// In SMS component
const openAsset = (assetId: string) => {
  // Option A: Event bus (decoupled)
  TVPlusBus.emit('open-asset', { assetId })
  // Shell listens, opens MAM, MAM listens for the event

  // Option B: Shell bridge action (direct)
  (globalThis as any).__tvplus?.actions?.openApp('mam', { assetId })
}
```

Shell handles the routing between apps. Remotes never directly import each other.

### Versioned Remote Loading

For zero-downtime deployments, load a specific version:

```json
// Registry with version
{
  "id": "sms",
  "url": "https://cdn.tvplus.com/apps/sms/v2.4.1/remoteEntry.js",
  "version": "2.4.1",
  "previousUrl": "https://cdn.tvplus.com/apps/sms/v2.3.0/remoteEntry.js"
}
```

Shell can implement A/B testing or gradual rollout by choosing which URL to load per user.

---

## Performance Optimization

### Bundle size in remote apps

The biggest bundles are `api-XXX.js` (~1.4MB uncompressed) containing RTK + @repo/ui.
For production:

```ts
// Option 1: Share @repo/ui (all remotes share one copy)
shared: {
  '@repo/ui': { singleton: true, requiredVersion: false },
}
// Risk: version mismatches if remotes update at different times

// Option 2: Split @repo/ui components into separate chunks
// In vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'ui-table': ['@repo/ui/DataTable'],  // only if chunk comparison allows it
      }
    }
  }
}
// Note: manualChunks breaks chunk hash comparison — use carefully
```

### Preloading critical remotes

```ts
// In shell App.tsx — preload the user's most-likely apps
useEffect(() => {
  if (!user) return
  const topApps = visibleApps.slice(0, 2)
  topApps.forEach(app => {
    // Warm the network cache for remoteEntry.js
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = app.url
    document.head.appendChild(link)
  })
}, [visibleApps])
```

### CDN caching strategy

```
remoteEntry.js    → max-age=60   (short cache, checked often for updates)
assets/*.js       → max-age=31536000 (1 year, hash in filename guarantees uniqueness)
assets/*.css      → N/A (CSS is inlined into JS now)
```

---

## Security Considerations

### Content Security Policy (CSP)

When loading scripts from multiple origins, CSP must whitelist them:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.tvplus.com;
  connect-src 'self' https://api.tvplus.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
```

`'unsafe-inline'` is needed for CSS injection (the `<style>` tags from `vite-plugin-css-injected-by-js`). Alternative: use nonce-based CSP.

### CORS Configuration

Remote preview/prod servers need CORS headers:

```
Access-Control-Allow-Origin: https://shell.tvplus.com
Access-Control-Allow-Methods: GET
Cross-Origin-Resource-Policy: cross-origin
```

### Token Security

Current implementation uses localStorage for tokens (convenient for dev).
Production should consider:
- HttpOnly cookies for shell auth (XSS-resistant)
- Memory-only storage for app tokens (clears on page reload)
- Token encryption/signing with proper JWT library

---

## Monitoring and Observability

### Error tracking per remote

```ts
// In RemoteLoader.tsx — tag errors with remote context
import * as Sentry from '@sentry/react'

.catch((err: unknown) => {
  Sentry.captureException(err, {
    tags: { remote_id: app.id, remote_url: app.url },
    extra: { registry_entry: app }
  })
  setError(message)
})
```

### Performance tracking

```ts
// Track remote load time
const startTime = performance.now()
const RemoteApp = await loadRemoteApp(app.id, app.url)
const loadTime = performance.now() - startTime
analytics.track('remote_loaded', { appId: app.id, loadTimeMs: loadTime })
```

### Remote version tracking

```ts
// Log which version of each remote the user is running
console.log(`[Shell] Loaded ${app.id} from ${app.url} at ${new Date().toISOString()}`)
// In production: send to analytics/logging service
```
