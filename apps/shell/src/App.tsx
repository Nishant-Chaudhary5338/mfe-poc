import { useState, useEffect } from 'react';
import Sidebar from './Sidebar.tsx';
import RemoteLoader from './RemoteLoader.tsx';

export interface AppEntry {
  id: string;
  label: string;
  url: string;
}

export default function App() {
  const [registry, setRegistry] = useState<AppEntry[]>([]);
  const [activeApp, setActiveApp] = useState<AppEntry | null>(null);

  useEffect(() => {
    let lastRevision = -1;
    const pollId = setInterval(async () => {
      try {
        const { revision } = await fetch('http://localhost:5001/api/revision').then(r => r.json());
        if (lastRevision === -1) { lastRevision = revision; return; }
        if (revision !== lastRevision) window.location.reload();
      } catch { /* DevTools not running */ }
    }, 3000);
    return () => clearInterval(pollId);
  }, []);

  useEffect(() => {
    console.log('Loading registry...');
    fetch((import.meta as any).env?.VITE_REGISTRY_URL ?? '/registry.json')
      .then((r) => r.json())
      .then((data: AppEntry[]) => {
        console.log(`Registry loaded: [${data.length} apps]`, data.map((a) => a.id));
        setRegistry(data);
      })
      .catch((err) => {
        console.error('Failed to load registry:', err);
      });
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        registry={registry}
        activeId={activeApp?.id}
        onSelect={(app) => {
          if (app.id !== activeApp?.id) {
            setActiveApp(app);
          }
        }}
      />

      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#f8fafc',
          minWidth: 0,
        }}
      >
        {activeApp ? (
          <RemoteLoader key={activeApp.id} app={activeApp} />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#94a3b8',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 48 }}>🧩</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>
              Micro-Frontend Shell
            </div>
            <div style={{ fontSize: 14 }}>
              Select an application from the sidebar to load it
            </div>
            {registry.length === 0 && (
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
                Loading registry...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
