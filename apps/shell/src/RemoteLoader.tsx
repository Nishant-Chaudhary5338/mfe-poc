import { useState, useEffect, useRef, type ComponentType } from 'react';
import type { AppEntry } from './App.tsx';

interface MFContainer {
  init: (scope: Record<string, unknown>) => void | Promise<void>;
  get: (module: string) => Promise<() => { default: ComponentType }>;
}

const containerCache = new Map<string, MFContainer>();

async function loadRemoteApp(id: string, url: string): Promise<ComponentType> {
  // Re-use already-loaded containers
  if (containerCache.has(id)) {
    const cached = containerCache.get(id)!;
    const factory = await cached.get('./App');
    const mod = factory();
    if (!mod?.default) throw new Error(`Remote "${id}" has no default export`);
    return mod.default;
  }

  // Load remoteEntry.js as an ES module — works cross-origin with CORS headers
  // Cache-bust to pick up fresh builds when devtools rebuilds a remote
  const container = await (
    import(/* @vite-ignore */ `${url}?_t=${Date.now()}`)
  ) as MFContainer;

  if (typeof container.get !== 'function') {
    throw new Error(`Remote "${id}" remoteEntry does not expose a valid MF container`);
  }

  // Initialize shared scope (empty — shared modules handled at build time via vite plugin)
  try { await container.init({}); } catch { /* already initialized */ }

  containerCache.set(id, container);

  const factory = await container.get('./App');
  const mod = factory();
  if (!mod?.default) throw new Error(`Remote "${id}" has no default export`);
  return mod.default;
}

interface RemoteLoaderProps {
  app: AppEntry;
  appColor?: string;
}

export default function RemoteLoader({ app }: RemoteLoaderProps) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!app || loadedRef.current === app.id) return;

    setComponent(null);
    setError(null);
    setLoading(true);
    loadedRef.current = app.id;

    console.log(`[Shell] Loading remote "${app.label}" from ${app.url}`);

    loadRemoteApp(app.id, app.url)
      .then(RemoteApp => {
        setComponent(() => RemoteApp);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Shell] Failed to load remote ${app.id}:`, err);
        setError(message);
        setLoading(false);
      });
  }, [app]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-3 bg-slate-50 text-slate-400 font-sans">
        <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#1428A0]" />
        <span className="text-sm">Loading {app.label}…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-start justify-center bg-slate-50 pt-20 font-sans">
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="mb-2 font-semibold text-red-700">Failed to load {app.label}</p>
          <p className="font-mono text-sm text-red-500 break-words">{error}</p>
          <p className="mt-4 text-sm text-slate-500">
            Make sure the remote is running at{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{app.url}</code>
          </p>
          <button
            onClick={() => {
              loadedRef.current = null;
              containerCache.delete(app.id);
              setLoading(true);
              setError(null);
            }}
            className="mt-4 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!Component) return null;
  return <Component />;
}
