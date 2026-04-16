import { useState, useEffect } from 'react';

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface)', border: '1.5px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  fontFamily: 'var(--font-body)', outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontSize: 12, fontWeight: 600 as const, color: 'var(--muted)',
  display: 'block' as const, marginBottom: 6,
  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
};

const appColors: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#0D1B70', mam: '#F4511E',
};

export default function RouteManager() {
  const [apps, setApps] = useState<{ id: string; label: string }[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [existingRoutes, setExistingRoutes] = useState<string[]>([]);
  const [routeName, setRouteName] = useState('');
  const [routePath, setRoutePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; routeFile?: string; path?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch('/api/apps').then(r => r.json()).then(setApps).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedApp) { setExistingRoutes([]); return; }
    fetch(`/api/apps/${selectedApp}/routes`).then(r => r.json()).then(setExistingRoutes).catch(console.error);
    setResult(null);
  }, [selectedApp]);

  useEffect(() => {
    if (routeName) setRoutePath(`/${routeName.toLowerCase().replace(/\s+/g, '-')}`);
  }, [routeName]);

  async function handleAdd() {
    if (!selectedApp || !routeName) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/route/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedApp, name: routeName, path: routePath }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setExistingRoutes(r => [...r, routeName]);
        setRouteName('');
        setRoutePath('');
      }
    } catch (e) {
      setResult({ success: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  const color = appColors[selectedApp] || '#546BE8';

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Route Manager</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Add new routes to existing plugins</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* App selector */}
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Select Plugin</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {apps.map(a => {
                const c = appColors[a.id] || '#546BE8';
                const active = selectedApp === a.id;
                return (
                  <button key={a.id} onClick={() => setSelectedApp(a.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 10, border: `1.5px solid ${active ? c : 'var(--border)'}`,
                    background: active ? c + '15' : 'var(--surface)',
                    color: active ? 'var(--text)' : 'var(--muted)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 7, background: c + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 10, color: c,
                    }}>{a.id.toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{a.label}</span>
                    {active && <span style={{ marginLeft: 'auto', color: c, fontSize: 14 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add route form */}
          {selectedApp && (
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>New Route</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Route Name</label>
                  <input style={inputStyle} placeholder="e.g. Archive" value={routeName} onChange={e => setRouteName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Route Path</label>
                  <input style={inputStyle} placeholder="/archive" value={routePath} onChange={e => setRoutePath(e.target.value)} />
                </div>
                <button onClick={handleAdd} disabled={loading || !routeName} style={{
                  padding: '11px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: loading ? 'var(--border)' : color,
                  color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-head)',
                }}>{loading ? 'Adding...' : 'Add Route'}</button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedApp && (
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
                Existing Routes — {selectedApp.toUpperCase()}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {existingRoutes.map(r => (
                  <span key={r} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: color + '15', color: color, border: `1px solid ${color}30`,
                  }}>{r}</span>
                ))}
                {existingRoutes.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No routes found</p>}
              </div>
            </div>
          )}

          {result && (
            <div style={{
              background: result.success ? 'var(--green-soft)' : 'var(--red-soft)',
              borderRadius: 12, padding: 20,
              border: `1px solid ${result.success ? '#BBF7D0' : '#FECACA'}`,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: result.success ? 'var(--green)' : 'var(--red)', fontSize: 18 }}>{result.success ? '✓' : '✗'}</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: result.success ? '#059669' : '#DC2626' }}>
                  {result.success ? 'Route Added' : 'Error'}
                </span>
              </div>
              {result.success ? (
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)', lineHeight: 1.8 }}>
                  <div style={{ color: '#059669' }}>+ {result.routeFile}</div>
                  <div style={{ color: 'var(--muted)', marginTop: 4 }}>~ App.tsx patched — lazy import, NavLink, Route added</div>
                  <div style={{ color: 'var(--muted)' }}>~ Path: {result.path}</div>
                </div>
              ) : (
                <p style={{ color: '#DC2626', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{result.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
