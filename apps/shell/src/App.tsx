import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@repo/auth';
import type { UserRole } from '@repo/auth';
import RemoteLoader from './RemoteLoader.tsx';
import LoginPage from './LoginPage.tsx';

export interface AppEntry {
  id: string;
  label: string;
  url: string;
  requiredRoles?: UserRole[];
  disabled?: boolean;
}

const appMeta: Record<string, { icon: string; desc: string; color: string }> = {
  sms: { icon: '💬', desc: 'Real-time infrastructure monitoring & alerting', color: '#1428A0' },
  qca: { icon: '✅', desc: 'Automated quality control pipeline', color: '#546BE8' },
  cms: { icon: '📝', desc: 'Programme & content publishing hub', color: '#0D1B70' },
  mam: { icon: '🗂️', desc: 'Media asset library & transcoding', color: '#F4511E' },
};

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

function Shell() {
  const { user, logout } = useAuth();
  const [registry, setRegistry] = useState<AppEntry[]>([]);
  const [activeApp, setActiveApp] = useState<AppEntry | null>(null);

  // Back-to-portal bridge for remotes
  useEffect(() => {
    (globalThis as any).__tvplus_goHome = () => setActiveApp(null);
  }, []);

  // DevTools hot-reload
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
    fetch('http://localhost:5001/api/registry')
      .catch(() => fetch('/registry.json'))
      .then(r => r.json())
      .then((data: AppEntry[]) => setRegistry(data))
      .catch(err => console.error('Failed to load registry:', err));
  }, []);

  if (!user) return <LoginPage />;

  const visibleApps = registry.filter(app =>
    !app.disabled &&
    (!app.requiredRoles?.length || app.requiredRoles.includes(user.role))
  );

  // Remote is active — full screen, no shell chrome
  if (activeApp) return <RemoteLoader key={activeApp.id} app={activeApp} />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#F1F5F9', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #1428A0, #091455)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 16 }}>📺</span>
          </div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
            TV<span style={{ color: '#F4511E' }}>Plus</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px 6px 8px', borderRadius: 20,
            background: '#F8FAFC', border: '1px solid #E2E8F0',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: (roleColors[user.role] ?? '#4A5170') + '20',
              border: `1px solid ${roleColors[user.role] ?? '#4A5170'}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}>
              {user.role === 'admin' ? '👑' : user.role === 'ops' ? '⚙️' : user.role === 'editor' ? '✏️' : '👁️'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>{user.name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: roleColors[user.role] ?? '#4A5170', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>{user.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'transparent', border: '1px solid #E2E8F0',
              color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Landing content */}
      <div style={{ padding: '40px 40px 60px' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {greeting}, {user.name.split(' ')[0]} 👋
          </div>
          <div style={{ fontSize: 15, color: '#64748B' }}>
            {visibleApps.length > 0
              ? `You have access to ${visibleApps.length} plugin${visibleApps.length !== 1 ? 's' : ''}`
              : 'No plugins assigned to your role'
            }
          </div>
        </div>

        {/* Plugin card grid */}
        {registry.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading registry...
          </div>
        ) : visibleApps.length === 0 ? (
          <div style={{
            padding: '32px 24px', borderRadius: 14, textAlign: 'center',
            background: '#FFFBEB', border: '1px solid #FDE68A',
            color: '#92400E', fontSize: 14,
          }}>
            No plugins are assigned to your role (<strong>{user.role}</strong>). Contact your admin.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, maxWidth: 900 }}>
            {visibleApps.map(app => {
              const meta = appMeta[app.id] ?? { icon: '📦', desc: '', color: '#546BE8' };
              return (
                <div
                  key={app.id}
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    borderTop: `3px solid ${meta.color}`,
                    padding: '24px 26px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, transform 0.12s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  onClick={() => setActiveApp(app)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${meta.color}18`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: meta.color + '14',
                      border: `1.5px solid ${meta.color}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>{meta.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{app.label}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{meta.desc}</div>
                    </div>
                  </div>

                  {/* Open button */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 9,
                    background: meta.color + '0A',
                    border: `1px solid ${meta.color}1E`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>Open plugin</span>
                    <span style={{ fontSize: 16, color: meta.color }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
