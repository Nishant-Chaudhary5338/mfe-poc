import { useState, useEffect } from 'react';
import { useDevAuth } from '../devAuth.tsx';
import type { DevUserRole } from '../devAuth.tsx';

interface AppEntry {
  id: string; label: string; url: string; port: string; built: boolean; routeCount: number;
}

const APP_COLORS: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#059669', mam: '#F4511E',
};
function getColor(id: string) { return APP_COLORS[id] || '#6366F1'; }

type Page = 'dashboard' | 'scaffold' | 'routes' | 'build' | 'registry' | 'deploy' | 'access' | 'present' | 'studio';

interface Props {
  onNavigate?: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { user } = useDevAuth();
  const [apps, setApps] = useState<AppEntry[]>([]);

  useEffect(() => {
    fetch('/api/apps').then(r => r.json()).then(setApps).catch(console.error);
  }, []);

  const builtCount   = apps.filter(a => a.built).length;
  const totalRoutes  = apps.reduce((s, a) => s + a.routeCount, 0);
  const allReady     = apps.length > 0 && builtCount === apps.length;

  return (
    <div style={{ maxWidth: 880 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3, fontWeight: 400 }}>
          {apps.length} registered plugins · {allReady ? 'All systems ready' : `${builtCount}/${apps.length} built`}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Plugins',       value: apps.length, icon: '🔌', color: 'var(--signal)', soft: 'var(--signal-soft)' },
          { label: 'Built & Ready', value: builtCount,  icon: '✅', color: 'var(--green)',  soft: 'var(--green-soft)' },
          { label: 'Total Routes',  value: totalRoutes, icon: '🗺️', color: 'var(--flame)',  soft: 'var(--flame-soft)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            padding: '20px 22px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 40, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.04em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          Quick Actions
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(user?.role === 'admin') && (
            <QuickBtn icon="＋" label="New Plugin" primary onClick={() => onNavigate?.('scaffold')} />
          )}
          <QuickBtn icon="◎" label="Build & Compare" onClick={() => onNavigate?.('build')} />
          <QuickBtn icon="≡" label="Registry"       onClick={() => onNavigate?.('registry')} />
          {(user?.role === 'admin' || user?.role === 'ops') && (
            <QuickBtn icon="🚀" label="Deploy"      onClick={() => onNavigate?.('deploy')} />
          )}
          <QuickBtn icon="▶" label="Present"        onClick={() => onNavigate?.('present')} />
        </div>
      </div>

      {/* Plugin list */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plugins</div>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{builtCount}/{apps.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {apps.map(app => {
          const color = getColor(app.id);
          const initials = app.id.toUpperCase().slice(0, 2);
          return (
            <div
              key={app.id}
              style={{
                background: 'var(--card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'box-shadow 150ms, border-color 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
            >
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 12, color: '#fff',
              }}>{initials}</div>

              {/* Name + status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <StatusPill built={app.built} />
                  <span style={{ fontSize: 10, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }} title={app.url}>:{app.port}</span>
                </div>
              </div>

              {/* Open button */}
              <a
                href={`http://localhost:${app.port}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  background: 'var(--signal-soft)', color: 'var(--signal)',
                  border: '1px solid var(--signal-border)',
                  flexShrink: 0, opacity: app.built ? 1 : 0.4,
                  pointerEvents: app.built ? 'auto' : 'none',
                  transition: 'background 120ms',
                }}
                title={app.built ? `Open ${app.label}` : 'Plugin not built yet'}
              >
                Open →
              </a>
            </div>
          );
        })}

        {apps.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 20px', color: 'var(--muted)', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔌</div>
            Loading plugins…
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ built }: { built: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: built ? '#DCFCE7' : '#FEF3C7',
      color: built ? '#15803D' : '#92400E',
      letterSpacing: '0.02em',
    }}>
      {built ? 'Ready' : 'Not built'}
    </span>
  );
}

function QuickBtn({ icon, label, primary, onClick }: { icon: string; label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 14px', borderRadius: 'var(--radius)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)', border: '1px solid',
        background: primary ? 'var(--signal)' : 'var(--card)',
        borderColor: primary ? 'var(--signal)' : 'var(--border)',
        color: primary ? '#fff' : 'var(--text-secondary)',
        boxShadow: primary ? '0 1px 4px rgba(20,40,160,.2)' : 'var(--shadow-xs)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </button>
  );
}
