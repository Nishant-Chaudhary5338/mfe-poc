import { useState } from 'react';
import { useAuth } from '@repo/auth';
import { MOCK_USERS } from '@repo/auth';

const rolePlugins: Record<string, string> = {
  admin:  'SMS · QCA · CMS · MAM',
  ops:    'SMS · QCA',
  editor: 'CMS · MAM',
  viewer: 'SMS · QCA · CMS · MAM',
};

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

const roleIcons: Record<string, string> = {
  admin: '👑', ops: '⚙️', editor: '✏️', viewer: '👁️',
};

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedId, setSelectedId] = useState(MOCK_USERS[0].id);
  const selectedUser = MOCK_USERS.find(u => u.id === selectedId)!;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Left panel — dark, diagonal clip */}
      <div style={{
        flex: '0 0 62%',
        background: 'linear-gradient(150deg, #070910 0%, #0d1433 60%, #1428A015 100%)',
        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 80px 48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow orb */}
        <div style={{
          position: 'absolute', top: '-10%', right: '5%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, #1428A018 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 44 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #1428A0, #091455)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px #1428A050', flexShrink: 0,
          }}>
            <span style={{ fontSize: 26 }}>📺</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              TV<span style={{ color: '#F4511E' }}>Plus</span> Portal
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Enterprise Plugin Platform
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 38, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.03em' }}>
          One portal.<br />
          <span style={{ background: 'linear-gradient(90deg, #546BE8, #93b4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Every team.
          </span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, maxWidth: 360, marginBottom: 48 }}>
          Role-based access to independently deployed micro-frontends.
          Each team owns their plugin — zero coordination required.
        </div>

        {/* Role access preview cards */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Role access matrix
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {MOCK_USERS.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 13px', borderRadius: 9,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <span style={{ fontSize: 13, width: 18, textAlign: 'center' }}>{roleIcons[u.role]}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', minWidth: 100 }}>{u.name}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px',
                  borderRadius: 20, background: roleColors[u.role] + '28',
                  color: roleColors[u.role], textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4,
                }}>{u.role}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginLeft: 'auto' }}>{rolePlugins[u.role]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — light, overlaps diagonal */}
      <div style={{
        flex: 1,
        marginLeft: '-3%',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        boxShadow: '-20px 0 60px rgba(0,0,0,0.22)',
      }}>
        <div style={{ width: '100%', maxWidth: 340, padding: '0 44px' }}>

          {/* Form header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Welcome back
            </div>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              Sign in to your workspace
            </div>
          </div>

          {/* Account select */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Account
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{
                  width: '100%', padding: '11px 36px 11px 14px', borderRadius: 9,
                  border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                  color: '#0F172A', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  appearance: 'none', cursor: 'pointer', outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#1428A0')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8', fontSize: 11 }}>▾</span>
            </div>
          </div>

          {/* Password (visual) */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              defaultValue="demo1234"
              readOnly
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                color: '#CBD5E1', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                outline: 'none', cursor: 'default', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Access preview strip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, marginBottom: 22,
            background: roleColors[selectedUser.role] + '0C',
            border: `1px solid ${roleColors[selectedUser.role]}22`,
          }}>
            <span style={{ fontSize: 14 }}>{roleIcons[selectedUser.role]}</span>
            <span style={{ fontSize: 12, color: '#475569' }}>
              You'll see: <strong style={{ color: roleColors[selectedUser.role] }}>{rolePlugins[selectedUser.role]}</strong>
            </span>
          </div>

          {/* Sign In button */}
          <button
            onClick={() => login(selectedId)}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #1428A0, #1e3fc2)',
              color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Sora', sans-serif",
              boxShadow: '0 4px 14px #1428A038',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Sign In
          </button>

          {/* SSO footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 18, fontSize: 12, color: '#94A3B8',
          }}>
            <span>🔒</span>
            <span>Mock SSO · Demo mode · No password required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
