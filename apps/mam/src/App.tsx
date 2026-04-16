import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import type { CSSProperties } from 'react';

const COLOR = '#F4511E';
const COLOR_DARK = '#7C2006';

const Library = lazy(() => import('./routes/Library.tsx'));
const Uploads = lazy(() => import('./routes/Uploads.tsx'));
const Transcoding = lazy(() => import('./routes/Transcoding.tsx'));
const Metadata = lazy(() => import('./routes/Metadata.tsx'));
const Settings = lazy(() => import('./routes/Settings.tsx'));

function tab(isActive: boolean): CSSProperties {
  return {
    padding: '7px 18px',
    borderRadius: 20,
    background: isActive ? COLOR : 'transparent',
    color: isActive ? 'white' : '#4A5170',
    border: `1.5px solid ${isActive ? COLOR : '#D6D9E8'}`,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    display: 'inline-block',
    letterSpacing: '0.01em',
  };
}

export default function App() {
  useEffect(() => {
    console.log('MAM — Media Asset Management mounted');
    return () => console.log('MAM unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F7F8FC', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${COLOR} 0%, ${COLOR_DARK} 100%)`,
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 11,
            color: 'white', letterSpacing: '0.08em', flexShrink: 0,
          }}>MAM</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Media Asset Management
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 400 }}>
              TVPlus Content Operations · Asset Library
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>12,847 assets · 48.2 TB</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 28px',
          borderBottom: '1px solid #D6D9E8',
          background: 'white',
        }}>
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Library</NavLink>
          <NavLink to="/uploads" style={({ isActive }) => tab(isActive)}>Uploads</NavLink>
          <NavLink to="/transcoding" style={({ isActive }) => tab(isActive)}>Transcoding</NavLink>
          <NavLink to="/metadata" style={({ isActive }) => tab(isActive)}>Metadata</NavLink>
          <NavLink to="/settings" style={({ isActive }) => tab(isActive)}>Settings</NavLink>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          <Suspense fallback={
            <div style={{ color: '#8C94B0', fontSize: 14, padding: 20 }}>Loading...</div>
          }>
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/uploads" element={<Uploads />} />
              <Route path="/transcoding" element={<Transcoding />} />
              <Route path="/metadata" element={<Metadata />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
