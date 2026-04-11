import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { PageHeader } from '@repo/shared-ui';

const COLOR = '#7c3aed';

const Assets = lazy(() => import('./routes/Assets'));
const Collections = lazy(() => import('./routes/Collections'));
const Upload = lazy(() => import('./routes/Upload'));
const Metadata = lazy(() => import('./routes/Metadata'));

function tab(isActive) {
  return {
    padding: '8px 18px',
    borderRadius: 4,
    background: isActive ? COLOR : 'transparent',
    color: isActive ? 'white' : COLOR,
    border: `1px solid ${COLOR}`,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    display: 'inline-block',
  };
}

export default function App() {
  useEffect(() => {
    console.log('MAM app mounted');
    return () => console.log('MAM app unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: COLOR, padding: '16px 24px' }}>
          <PageHeader title="MAM" subtitle="Media Asset Management" />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Assets</NavLink>
          <NavLink to="/collections" style={({ isActive }) => tab(isActive)}>Collections</NavLink>
          <NavLink to="/upload" style={({ isActive }) => tab(isActive)}>Upload</NavLink>
          <NavLink to="/metadata" style={({ isActive }) => tab(isActive)}>Metadata</NavLink>
        </div>
        <div style={{ padding: 24 }}>
          <Suspense fallback={<div style={{ color: '#94a3b8' }}>Loading route...</div>}>
            <Routes>
              <Route path="/" element={<Assets />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/metadata" element={<Metadata />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
