import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import type { CSSProperties } from 'react';

const COLOR = '#546BE8';
const COLOR_DARK = '#0D1B70';

const Dashboard = lazy(() => import('./routes/Dashboard.tsx'));
const Reports = lazy(() => import('./routes/Reports.tsx'));
const Rules = lazy(() => import('./routes/Rules.tsx'));
const History = lazy(() => import('./routes/History.tsx'));
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
    console.log('QCA — QC Automation mounted');
    return () => console.log('QCA unmounted');
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
          }}>QCA</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              QC Automation
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 400 }}>
              TVPlus Quality Assurance · Automated Pipeline
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Pass rate: 96.4% · 284 checks today</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 28px',
          borderBottom: '1px solid #D6D9E8',
          background: 'white',
        }}>
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Dashboard</NavLink>
          <NavLink to="/reports" style={({ isActive }) => tab(isActive)}>Reports</NavLink>
          <NavLink to="/rules" style={({ isActive }) => tab(isActive)}>Rules</NavLink>
          <NavLink to="/history" style={({ isActive }) => tab(isActive)}>History</NavLink>
          <NavLink to="/settings" style={({ isActive }) => tab(isActive)}>Settings</NavLink>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          <Suspense fallback={
            <div style={{ color: '#8C94B0', fontSize: 14, padding: 20 }}>Loading...</div>
          }>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
