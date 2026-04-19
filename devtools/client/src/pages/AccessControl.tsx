import { useState, useEffect } from 'react';
import { useDevAuth } from '../devAuth.tsx';

type UserRole = 'admin' | 'ops' | 'editor' | 'viewer';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface RegEntry {
  id: string;
  label: string;
  url: string;
  requiredRoles?: UserRole[];
}

const ALL_ROLES: { role: UserRole; label: string; icon: string; color: string }[] = [
  { role: 'admin',  label: 'Admin',  icon: '👑', color: '#1428A0' },
  { role: 'ops',    label: 'Ops',    icon: '⚙️', color: '#059669' },
  { role: 'editor', label: 'Editor', icon: '✏️', color: '#F4511E' },
  { role: 'viewer', label: 'Viewer', icon: '👁️', color: '#4A5170' },
];

const appColors: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#0D1B70', mam: '#F4511E',
};

const appIcons: Record<string, string> = {
  sms: '💬', qca: '✅', cms: '📝', mam: '🗂️',
};

export default function AccessControl() {
  const { user: devUser } = useDevAuth();
  const isAdmin = devUser?.role === 'admin';
  const [users, setUsers] = useState<MockUser[]>([]);
  const [registry, setRegistry] = useState<RegEntry[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<string>('1');

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(console.error);
    fetch('/api/registry').then(r => r.json()).then(setRegistry).catch(console.error);
  }, []);

  async function toggleRole(pluginId: string, role: UserRole) {
    const entry = registry.find(e => e.id === pluginId);
    if (!entry) return;
    const current = entry.requiredRoles ?? ALL_ROLES.map(r => r.role);
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];

    setSaving(pluginId + ':' + role);
    await fetch(`/api/registry/${pluginId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: entry.url, requiredRoles: next }),
    });
    setRegistry(r => r.map(e => e.id === pluginId ? { ...e, requiredRoles: next } : e));
    setSaving(null);
  }

  const previewUserObj = users.find(u => u.id === previewUser);
  const visibleInPreview = registry.filter(app => {
    const roles = app.requiredRoles ?? ALL_ROLES.map(r => r.role);
    return !roles.length || (previewUserObj ? roles.includes(previewUserObj.role) : false);
  });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Access Control
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Manage who can access which plugins — mock SSO users and RBAC matrix
        </p>
      </div>

      {/* ── Section A: Users ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
          Users
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {users.map(u => {
            const roleDef = ALL_ROLES.find(r => r.role === u.role)!;
            const accessible = registry.filter(app => {
              const roles = app.requiredRoles ?? ALL_ROLES.map(r => r.role);
              return roles.includes(u.role);
            });
            return (
              <div key={u.id} style={{
                background: 'var(--card)', borderRadius: 12,
                border: '1px solid var(--border)',
                borderTop: `3px solid ${roleDef.color}`,
                padding: '16px 16px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: roleDef.color + '18',
                    border: `1.5px solid ${roleDef.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{roleDef.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: roleDef.color + '18', color: roleDef.color,
                  textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block', marginBottom: 10,
                }}>{u.role}</span>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Accessible plugins</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {accessible.length === 0
                      ? <span style={{ fontSize: 11, color: 'var(--red)' }}>None</span>
                      : accessible.map(app => (
                        <span key={app.id} style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 8,
                          background: (appColors[app.id] ?? '#546BE8') + '14',
                          color: appColors[app.id] ?? '#546BE8', fontWeight: 600,
                        }}>{appIcons[app.id] ?? '📦'} {app.id.toUpperCase()}</span>
                      ))
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section B: Permissions matrix ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Permissions Matrix
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Click a cell to toggle access. Changes save immediately.
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plugin</div>
            {ALL_ROLES.map(r => (
              <div key={r.role} style={{ padding: '12px 8px', textAlign: 'center' }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{r.label}</div>
              </div>
            ))}
          </div>

          {/* Plugin rows */}
          {registry.map((entry, idx) => {
            const roles = entry.requiredRoles ?? ALL_ROLES.map(r => r.role);
            const color = appColors[entry.id] ?? '#546BE8';
            return (
              <div key={entry.id} style={{
                display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr)',
                borderBottom: idx < registry.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                {/* Plugin name */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: color + '18', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14,
                  }}>{appIcons[entry.id] ?? '📦'}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{entry.label}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--subtle)' }}>{entry.id}</div>
                  </div>
                </div>

                {/* Role cells */}
                {ALL_ROLES.map(r => {
                  const hasAccess = roles.includes(r.role);
                  const isSaving = saving === entry.id + ':' + r.role;
                  return (
                    <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 8px' }}>
                      <button
                        onClick={() => toggleRole(entry.id, r.role)}
                        disabled={!!saving || !isAdmin}
                        title={!isAdmin ? 'Admin only' : hasAccess ? `Remove ${r.label} access` : `Grant ${r.label} access`}
                        style={{
                          width: 36, height: 36, borderRadius: 9, cursor: saving ? 'wait' : 'pointer',
                          background: isSaving ? 'var(--surface)' : hasAccess ? r.color + '18' : 'var(--surface)',
                          border: `1.5px solid ${isSaving ? 'var(--border)' : hasAccess ? r.color + '50' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.12s', fontSize: 16,
                        }}
                        onMouseEnter={e => { if (!saving) (e.currentTarget.style.transform = 'scale(1.1)'); }}
                        onMouseLeave={e => { (e.currentTarget.style.transform = 'scale(1)'); }}
                      >
                        {isSaving
                          ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: r.color, animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                          : hasAccess
                            ? <span style={{ color: r.color, fontWeight: 900, fontSize: 14 }}>✓</span>
                            : <span style={{ color: 'var(--border-strong)', fontSize: 14 }}>✕</span>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section C: Preview as user ── */}
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Preview as User
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Simulate what a user sees in the shell portal based on current role permissions.
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>Sign in as:</label>
            <select
              value={previewUser}
              onChange={e => setPreviewUser(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            {previewUserObj && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: (ALL_ROLES.find(r => r.role === previewUserObj.role)?.color ?? '#4A5170') + '18',
                color: ALL_ROLES.find(r => r.role === previewUserObj.role)?.color ?? '#4A5170',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{previewUserObj.role}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {registry.map(app => {
              const visible = visibleInPreview.some(a => a.id === app.id);
              const color = appColors[app.id] ?? '#546BE8';
              return (
                <div key={app.id} style={{
                  borderRadius: 10, padding: '14px 16px',
                  background: visible ? color + '0C' : 'var(--surface)',
                  border: `1.5px solid ${visible ? color + '40' : 'var(--border)'}`,
                  opacity: visible ? 1 : 0.45,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{appIcons[app.id] ?? '📦'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: visible ? color : 'var(--muted)', marginBottom: 4 }}>{app.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: visible ? color : 'var(--subtle)' }}>
                    {visible ? '✓ Visible' : '✕ Hidden'}
                  </div>
                </div>
              );
            })}
          </div>
          {previewUserObj && (
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{previewUserObj.name}</strong> can see{' '}
              <strong style={{ color: 'var(--text)' }}>{visibleInPreview.length}</strong> of {registry.length} plugins.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
