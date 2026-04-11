import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import RemoteLoader from './RemoteLoader';

export default function App() {
  const [registry, setRegistry] = useState([]);
  const [activeApp, setActiveApp] = useState(null);

  useEffect(() => {
    console.log('Loading registry...');
    fetch('/registry.json')
      .then((r) => r.json())
      .then((data) => {
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
