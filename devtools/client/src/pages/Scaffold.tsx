import { useState } from 'react';

interface RouteRow { name: string; path: string; }

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface)', border: '1.5px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  fontFamily: 'var(--font-body)', outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontSize: 12, fontWeight: 600 as const,
  color: 'var(--muted)', display: 'block' as const,
  marginBottom: 6, textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

export default function Scaffold() {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [port, setPort] = useState('3005');
  const [color, setColor] = useState('#1428A0');
  const [routes, setRoutes] = useState<RouteRow[]>([{ name: 'Home', path: '/' }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; files?: string[]; error?: string } | null>(null);

  function addRoute() {
    setRoutes(r => [...r, { name: '', path: '' }]);
  }

  function removeRoute(i: number) {
    setRoutes(r => r.filter((_, idx) => idx !== i));
  }

  function updateRoute(i: number, field: keyof RouteRow, val: string) {
    setRoutes(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }

  async function handleCreate() {
    console.log('[Scaffold] handleCreate fired', { id, label, port, color, routes });
    if (!id || !label || !port) {
      console.warn('[Scaffold] blocked by validation', { id, label, port });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      console.log('[Scaffold] fetching /api/scaffold...');
      const res = await fetch('/api/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label, port: Number(port), color, routes }),
      });
      console.log('[Scaffold] response status:', res.status);
      const data = await res.json();
      console.log('[Scaffold] response data:', data);
      setResult(data);
    } catch (e) {
      console.error('[Scaffold] fetch error:', e);
      setResult({ success: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  const previewFiles = id ? [
    `apps/${id}/package.json`,
    `apps/${id}/vite.config.ts`,
    `apps/${id}/tsconfig.json`,
    `apps/${id}/index.html`,
    `apps/${id}/src/main.tsx`,
    `apps/${id}/src/App.tsx`,
    ...routes.filter(r => r.name).map(r => `apps/${id}/src/routes/${r.name}.tsx`),
  ] : [];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>New Plugin</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Scaffold a new micro-frontend plugin in under 60 seconds</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Plugin Config</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>App ID (slug)</label>
                <input style={inputStyle} placeholder="e.g. notifications" value={id} onChange={e => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
              </div>
              <div>
                <label style={labelStyle}>Display Label</label>
                <input style={inputStyle} placeholder="e.g. Notifications" value={label} onChange={e => setLabel(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Port</label>
                  <input style={inputStyle} type="number" value={port} onChange={e => setPort(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Brand Color</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                      style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                    <input style={{ ...inputStyle, width: 'auto', flex: 1 }} value={color} onChange={e => setColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Routes */}
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Initial Routes</h2>
              <button onClick={addRoute} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(20,40,160,0.2)', color: '#AAB5F7',
                border: '1px solid rgba(20,40,160,0.4)', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>+ Add Route</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {routes.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Name (e.g. Dashboard)" value={r.name}
                    onChange={e => updateRoute(i, 'name', e.target.value)} />
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Path (e.g. /dashboard)" value={r.path}
                    onChange={e => updateRoute(i, 'path', e.target.value)} />
                  {i > 0 && (
                    <button onClick={() => removeRoute(i)} style={{
                      width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)',
                      background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 16,
                      flexShrink: 0,
                    }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {(!id || !label) && (
            <div style={{ fontSize: 12, color: '#fbbf24', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}>
              Fill in App ID and Display Label to continue
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={loading || !id || !label}
            style={{
              padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: (loading || !id || !label) ? 'var(--border)' : 'linear-gradient(135deg, #1428A0 0%, #F4511E 100%)',
              color: (loading || !id || !label) ? 'var(--muted)' : 'white',
              border: 'none', cursor: (loading || !id || !label) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-head)', letterSpacing: '0.02em', opacity: (!id || !label) ? 0.5 : 1,
            }}
          >{loading ? 'Creating Plugin...' : 'Create Plugin'}</button>
        </div>

        {/* Preview / Result */}
        <div>
          {!result ? (
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Files to Create</h2>
              {previewFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {previewFiles.map(f => (
                    <div key={f} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                      background: 'var(--surface)', borderRadius: 6, fontFamily: 'var(--font-mono)',
                      fontSize: 12, color: 'var(--muted)',
                    }}>
                      <span style={{ color: '#4ade80' }}>+</span> {f}
                    </div>
                  ))}
                  <div style={{
                    marginTop: 8, padding: '7px 12px',
                    background: 'rgba(20,40,160,0.1)', borderRadius: 6, fontFamily: 'var(--font-mono)',
                    fontSize: 12, color: '#AAB5F7',
                  }}>+ registry.json entry</div>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>Fill in the App ID to preview files</p>
              )}
            </div>
          ) : (
            <div style={{
              background: result.success ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
              borderRadius: 12, padding: 24,
              border: `1px solid ${result.success ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{result.success ? '✓' : '✗'}</span>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: result.success ? '#4ade80' : '#f87171', margin: 0 }}>
                  {result.success ? 'Plugin Created!' : 'Error'}
                </h2>
              </div>
              {result.success && result.files ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {result.files.map(f => (
                    <div key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#4ade80', padding: '4px 10px', background: 'rgba(74,222,128,0.05)', borderRadius: 5 }}>✓ {f}</div>
                  ))}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#AAB5F7', padding: '4px 10px', background: 'rgba(20,40,160,0.1)', borderRadius: 5, marginTop: 4 }}>✓ registry.json updated</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>Run <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4 }}>pnpm install</code> then <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4 }}>pnpm --filter {id} build</code></p>
                </div>
              ) : (
                <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{result.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
