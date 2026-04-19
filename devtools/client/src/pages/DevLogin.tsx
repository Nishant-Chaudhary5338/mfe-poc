import { useState } from 'react';
import { useDevAuth, DevUser } from '../devAuth.tsx';

const MOCK_USERS: DevUser[] = [
  { id: '1', name: 'Nishant',       email: 'alice@tvplus.com', role: 'admin'  },
  { id: '2', name: 'Bob Ops',      email: 'bob@tvplus.com',   role: 'ops'    },
  { id: '3', name: 'Carol Editor', email: 'carol@tvplus.com', role: 'editor' },
  { id: '4', name: 'Dave Viewer',  email: 'dave@tvplus.com',  role: 'viewer' },
];

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

const roleIcons: Record<string, string> = {
  admin: '👑', ops: '⚙️', editor: '✏️', viewer: '👁️',
};

const roleAccess: Record<string, string[]> = {
  admin:  ['Dashboard', 'New Plugin', 'Routes', 'Build', 'Registry', 'Deploy', 'Access Control', 'Present'],
  ops:    ['Dashboard', 'Routes', 'Build', 'Registry', 'Deploy', 'Present'],
  editor: ['Dashboard', 'Routes', 'Build', 'Present'],
  viewer: ['Dashboard', 'Build (read)', 'Registry (read)', 'Present'],
};

export default function DevLogin() {
  const { login } = useDevAuth();
  const [selectedId, setSelectedId] = useState(MOCK_USERS[0].id);
  const [signingIn, setSigningIn] = useState(false);

  const selectedUser = MOCK_USERS.find(u => u.id === selectedId) ?? MOCK_USERS[0];
  const accessList = roleAccess[selectedUser.role] ?? [];
  const roleColor = roleColors[selectedUser.role] ?? '#1428A0';

  async function handleSignIn() {
    setSigningIn(true);
    await login(selectedUser);
    // parent re-renders on user state change; no navigation needed
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Left panel — dark brand */}
      <div style={{
        flex: '0 0 58%',
        background: 'linear-gradient(150deg, #070910 0%, #0d1433 60%, #111827 100%)',
        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 72px 64px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: -100, right: 80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,40,160,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: 40,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,81,30,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #1428A0 0%, #F4511E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: 'white',
            flexShrink: 0,
          }}>TV</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              TV<span style={{ color: '#F4511E' }}>Plus</span> DevTools
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
              Developer Control Center
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 34, fontWeight: 800, color: 'white',
            letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0, marginBottom: 12,
          }}>
            Scaffold. Build.<br />
            <span style={{ color: '#F4511E' }}>Deploy.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
            Full control over the TVPlus MFE platform.<br />
            Sign in to access tools based on your role.
          </p>
        </div>

        {/* Role access table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Role capabilities
          </div>
          {Object.entries(roleAccess).map(([role, pages]) => (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                background: roleColors[role] + '22', color: roleColors[role],
                textTransform: 'uppercase', letterSpacing: '0.08em',
                border: `1px solid ${roleColors[role]}40`,
                whiteSpace: 'nowrap', minWidth: 54, textAlign: 'center',
              }}>{role}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                {pages.join(' · ')}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['Module Federation', 'Independent Deploy', 'RBAC'].map((tag, i) => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        marginLeft: '-3%',
        background: 'white',
        zIndex: 1,
        boxShadow: '-20px 0 60px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 56px',
      }}>

        <div style={{ maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800,
              color: '#0F172A', margin: 0, letterSpacing: '-0.02em', marginBottom: 6,
            }}>Sign in</h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Select your identity to continue
            </p>
          </div>

          {/* Select user */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontSize: 11, fontWeight: 700, color: '#475569', display: 'block',
              marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Identity</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                color: '#0F172A', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', outline: 'none',
              }}
            >
              {MOCK_USERS.map(u => (
                <option key={u.id} value={u.id}>
                  {roleIcons[u.role]} {u.name} — {u.role}
                </option>
              ))}
            </select>
          </div>

          {/* Password (visual only) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontSize: 11, fontWeight: 700, color: '#475569', display: 'block',
              marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Password</label>
            <input
              type="password"
              defaultValue="demo1234"
              readOnly
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                color: '#94A3B8', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                cursor: 'default', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Access preview strip */}
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 24,
            background: roleColor + '0A',
            border: `1px solid ${roleColor}22`,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{roleIcons[selectedUser.role]}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: roleColor, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedUser.role} access
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                {accessList.join(' · ')}
              </div>
            </div>
          </div>

          {/* Sign In button */}
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #1428A0 0%, #2940C8 100%)',
              color: 'white', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Sora', sans-serif",
              boxShadow: '0 4px 14px rgba(20,40,160,0.35)',
              transition: 'opacity 0.12s ease, transform 0.08s ease',
              marginBottom: 20,
            }}
            onMouseEnter={e => { if (!signingIn) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {signingIn ? 'Signing in…' : 'Sign In →'}
          </button>

          {/* SSO badge */}
          <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>🔒</span>
            <span>Mock SSO · Demo environment · No real auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
