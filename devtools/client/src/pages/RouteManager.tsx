import { useState, useEffect } from 'react';
import { useDevAuth } from '../devAuth.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useToast } from '../components/Toast.tsx';

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
  const [endpoint, setEndpoint] = useState('');
  const [columns, setColumns] = useState('');
  const [description, setDescription] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; routeFile?: string; path?: string; error?: string; generatedCode?: string; tableMode?: boolean } | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
      let parsedColumns: any[] | undefined;
      if (columns.trim()) {
        try { parsedColumns = JSON.parse(columns); }
        catch { toast.error('Invalid columns JSON', 'Check the Columns field format'); setLoading(false); return; }
      }
      const res = await fetch('/api/route/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp, name: routeName, path: routePath,
          endpoint: endpoint || undefined,
          columns: parsedColumns,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setExistingRoutes(r => [...r, routeName]);
        toast.success('Route added', `${routeName} added to ${selectedApp}`);
        setRouteName('');
        setRoutePath('');
        setEndpoint('');
        setColumns('');
        setDescription('');
        setShowCode(false);
      } else {
        toast.error('Failed to add route', data.error ?? 'Unknown error');
      }
    } catch (e) {
      setResult({ success: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(routeName: string) {
    setDeletingRoute(routeName);
    try {
      const res = await fetch('/api/route', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedApp, routeName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success('Route deleted', `${routeName} removed from ${selectedApp}`);
      setExistingRoutes(r => r.filter(x => x !== routeName));
    } catch (err) {
      toast.error('Delete failed', String(err));
    } finally {
      setDeletingRoute(null);
      setConfirmDelete(null);
    }
  }

  const toast = useToast();
  const { user } = useDevAuth();
  const isReadOnly = user?.role === 'viewer';
  const color = appColors[selectedApp] || '#546BE8';

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Route Manager</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Add new routes to existing plugins</p>
        </div>
        {isReadOnly && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔒 Read-only — cannot add routes
          </span>
        )}
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
                  <input style={inputStyle} placeholder="e.g. Articles" value={routeName} onChange={e => setRouteName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Route Path</label>
                  <input style={inputStyle} placeholder="/articles" value={routePath} onChange={e => setRoutePath(e.target.value)} />
                </div>

                {/* ── API Data Table (optional) ── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    API Data Table <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Endpoint URL</label>
                      <input style={inputStyle} placeholder="http://localhost:5001/api/mock/articles" value={endpoint} onChange={e => setEndpoint(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <input style={inputStyle} placeholder="Content articles with status and tags" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Columns (JSON)</label>
                      <textarea
                        style={{ ...inputStyle, height: 120, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.5 }}
                        placeholder={`[\n  { "key": "title", "label": "Title", "type": "text", "bold": true },\n  { "key": "status", "label": "Status", "type": "badge" },\n  { "key": "createdAt", "label": "Created", "type": "date" },\n  { "key": "tags", "label": "Tags", "type": "tags" }\n]`}
                        value={columns}
                        onChange={e => setColumns(e.target.value)}
                      />
                      <p style={{ fontSize: 10, color: 'var(--muted)', margin: '4px 0 0' }}>
                        types: <code style={{ fontFamily: 'var(--font-mono)' }}>text</code> · <code style={{ fontFamily: 'var(--font-mono)' }}>badge</code> · <code style={{ fontFamily: 'var(--font-mono)' }}>date</code> · <code style={{ fontFamily: 'var(--font-mono)' }}>tags</code>
                      </p>
                    </div>
                  </div>
                </div>

                <PermissionGate roles={['admin', 'ops', 'editor']} mode="disable" style={{ display: 'block' }}>
                  <button onClick={handleAdd} disabled={loading || !routeName} style={{
                    width: '100%', padding: '11px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: loading ? 'var(--border)' : color,
                    color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-head)',
                  }}>{loading ? 'Adding…' : endpoint ? 'Generate Table Route' : 'Add Route'}</button>
                </PermissionGate>
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
                  <div key={r} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 6px 4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: color + '15', color, border: `1px solid ${color}30`,
                  }}>
                    <span>{r}</span>
                    <PermissionGate roles={['admin', 'ops', 'editor']} mode="hide">
                      {confirmDelete === r ? (
                        <>
                          <span style={{ fontSize: 10, color: '#DC2626', marginLeft: 4 }}>Remove?</span>
                          <button
                            onClick={() => handleDelete(r)}
                            disabled={!!deletingRoute}
                            title="Confirm delete"
                            style={{ marginLeft: 2, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#DC2626', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >{deletingRoute === r ? '…' : '✓'}</button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            title="Cancel"
                            style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'var(--border)', color: 'var(--muted)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >✕</button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(r)}
                          title="Delete route"
                          style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'transparent', color: color, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.5, lineHeight: 1 }}
                        >×</button>
                      )}
                    </PermissionGate>
                  </div>
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
                <div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)', lineHeight: 1.8 }}>
                    <div style={{ color: '#059669' }}>+ {result.routeFile}</div>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>~ App.tsx patched — lazy import, NavLink, Route added</div>
                    <div style={{ color: 'var(--muted)' }}>~ Path: {result.path}</div>
                    {result.tableMode && <div style={{ color: '#059669', marginTop: 4 }}>⚡ Generated with API data table</div>}
                  </div>
                  {result.generatedCode && (
                    <div style={{ marginTop: 14 }}>
                      <button
                        onClick={() => setShowCode(v => !v)}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                          background: 'rgba(5,150,105,0.1)', color: '#059669',
                          border: '1px solid rgba(5,150,105,0.25)', cursor: 'pointer',
                        }}
                      >{showCode ? 'Hide generated code' : 'View generated code'}</button>
                      {showCode && (
                        <pre style={{
                          marginTop: 10, padding: 14, borderRadius: 8,
                          background: '#0D1020', color: '#A5F3FC',
                          fontSize: 10, lineHeight: 1.6, overflowX: 'auto',
                          fontFamily: 'var(--font-mono)', maxHeight: 420,
                          border: '1px solid rgba(165,243,252,0.12)',
                        }}>{result.generatedCode}</pre>
                      )}
                    </div>
                  )}
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
