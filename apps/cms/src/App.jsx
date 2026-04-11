import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { PageHeader } from '@repo/shared-ui';

const COLOR = '#ea580c';

const Posts = lazy(() => import('./routes/Posts'));
const Media = lazy(() => import('./routes/Media'));
const Drafts = lazy(() => import('./routes/Drafts'));
const Publish = lazy(() => import('./routes/Publish'));

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
    console.log('CMS app mounted');
    return () => console.log('CMS app unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: COLOR, padding: '16px 24px' }}>
          <PageHeader title="CMS" subtitle="Content Management System" />
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
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Posts</NavLink>
          <NavLink to="/media" style={({ isActive }) => tab(isActive)}>Media</NavLink>
          <NavLink to="/drafts" style={({ isActive }) => tab(isActive)}>Drafts</NavLink>
          <NavLink to="/publish" style={({ isActive }) => tab(isActive)}>Publish</NavLink>
        </div>
        <div style={{ padding: 24 }}>
          <Suspense fallback={<div style={{ color: '#94a3b8' }}>Loading route...</div>}>
            <Routes>
              <Route path="/" element={<Posts />} />
              <Route path="/media" element={<Media />} />
              <Route path="/drafts" element={<Drafts />} />
              <Route path="/publish" element={<Publish />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
