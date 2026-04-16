import { useState, useEffect } from 'react';

interface RegEntry { id: string; label: string; url: string; }

const inputStyle = {
  width: '100%', padding: '8px 12px',
  background: 'var(--surface)', border: '1.5px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', fontSize: 12,
  fontFamily: 'var(--font-mono)', outline: 'none',
  boxSizing: 'border-box' as const,
};

const appColors: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#0D1B70', mam: '#F4511E',
};

function urlType(url: string): { label: string; color: string } {
  if (url.includes('localhost:4000')) return { label: 'Deployed', color: '#059669' };
  if (url.match(/localhost:300\d/)) return { label: 'Preview', color: '#546BE8' };
  return { label: 'Custom', color: '#D97706' };
}

export default function RegistryManager() {
  const [registry, setRegistry] = useState<RegEntry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/registry').then(r => r.json()).then(setRegistry).catch(console.error);
  }, []);

  async function handleSave(id: string) {
    setSaving(id);
    const res = await fetch(`/api/registry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: editUrl }),
    });
    const updated = await res.json();
    setRegistry(r => r.map(e => e.id === id ? { ...e, url: updated.url } : e));
    setEditing(null);
    setSaving(null);
  }

  function switchToDeployed(entry: RegEntry, version: string = 'v1') {
    setEditing(entry.id);
    setEditUrl(`http://localhost:4000/${entry.id}/${version}/assets/remoteEntry.js`);
  }

  function switchToPreview(entry: RegEntry, port: string) {
    setEditing(entry.id);
    setEditUrl(`http://localhost:${port}/assets/remoteEntry.js`);
  }

  const portMap: Record<string, string> = { sms: '3001', qca: '3002', cms: '3003', mam: '3004' };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Registry</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          The shell fetches this registry at runtime to know where each plugin lives
        </p>
      </div>

      {/* Explanation card */}
      <div style={{
        background: 'rgba(20,40,160,0.08)', borderRadius: 12, padding: '18px 22px',
        border: '1px solid rgba(20,40,160,0.2)', marginBottom: 28,
        display: 'flex', gap: 16, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>◈</span>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--signal)', marginBottom: 6 }}>How the Registry Works</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            The shell fetches this list on every page load from <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, color: 'var(--signal)' }}>http://localhost:5001/api/registry</code>.
            Each URL points to a plugin's <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, color: 'var(--signal)' }}>remoteEntry.js</code>.
            Change a URL here and the shell loads the new version on next refresh — <strong style={{ color: 'var(--text)' }}>zero downtime</strong>.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {registry.map(entry => {
          const color = appColors[entry.id] || '#546BE8';
          const isEditing = editing === entry.id;
          const { label: typeLabel, color: typeColor } = urlType(entry.url);

          return (
            <div key={entry.id} style={{
              background: 'var(--card)', borderRadius: 14,
              border: `1px solid ${isEditing ? color + '40' : 'var(--border)'}`,
              borderLeft: `4px solid ${color}`,
              padding: '20px 22px',
              transition: 'border-color 200ms ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                  background: color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, color,
                }}>{entry.id.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{entry.label}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: typeColor + '20', color: typeColor }}>
                    {typeLabel}
                  </span>
                </div>
                {!isEditing && (
                  <button onClick={() => { setEditing(entry.id); setEditUrl(entry.url); }} style={{
                    padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: 'var(--surface)', color: 'var(--muted)',
                    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>Edit URL</button>
                )}
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={inputStyle} value={editUrl} onChange={e => setEditUrl(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>Quick switch:</span>
                    <button onClick={() => switchToPreview(entry, portMap[entry.id] || '3001')} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: 'var(--signal-soft)', color: 'var(--signal)',
                      border: '1px solid #C7D2FE', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>← Preview ({portMap[entry.id] || '300x'})</button>
                    <button onClick={() => switchToDeployed(entry, 'v1')} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: 'var(--green-soft)', color: '#059669',
                      border: '1px solid #BBF7D0', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>→ Deployed (v1)</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleSave(entry.id)} disabled={saving === entry.id} style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: color, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-head)',
                    }}>{saving === entry.id ? 'Saving...' : 'Save & Apply'}</button>
                    <button onClick={() => setEditing(null)} style={{
                      padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'var(--surface)', color: 'var(--muted)',
                      border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {entry.url}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
