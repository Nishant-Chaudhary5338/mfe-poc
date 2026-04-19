import { useState, useEffect } from 'react';
import { DevAuthProvider, useDevAuth } from './devAuth.tsx';
import type { DevUserRole } from './devAuth.tsx';
import { ToastProvider } from './components/Toast.tsx';
import DevLogin from './pages/DevLogin.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Scaffold from './pages/Scaffold.tsx';
import RouteManager from './pages/RouteManager.tsx';
import BuildCompare from './pages/BuildCompare.tsx';
import RegistryManager from './pages/RegistryManager.tsx';
import Deploy from './pages/Deploy.tsx';
import Presentation from './pages/Presentation.tsx';
import AccessControl from './pages/AccessControl.tsx';
import Studio from './pages/Studio.tsx';
import Lighthouse from './pages/Lighthouse.tsx';

type Page = 'dashboard' | 'scaffold' | 'routes' | 'build' | 'registry' | 'deploy' | 'access' | 'present' | 'studio' | 'lighthouse';

const roleColors: Record<DevUserRole, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

const roleIcons: Record<DevUserRole, string> = {
  admin: '👑', ops: '⚙️', editor: '✏️', viewer: '👁️',
};

type NavItem = { id: Page; label: string; icon: string; roles?: DevUserRole[] };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Develop',
    items: [
      { id: 'dashboard', label: 'Dashboard',     icon: '▦' },
      { id: 'scaffold',  label: 'New Plugin',    icon: '+',  roles: ['admin'] },
      { id: 'routes',    label: 'Route Manager', icon: '⇄',  roles: ['admin', 'ops', 'editor'] },
      { id: 'studio',    label: 'Code Studio',   icon: '⚡', roles: ['admin', 'ops', 'editor'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'build',      label: 'Build & Compare', icon: '◎' },
      { id: 'lighthouse', label: 'Lighthouse',     icon: '🔦' },
      { id: 'deploy',     label: 'Deploy',         icon: '🚀', roles: ['admin', 'ops'] },
      { id: 'registry',   label: 'Registry',       icon: '≡',  roles: ['admin', 'ops', 'viewer'] },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'access',  label: 'Access Control', icon: '🔐', roles: ['admin'] },
      { id: 'present', label: 'Present',        icon: '▶' },
    ],
  },
];

const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap(g => g.items);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #F1F5F9; color: #0F172A; -webkit-font-smoothing: antialiased; }
  :root {
    --signal: #1428A0;
    --signal-soft: #EEF2FF;
    --signal-border: #1428A030;
    --flame: #F4511E;
    --flame-soft: #FEF2EE;
    --green: #10B981;
    --green-soft: #ECFDF5;
    --amber: #F59E0B;
    --amber-soft: #FFFBEB;
    --red: #EF4444;
    --red-soft: #FEF2F2;
    --bg: #F1F5F9;
    --surface: #F8FAFC;
    --card: #FFFFFF;
    --sidebar: #FFFFFF;
    --border: #E2E8F0;
    --border-strong: #CBD5E1;
    --text: #0F172A;
    --text-secondary: #334155;
    --muted: #64748B;
    --subtle: #94A3B8;
    --font-body: 'DM Sans', sans-serif;
    --font-head: 'Sora', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --shadow-xs: 0 1px 2px 0 rgba(0,0,0,0.05);
    --shadow-sm: 0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05);
    --radius: 10px;
    --radius-sm: 6px;
    --radius-lg: 14px;
  }
  input, button, select, textarea { font-family: var(--font-body); }
  input::placeholder { color: var(--subtle); }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  button { transition: filter 0.12s ease, transform 0.08s ease, box-shadow 0.15s ease; cursor: pointer; }
  button:hover:not(:disabled) { filter: brightness(1.07); }
  button:active:not(:disabled) { transform: scale(0.97); }
  button:disabled { cursor: not-allowed; opacity: 0.45; }
  input, select, textarea { transition: border-color 0.12s ease, box-shadow 0.12s ease; }
  input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--signal); outline-offset: 1px; border-color: var(--signal) !important;
  }
  a { transition: opacity 0.12s ease; }
`;

function AppInner() {
  const { user, loading, logout } = useDevAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [serverOk, setServerOk] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? setServerOk(true) : setServerOk(false))
      .catch(() => setServerOk(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const visible = ALL_ITEMS.filter(n => !n.roles || n.roles.includes(user.role));
    if (!visible.some(n => n.id === page)) setPage('dashboard');
  }, [user?.role]);

  const styleTag = <style>{css}</style>;

  if (loading) {
    return (
      <>
        {styleTag}
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--signal)', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Loading DevTools…</span>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        {styleTag}
        <DevLogin />
      </>
    );
  }

  if (page === 'present') {
    return (
      <>
        {styleTag}
        <Presentation onExit={() => setPage('dashboard')} />
      </>
    );
  }

  const roleColor = roleColors[user.role];
  const currentLabel = ALL_ITEMS.find(n => n.id === page)?.label ?? '';

  return (
    <>
      {styleTag}
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-body)', background: 'var(--bg)', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 224,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          {/* Brand */}
          <div style={{ padding: '20px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #1428A0 0%, #F4511E 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)' }}>TV</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  TV<span style={{ color: 'var(--flame)' }}>Plus</span>
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>DevTools</div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />

          {/* Grouped nav */}
          <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
            {NAV_GROUPS.map((group, gi) => {
              const visibleItems = group.items.filter(n => !n.roles || n.roles.includes(user.role));
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 4 : 0 }}>
                  {/* Section label */}
                  <div style={{
                    padding: '8px 10px 4px',
                    fontSize: 9.5, fontWeight: 700, color: 'var(--subtle)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>
                    {group.label}
                  </div>

                  {visibleItems.map(n => {
                    const active = page === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => setPage(n.id)}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                          background: active ? 'var(--signal-soft)' : 'transparent',
                          border: 'none',
                          borderLeft: active ? '2.5px solid var(--signal)' : '2.5px solid transparent',
                          color: active ? 'var(--signal)' : 'var(--muted)',
                          fontSize: 13, fontWeight: active ? 600 : 500,
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 120ms ease',
                          fontFamily: 'var(--font-body)',
                          filter: 'none', transform: 'none',
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 5, fontSize: 12,
                          background: active ? 'var(--signal)' : 'transparent',
                          color: active ? 'white' : 'var(--subtle)',
                          flexShrink: 0, fontWeight: 600,
                        }}>{n.icon}</span>
                        {n.label}
                        {n.id === 'present' && (
                          <span style={{
                            marginLeft: 'auto', fontSize: 8, fontWeight: 800, padding: '2px 5px',
                            borderRadius: 4, background: 'var(--flame)', color: 'white',
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                          }}>LIVE</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Divider between groups */}
                  {gi < NAV_GROUPS.length - 1 && (
                    <div style={{ height: 1, background: 'var(--border)', margin: '6px 10px' }} />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{
            padding: '12px 10px', borderTop: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* User chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 9px', borderRadius: 8,
              background: roleColor + '0C',
              border: `1px solid ${roleColor}22`,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: roleColor + '20',
                border: `1.5px solid ${roleColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>{roleIcons[user.role]}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name.split(' ')[0]}</div>
                <div style={{ fontSize: 9, color: roleColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{user.role}</div>
              </div>
              <button
                onClick={() => { logout().then(() => setPage('dashboard')); }}
                title="Sign out"
                style={{
                  padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', cursor: 'pointer', flexShrink: 0,
                  fontFamily: 'var(--font-body)', lineHeight: 1.4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.filter = 'none'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >Out</button>
            </div>

            {/* API status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: serverOk ? '#10B981' : '#EF4444',
                boxShadow: serverOk ? '0 0 0 2px #DCFCE7' : '0 0 0 2px #FEE2E2',
              }} />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                {serverOk ? 'API connected' : 'API offline'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>:5001</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          {/* Top bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(241,245,249,0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            padding: '0 32px', height: 48,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{currentLabel}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>TVPlus DevTools</span>
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '3px 9px',
              borderRadius: 20, background: roleColor + '14', color: roleColor,
              textTransform: 'uppercase', letterSpacing: '0.06em', border: `1px solid ${roleColor}30`,
            }}>{roleIcons[user.role]} {user.role}</span>
          </div>

          <div style={{ padding: '28px 32px', animation: 'fadeIn 180ms ease' }}>
            {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
            {page === 'scaffold'  && user.role === 'admin' && <Scaffold />}
            {page === 'routes'    && <RouteManager />}
            {page === 'build'     && <BuildCompare />}
            {page === 'registry'  && <RegistryManager />}
            {page === 'lighthouse' && <Lighthouse />}
            {page === 'deploy'    && <Deploy />}
            {page === 'access'    && user.role === 'admin' && <AccessControl />}
            {page === 'studio'    && <Studio />}
          </div>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <DevAuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </DevAuthProvider>
  );
}
