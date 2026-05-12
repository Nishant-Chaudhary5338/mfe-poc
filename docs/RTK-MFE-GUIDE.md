# Redux Toolkit + RTK Query in MFE
# ====================================
# How Redux and RTK Query work across Module Federation boundaries,
# the dual-auth token injection pattern, and extension guides.

---

## Architecture: One Store Per Remote

In this MFE architecture, each remote app has its **own, isolated Redux store**. Stores are NEVER shared between remotes or with the shell.

```
shell (port 3000)
  ├── @repo/auth AuthProvider  ← only auth context, no Redux
  └── sessionStorage for active app state

sms (port 3001)
  └── store/
      ├── authSlice   (sms token + user)
      └── smsApi      (metrics, alerts)

qca (port 3002)
  └── store/
      ├── authSlice   (qca token + user)
      └── qcaApi      (checks, rules)

cms (port 3003)
  └── store/
      ├── authSlice   (cms token + user)
      └── cmsApi      (articles)

mam (port 3004)
  └── store/
      └── mamApi      (assets, jobs — no auth slice, uses shell bridge)
```

**Why isolated stores?**
- No shared-state conflicts between teams
- Each remote builds and deploys independently
- React rendering trees stay clean (one Provider per remote)
- Avoids complex Redux singleton coordination in MF shared modules

---

## Store Structure — SMS/QCA/CMS Pattern (Dual Auth)

### `apps/sms/src/store/index.ts`

```ts
import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authReducer from './authSlice'
import { smsApi } from './api'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [smsApi.reducerPath]: smsApi.reducer,
  },
  middleware: gDM => gDM().concat(smsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

### `apps/sms/src/store/authSlice.ts`

```ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const TOKEN_KEY = 'sms_auth_token'  // app-specific key, never conflicts with shell

export interface AppUser { id: string; name: string; email: string; role: string }

interface AuthState {
  user: AppUser | null
  token: string | null  // app's own API token (separate from shell token)
  loading: boolean
  error: string | null
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5001/api/mock/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return rejectWithValue(((await res.json()).error) ?? 'Login failed')
    const data = await res.json() as { token: string; user: AppUser }
    localStorage.setItem(TOKEN_KEY, data.token)
    return data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem(TOKEN_KEY),  // rehydrate from localStorage on init
    loading: false,
    error: null,
  } as AuthState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem(TOKEN_KEY)
    },
  },
  extraReducers: b => b
    .addCase(loginAsync.pending,   s => { s.loading = true; s.error = null })
    .addCase(loginAsync.fulfilled, (s, { payload }) => {
      s.loading = false; s.user = payload.user; s.token = payload.token
    })
    .addCase(loginAsync.rejected,  (s, { payload }) => {
      s.loading = false; s.error = payload as string
    }),
})

export const { logout } = authSlice.actions
export default authSlice.reducer
```

### `apps/sms/src/store/api.ts`

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from './index'

// Type definitions for API responses
export interface Metric {
  id: string; service: string; region: string
  cpu: number; memory: number; latencyMs: number; uptime: number; status: string
}
export interface Alert {
  id: string; rule: string; service: string
  severity: string; firedAt: string; status: string
}

export const smsApi = createApi({
  reducerPath: 'smsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    // ─── Token injection: dual-layer auth ─────────────────────────────
    prepareHeaders: (headers, { getState }) => {
      // Priority 1: App's own token (from SMS login form)
      const appToken = (getState() as RootState).auth.token

      // Priority 2: Shell bridge token (window.__tvplus_auth set by AuthProvider)
      // Used as fallback — allows API calls even before app-level login
      const shellToken = (globalThis as any).__tvplus_auth?.token

      const token = appToken || shellToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Metric', 'Alert'],
  endpoints: builder => ({
    getMetrics: builder.query<Metric[], void>({
      query: () => '/api/mock/metrics',
      providesTags: ['Metric'],
    }),
    getAlerts: builder.query<Alert[], void>({
      query: () => '/api/mock/alerts',
      providesTags: ['Alert'],
    }),
    // Optimistic update example
    updateMetricStatus: builder.mutation<Metric, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/mock/metrics/${id}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Metric'],
    }),
  }),
})

export const {
  useGetMetricsQuery,
  useGetAlertsQuery,
  useUpdateMetricStatusMutation,
} = smsApi
```

---

## MAM Pattern — Shell Auth Only (No authSlice)

MAM demonstrates the "trust the shell" pattern. No own login, no authSlice:

```ts
// apps/mam/src/store/api.ts
export const mamApi = createApi({
  reducerPath: 'mamApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    prepareHeaders: headers => {
      // MAM only reads from shell bridge — no own token
      const token = (globalThis as any).__tvplus_auth?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  ...
})
```

```ts
// apps/mam/src/store/index.ts — no authReducer
export const store = configureStore({
  reducer: { [mamApi.reducerPath]: mamApi.reducer },
  middleware: gDM => gDM().concat(mamApi.middleware),
})
```

```tsx
// apps/mam/src/App.tsx — reads shell user via window bridge
import { useAuth } from '@repo/auth'

function AppShell() {
  const { user } = useAuth()  // fallback reads window.__tvplus_auth
  if (!user) return <PortalGateScreen />
  return <Dashboard />        // no own login form
}
```

---

## How Token Bridging Works

The shell's `AuthProvider` (in `packages/auth/src/context.tsx`) keeps a window bridge in sync:

```ts
// In AuthProvider
useEffect(() => {
  (globalThis as any).__tvplus_auth = { user, token }
}, [user, token])
```

When `useAuth()` is called in a remote app with no AuthProvider in its React tree:

```ts
// packages/auth/src/context.tsx — useAuth fallback
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (ctx) return ctx  // has AuthProvider (standalone mode)

  // No context (loaded inside shell as MFE) — read from bridge
  const bridged = (globalThis as any).__tvplus_auth
  if (!bridged) throw new Error('useAuth: AuthProvider not mounted and no auth bridge found')
  return {
    user: bridged.user,
    token: bridged.token,
    login: () => {},    // no-op (can't log into shell from remote)
    logout: () => {},   // no-op
    hasRole: (...roles) => !!bridged.user && roles.includes(bridged.user.role),
  }
}
```

This is why MAM can call `useAuth()` and get the shell user without having its own AuthProvider.

---

## Using RTK Query in Components

### Basic query with loading state

```tsx
import { Skeleton, Card, CardContent } from '@repo/ui'
import { useGetMetricsQuery, type Metric } from '../store/api'
import type { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<Metric>[] = [
  { accessorKey: 'service',   header: 'Service' },
  { accessorKey: 'latencyMs', header: 'Latency', cell: ({ getValue }) => `${getValue()}ms` },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string
      return <Badge variant={s === 'healthy' ? 'default' : 'destructive'}>{s}</Badge>
    },
  },
]

export default function Dashboard() {
  const { data: metrics = [], isLoading, isError, error } = useGetMetricsQuery()

  if (isError) return <ErrorDisplay message={(error as any)?.data?.error ?? 'Failed to load'} />
  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <DataTable
      columns={columns}
      data={metrics}
      features={{ sorting: true, globalFilter: true, hoverable: true }}
    />
  )
}
```

### Mutation with optimistic update

```tsx
import { useUpdateMetricStatusMutation } from '../store/api'

function StatusToggle({ metricId, currentStatus }: { metricId: string; currentStatus: string }) {
  const [updateStatus, { isLoading }] = useUpdateMetricStatusMutation()

  return (
    <Button
      size="sm"
      disabled={isLoading}
      onClick={() => updateStatus({ id: metricId, status: 'healthy' })}
    >
      {isLoading ? 'Updating...' : 'Mark Healthy'}
    </Button>
  )
}
```

### Polling for live data

```tsx
// Auto-refresh every 30 seconds
const { data: metrics = [] } = useGetMetricsQuery(undefined, {
  pollingInterval: 30_000,
})
```

### Conditional query (only fetch when authenticated)

```tsx
const token = useAppSelector(s => s.auth.token)
const { data } = useGetMetricsQuery(undefined, {
  skip: !token,  // don't fetch if not logged in
})
```

---

## Adding New Endpoints

### In `store/api.ts`

```ts
export interface NewEntity {
  id: string
  name: string
  // ...fields
}

// Add to endpoints builder
endpoints: builder => ({
  // existing endpoints...

  // New query
  getEntities: builder.query<NewEntity[], void>({
    query: () => '/api/mock/entities',
    providesTags: ['Entity'],
  }),

  // New mutation
  createEntity: builder.mutation<NewEntity, Partial<NewEntity>>({
    query: body => ({ url: '/api/mock/entities', method: 'POST', body }),
    invalidatesTags: ['Entity'],
  }),

  // Query with arguments
  getEntityById: builder.query<NewEntity, string>({
    query: id => `/api/mock/entities/${id}`,
  }),
}),
```

Add `'Entity'` to `tagTypes: ['Entity', ...]`.

### In `devtools/server.js` — Add mock data

```js
// In seedMockData() function
entities: [
  { id: 'e1', name: 'Entity One', status: 'active' },
  { id: 'e2', name: 'Entity Two', status: 'inactive' },
],
```

```js
// After mockCrud() calls
mockCrud(app, '/api/mock/entities', () => mockDb.entities)
```

---

## Redux DevTools Integration

In development, the Redux DevTools browser extension works for each remote app independently. Each remote's store is isolated, so you'll see separate Redux DevTools instances when inspecting different apps.

To connect to a specific remote's Redux DevTools, the remote must be running in standalone mode (direct URL, not through the shell). When loaded inside the shell, Redux DevTools may show the active remote's store depending on which tab is focused.

---

## Future: Cross-Remote Communication

Currently remotes don't communicate with each other. For future cross-remote communication:

### Option 1: Window event bus (simple)

```ts
// In SMS (sender)
window.dispatchEvent(new CustomEvent('tvplus:alert-acknowledged', {
  detail: { alertId: 'al1' }
}))

// In Shell or another remote (listener)
window.addEventListener('tvplus:alert-acknowledged', (e: CustomEvent) => {
  console.log('Alert acknowledged:', e.detail.alertId)
})
```

### Option 2: Shared RTK Query via Module Federation shared modules

Declare `@reduxjs/toolkit` and `react-redux` as shared singletons:

```ts
// In each app's vite.config.ts shared config
shared: {
  '@reduxjs/toolkit': { singleton: true, eager: false },
  'react-redux': { singleton: true, eager: false },
}
```

Then share a store factory module as an exposed federation module.

### Option 3: window.__tvplus global state bus (recommended for TVPlus)

```ts
// Expand the existing bridge in AuthProvider
(globalThis as any).__tvplus = {
  auth: { user, token, refresh: refreshToken },
  events: new EventTarget(),  // typed event bus
  state: {                    // shared read-only state
    activeApp: null as string | null,
  }
}
```

This is Phase 2 of the auth bridge work (already planned).

---

## RTK Query + Mock API Contract

All mock data endpoints follow the same contract:

```
GET    /api/mock/{resource}       → items[]
GET    /api/mock/{resource}/:id   → item
POST   /api/mock/{resource}       → newItem (201)
PUT    /api/mock/{resource}/:id   → updatedItem
DELETE /api/mock/{resource}/:id   → (204)
```

Query string filtering: `GET /api/mock/metrics?status=critical` filters by exact field match.

Mock auth:
- POST `/api/mock/auth/login` → `{ token, user }` (password: `password123` for all)
- GET  `/api/mock/auth/me`    → `{ user }` (requires Bearer token)
- POST `/api/mock/reset`      → re-seeds all mock data

---

## Performance Considerations

### Avoid large bundles in shared modules

If you add a heavy library (e.g., chart.js, d3), declare it as NOT shared:
```ts
// vite.config.ts — don't share heavy libraries
shared: {
  react: { singleton: true, eager: true },
  // chart.js NOT listed — each remote bundles its own copy
}
```

### RTK Query deduplication

RTK Query deduplicates in-flight requests automatically. If two components call `useGetMetricsQuery()` simultaneously, only one network request is made.

### Cache invalidation strategy

For the mock API, use aggressive invalidation during development:
```ts
// In api.ts — force refetch on any mutation
createEntity: builder.mutation({
  query: body => ({ url: '/api/mock/entities', method: 'POST', body }),
  invalidatesTags: ['Entity'],  // invalidates all Entity queries
})
```

For production, use selective tag invalidation:
```ts
invalidatesTags: (result, error, arg) => [{ type: 'Entity', id: arg.id }]
```
