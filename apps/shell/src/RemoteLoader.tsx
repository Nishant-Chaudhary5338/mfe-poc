import { useState, useEffect, useRef, ComponentType } from 'react';
import {
  __federation_method_setRemote,
  __federation_method_ensure,
  __federation_method_getRemote,
  __federation_method_unwrapDefault,
} from '__federation__';
import { AppEntry } from './App.tsx';

async function loadRemoteApp(id: string, url: string): Promise<ComponentType> {
  __federation_method_setRemote(id, { url, format: 'esm', from: 'vite' });
  await __federation_method_ensure(id);
  const module = await __federation_method_getRemote(id, './App');
  return __federation_method_unwrapDefault(module) as ComponentType;
}

interface RemoteLoaderProps {
  app: AppEntry;
}

export default function RemoteLoader({ app }: RemoteLoaderProps) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!app || loadedRef.current === app.id) return;

    setComponent(null);
    setError(null);
    setLoading(true);
    loadedRef.current = app.id;

    console.log(`User clicked ${app.label} — fetching remoteEntry from ${app.url}`);

    loadRemoteApp(app.id, app.url)
      .then((RemoteApp) => {
        setComponent(() => RemoteApp);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Failed to load remote ${app.id}:`, err);
        setError(message);
        setLoading(false);
      });
  }, [app]);

  if (loading) {
    return (
      <div
        style={{
          padding: 48,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: '2px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Loading {app.label}...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: 20,
            maxWidth: 500,
          }}
        >
          <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>
            Failed to load {app.label}
          </div>
          <div style={{ fontSize: 13, color: '#ef4444', fontFamily: 'monospace' }}>{error}</div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
            Make sure the remote is running and <code>remoteEntry.js</code> is accessible at{' '}
            <code>{app.url}</code>
          </div>
        </div>
      </div>
    );
  }

  if (!Component) return null;

  return <Component />;
}
