import { useState, useEffect } from 'react';

interface AppEntry {
  id: string; label: string; url: string; port: string; built: boolean; routeCount: number;
}

const APP_COLORS: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#0D1B70', mam: '#F4511E',
};

function getColor(id: string) {
  return APP_COLORS[id] || '#6366F1';
}

export default function Dashboard() {
  const [apps, setApps] = useState<AppEntry[]>([]);

  useEffect(() => {
    fetch('/api/apps').then(r => r.json()).then(setApps).catch(console.error);
  }, []);

  const builtCount = apps.filter(a => a.built).length;
  const totalRoutes = apps.reduce((s, a) => s + a.routeCount, 0);

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Plugin Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, fontWeight: 400 }}>
          TVPlus Micro-Frontend Platform · {apps.length} registered plugins
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Active Plugins',  value: apps.length,  unit: 'plugins',  color: 'var(--signal)',  soft: 'var(--signal-soft)',  icon: '⬡' },
          { label: 'Built & Ready',   value: builtCount,   unit: 'built',    color: 'var(--green)',   soft: 'var(--green-soft)',   icon: '✓' },
          { label: 'Total Routes',    value: totalRoutes,  unit: 'routes',   color: 'var(--flame)',   soft: 'var(--flame-soft)',   icon: '⇄' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            padding: '20px 22px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: s.soft, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: s.color, flexShrink: 0, fontWeight: 700,
            }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MFE Architecture banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1428A0 0%, #0D1B70 100%)',
        borderRadius: 'var(--radius-lg)', padding: '16px 24px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 20,
        boxShadow: '0 4px 14px rgba(20,40,160,0.25)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
            Plugin MFE Architecture
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
            Each plugin is independently built, deployed and loaded at runtime via Module Federation
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
          {['Independent Build', 'Isolated Deploy', 'Runtime Load'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#60A5FA' : i === 1 ? '#34D399' : '#F4511E' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plugin grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Registered Plugins</h2>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{builtCount}/{apps.length} built</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {apps.map(app => {
          const color = getColor(app.id);
          return (
            <div key={app.id} style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              transition: 'box-shadow 150ms ease',
            }}>
              {/* Color bar */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)` }} />

              <div style={{ padding: '18px 20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                    background: color + '12',
                    border: `1.5px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 10,
                    color: color, letterSpacing: '0.06em',
                  }}>{app.id.toUpperCase().slice(0, 4)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.label}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>:{app.port}</span>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{app.routeCount} routes</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                    padding: '4px 9px', borderRadius: 20,
                    background: app.built ? 'var(--green-soft)' : 'var(--surface)',
                    border: `1px solid ${app.built ? '#BBF7D0' : 'var(--border)'}`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: app.built ? '#10B981' : '#CBD5E1', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: app.built ? '#059669' : 'var(--muted)', fontWeight: 600 }}>
                      {app.built ? 'Built' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* URL */}
                <div style={{
                  fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                  padding: '7px 10px', background: 'var(--surface)', borderRadius: 6,
                  border: '1px solid var(--border)', marginBottom: 12,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {app.url}
                </div>

                {/* Actions */}
                <a
                  href={`http://localhost:${app.port}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: color + '0D', color: color,
                    border: `1px solid ${color}25`, textDecoration: 'none',
                    transition: 'background 150ms ease',
                  }}
                >
                  Open Plugin
                  <span style={{ fontSize: 11 }}>↗</span>
                </a>
              </div>
            </div>
          );
        })}

        {apps.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 20px', color: 'var(--muted)', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
            Loading plugins...
          </div>
        )}
      </div>
    </div>
  );
}
