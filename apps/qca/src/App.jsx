import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { PageHeader } from '@repo/shared-ui';

const COLOR = '#16a34a';

const Dashboard = lazy(() => import('./routes/Dashboard'));
const Tests = lazy(() => import('./routes/Tests'));
const Reports = lazy(() => import('./routes/Reports'));
const Config = lazy(() => import('./routes/Config'));

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
    console.log('QCA app mounted');
    return () => console.log('QCA app unmounted');
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: COLOR, padding: '16px 24px' }}>
          <PageHeader title="QCA" subtitle="Quality Control & Assurance" />
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
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Dashboard</NavLink>
          <NavLink to="/tests" style={({ isActive }) => tab(isActive)}>Tests</NavLink>
          <NavLink to="/reports" style={({ isActive }) => tab(isActive)}>Reports</NavLink>
          <NavLink to="/config" style={({ isActive }) => tab(isActive)}>Config</NavLink>
        </div>
        <div style={{ padding: 24 }}>
          <Suspense fallback={<div style={{ color: '#94a3b8' }}>Loading route...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tests" element={<Tests />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/config" element={<Config />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
