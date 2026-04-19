import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@repo/auth';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

const COLOR = '#F4511E';
const COLOR_DARK = '#7C2006';

const Library     = lazy(() => import('./routes/Library.tsx'));
const Uploads     = lazy(() => import('./routes/Uploads.tsx'));
const Transcoding = lazy(() => import('./routes/Transcoding.tsx'));
const Details = lazy(() => import('./routes/details.tsx'));
const Metadata    = lazy(() => import('./routes/Metadata.tsx'));
const Settings    = lazy(() => import('./routes/Settings.tsx'));

const navItems = [
  { path: '/',            label: 'Library',     icon: '🗂️', end: true  },
  { path: '/uploads',     label: 'Uploads',     icon: '⬆️', end: false },
  { path: '/transcoding', label: 'Transcoding', icon: '🔄', end: false },
  { path: '/metadata',    label: 'Metadata',    icon: '🏷️', end: false },
  { path: '/settings',    label: 'Settings',    icon: '⚙️', end: false },
  { path: '/details', label: 'Details', icon: '📄', end: false },
];

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('MAM — Media Asset Management mounted');
    return () => console.log('MAM unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Sidebar */}
        <nav style={{ width: 220, background: COLOR_DARK, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 10,
                color: 'white', letterSpacing: '0.08em', flexShrink: 0,
              }}>MAM</div>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Media Assets</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>TVPlus Platform</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {navItems.map(item => (
              <NavLink key={item.path} to={item.path} end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', textDecoration: 'none',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${COLOR}` : '3px solid transparent',
                  fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.12s',
                })}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: (roleColors[user.role] ?? '#4A5170') + '28',
                  border: `1px solid ${roleColors[user.role] ?? '#4A5170'}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}>
                  {user.role === 'admin' ? '👑' : user.role === 'ops' ? '⚙️' : user.role === 'editor' ? '✏️' : '👁️'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: roleColors[user.role] ?? '#4A5170', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{user.role}</div>
                </div>
              </div>
            )}
            <button
              onClick={() => (globalThis as any).__tvplus_goHome?.()}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >← Portal</button>
          </div>
        </nav>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            background: 'white', borderBottom: '1px solid #E2E8F0',
            padding: '0 24px', height: 52,
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>12,847 assets · 48.2 TB</span>
            <div style={{ marginLeft: 'auto' }}>
              {user && <span style={{ fontSize: 12, color: '#475569', background: '#F1F5F9', padding: '3px 10px', borderRadius: 12 }}>👤 {user.name}</span>}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: '#F7F8FC', padding: 28 }}>
            <Suspense fallback={<div style={{ color: '#8C94B0', fontSize: 14, padding: 20 }}>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Library />} />
                <Route path="/uploads" element={<Uploads />} />
                <Route path="/transcoding" element={<Transcoding />} />
                <Route path="/metadata" element={<Metadata />} />
                <Route path="/settings" element={<Settings />} />
                            <Route path="/details" element={<Details />} />
            </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
