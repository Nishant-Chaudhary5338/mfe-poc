import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.tsx';
import Scaffold from './pages/Scaffold.tsx';
import RouteManager from './pages/RouteManager.tsx';
import BuildCompare from './pages/BuildCompare.tsx';
import RegistryManager from './pages/RegistryManager.tsx';
import Presentation from './pages/Presentation.tsx';

type Page = 'dashboard' | 'scaffold' | 'routes' | 'build' | 'registry' | 'present';

const NAV: { id: Page; label: string; icon: string; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard',     icon: '▦',  desc: 'Overview' },
  { id: 'scaffold',  label: 'New Plugin',    icon: '+',  desc: 'Scaffold' },
  { id: 'routes',    label: 'Route Manager', icon: '⇄',  desc: 'Routes' },
  { id: 'build',     label: 'Build & Compare',icon: '◎', desc: 'Diff' },
  { id: 'registry',  label: 'Registry',      icon: '≡',  desc: 'Config' },
  { id: 'present',   label: 'Present',       icon: '▶',  desc: 'Demo' },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #F1F5F9; color: #0F172A; -webkit-font-smoothing: antialiased; }
  :root {
    --signal: #1428A0;
    --signal-soft: #EEF2FF;
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
`;

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [serverOk, setServerOk] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? setServerOk(true) : setServerOk(false))
      .catch(() => setServerOk(false));
  }, []);

  if (page === 'present') {
    return (
      <>
        <style>{css}</style>
        <Presentation onExit={() => setPage('dashboard')} />
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-body)', background: 'var(--bg)', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 220,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: '1px 0 0 var(--border)',
        }}>
          {/* Brand */}
          <div style={{ padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #1428A0 0%, #F4511E 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-head)' }}>TV</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  TV<span style={{ color: 'var(--flame)' }}>Plus</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>DevTools</div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV.map(n => {
              const active = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 'var(--radius-sm)',
                    background: active ? 'var(--signal-soft)' : 'transparent',
                    border: 'none',
                    borderLeft: active ? '3px solid var(--signal)' : '3px solid transparent',
                    color: active ? 'var(--signal)' : 'var(--muted)',
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 120ms ease',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 5, fontSize: 13,
                    background: active ? 'var(--signal)' : 'transparent',
                    color: active ? 'white' : 'var(--subtle)',
                    flexShrink: 0,
                    fontWeight: 600,
                  }}>{n.icon}</span>
                  {n.label}
                  {n.id === 'present' && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 5px',
                      borderRadius: 4, background: 'var(--flame)', color: 'white',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>LIVE</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
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
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          {/* Top bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(241,245,249,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            padding: '0 32px', height: 52,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
              {NAV.find(n => n.id === page)?.label}
            </span>
          </div>

          <div style={{ padding: '28px 32px', animation: 'fadeIn 180ms ease' }}>
            {page === 'dashboard' && <Dashboard />}
            {page === 'scaffold'  && <Scaffold />}
            {page === 'routes'    && <RouteManager />}
            {page === 'build'     && <BuildCompare />}
            {page === 'registry'  && <RegistryManager />}
          </div>
        </main>
      </div>
    </>
  );
}
