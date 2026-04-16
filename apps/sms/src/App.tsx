import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import type { CSSProperties } from 'react';

const COLOR = '#1428A0';
const COLOR_DARK = '#091455';

const Dashboard = lazy(() => import('./routes/Dashboard.tsx'));
const Alerts = lazy(() => import('./routes/Alerts.tsx'));
const Incidents = lazy(() => import('./routes/Incidents.tsx'));
const Services = lazy(() => import('./routes/Services.tsx'));
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
    console.log('SMS — Smart Monitoring System mounted');
    return () => console.log('SMS unmounted');
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
          }}>SMS</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Smart Monitoring System
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 400 }}>
              TVPlus Infrastructure · Real-time Observability
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>All Systems Operational</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 28px',
          borderBottom: '1px solid #D6D9E8',
          background: 'white',
        }}>
          <NavLink to="/" end style={({ isActive }) => tab(isActive)}>Dashboard</NavLink>
          <NavLink to="/alerts" style={({ isActive }) => tab(isActive)}>Alerts</NavLink>
          <NavLink to="/incidents" style={({ isActive }) => tab(isActive)}>Incidents</NavLink>
          <NavLink to="/services" style={({ isActive }) => tab(isActive)}>Services</NavLink>
          <NavLink to="/settings" style={({ isActive }) => tab(isActive)}>Settings</NavLink>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          <Suspense fallback={
            <div style={{ color: '#8C94B0', fontSize: 14, padding: 20 }}>Loading...</div>
          }>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/services" element={<Services />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
