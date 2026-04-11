import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { PageHeader } from '@repo/shared-ui';

const COLOR = '#2563eb';

const Inbox = lazy(() => import('./routes/Inbox'));
const Sent = lazy(() => import('./routes/Sent'));
const Compose = lazy(() => import('./routes/Compose'));
const Settings = lazy(() => import('./routes/Settings'));

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
    console.log('SMS app mounted');
    return () => console.log('SMS app unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: COLOR, padding: '16px 24px' }}>
          <PageHeader title="SMS" subtitle="Short Message Service" />
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
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Inbox</NavLink>
          <NavLink to="/sent" style={({ isActive }) => tab(isActive)}>Sent</NavLink>
          <NavLink to="/compose" style={({ isActive }) => tab(isActive)}>Compose</NavLink>
          <NavLink to="/settings" style={({ isActive }) => tab(isActive)}>Settings</NavLink>
        </div>
        <div style={{ padding: 24 }}>
          <Suspense fallback={<div style={{ color: '#94a3b8' }}>Loading route...</div>}>
            <Routes>
              <Route path="/" element={<Inbox />} />
              <Route path="/sent" element={<Sent />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
