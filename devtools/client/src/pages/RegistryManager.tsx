import { useState, useEffect } from 'react';
import { useDevAuth } from '../devAuth.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useToast } from '../components/Toast.tsx';

type UserRole = 'admin' | 'ops' | 'editor' | 'viewer';

interface RegEntry {
  id: string;
  label: string;
  url: string;
  requiredRoles?: UserRole[];
  disabled?: boolean;
}

const ALL_ROLES: { role: UserRole; label: string; desc: string; color: string }[] = [
  { role: 'admin',  label: 'Admin',  desc: 'Full access',      color: '#1428A0' },
  { role: 'ops',    label: 'Ops',    desc: 'Operations team',  color: '#059669' },
  { role: 'editor', label: 'Editor', desc: 'Content team',     color: '#F4511E' },
  { role: 'viewer', label: 'Viewer', desc: 'Read-only access', color: '#64748B' },
];

const inputStyle = {
  width: '100%', padding: '8px 12px',
  background: 'var(--surface)', border: '1.5px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', fontSize: 12,
  fontFamily: 'var(--font-mono)', outline: 'none',
  boxSizing: 'border-box' as const,
};

const appColors: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#0D1B70', mam: '#F4511E',
};

function urlType(url: string): { label: string; color: string } {
  if (url.includes('localhost:4000')) return { label: 'Deployed', color: '#059669' };
  if (url.match(/localhost:300\d/)) return { label: 'Preview', color: '#546BE8' };
  return { label: 'Custom', color: '#D97706' };
}

export default function RegistryManager() {
  const { user } = useDevAuth();
  const toast = useToast();
  const canEdit = user?.role === 'admin' || user?.role === 'ops';
  const canDelete = user?.role === 'admin';
  const [registry, setRegistry] = useState<RegEntry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [diffChanges, setDiffChanges] = useState<{ path: string; type: string; oldValue?: unknown; value?: unknown }[]>([]);

  useEffect(() => {
    fetch('/api/registry').then(r => r.json()).then(setRegistry).catch(console.error);
  }, []);

  function startEdit(entry: RegEntry) {
    setEditing(entry.id);
    setEditUrl(entry.url);
    setEditRoles(entry.requiredRoles ?? ['admin', 'ops', 'editor', 'viewer']);
    setDiffChanges([]);
  }

  async function previewDiff(id: string) {
    const entry = registry.find(e => e.id === id);
    if (!entry) return;
    const before = { url: entry.url, requiredRoles: entry.requiredRoles ?? [] };
    const after  = { url: editUrl,   requiredRoles: editRoles };
    try {
      const res = await fetch('/api/json/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ before, after }),
      });
      const data = await res.json();
      setDiffChanges(data.changes ?? []);
    } catch { /* non-blocking */ }
  }

  function toggleRole(role: UserRole) {
    setEditRoles(r => r.includes(role) ? r.filter(x => x !== role) : [...r, role]);
  }

  async function handleSave(id: string) {
    setSaving(id);
    const res = await fetch(`/api/registry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: editUrl, requiredRoles: editRoles }),
    });
    const updated = await res.json();
    setRegistry(r => r.map(e => e.id === id ? { ...e, ...updated } : e));
    setEditing(null);
    setSaving(null);
    setDiffChanges([]);
    toast.success('Registry updated', `${id} URL and access roles saved`);
  }

  async function handleDisableToggle(entry: RegEntry) {
    const res = await fetch(`/api/registry/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !entry.disabled }),
    });
    const updated = await res.json();
    setRegistry(r => r.map(e => e.id === entry.id ? { ...e, ...updated } : e));
    toast.success(updated.disabled ? 'Plugin disabled' : 'Plugin enabled', entry.label);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/registry/${id}`, { method: 'DELETE' });
    setRegistry(r => r.filter(e => e.id !== id));
    setConfirmDelete(null);
    toast.success('Plugin deleted', `${id} removed and files cleaned up`);
  }

  function switchToDeployed(entry: RegEntry, version: string = 'v1') {
    setEditing(entry.id);
    setEditUrl(`http://localhost:4000/${entry.id}/${version}/assets/remoteEntry.js`);
    setEditRoles(entry.requiredRoles ?? ['admin', 'ops', 'editor', 'viewer']);
  }

  function switchToPreview(entry: RegEntry, port: string) {
    setEditing(entry.id);
    setEditUrl(`http://localhost:${port}/assets/remoteEntry.js`);
    setEditRoles(entry.requiredRoles ?? ['admin', 'ops', 'editor', 'viewer']);
  }

  const portMap: Record<string, string> = { sms: '3001', qca: '3002', cms: '3003', mam: '3004' };
  const confirmEntry = confirmDelete ? registry.find(e => e.id === confirmDelete) : null;

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Registry</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Plugin URLs and access control — who can see which plugin
          </p>
        </div>
        {!canEdit && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: 'var(--amber-soft)', color: 'var(--amber)', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
            👁 Read-only
          </span>
        )}
      </div>

      {/* Explanation card */}
      <div style={{
        background: 'rgba(20,40,160,0.08)', borderRadius: 12, padding: '18px 22px',
        border: '1px solid rgba(20,40,160,0.2)', marginBottom: 28,
        display: 'flex', gap: 16, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>◈</span>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--signal)', marginBottom: 6 }}>Registry + Access Control</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            The shell fetches this list on every load from{' '}
            <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, color: 'var(--signal)' }}>
              /api/registry
            </code>.
            Each entry maps a plugin to its <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, color: 'var(--signal)' }}>remoteEntry.js</code> URL
            and the roles that can access it. The shell filters visible plugins per logged-in user.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {registry.map(entry => {
          const color = appColors[entry.id] || '#546BE8';
          const isEditing = editing === entry.id;
          const { label: typeLabel, color: typeColor } = urlType(entry.url);
          const roles = entry.requiredRoles ?? ['admin', 'ops', 'editor', 'viewer'];
          const isDisabled = !!entry.disabled;

          return (
            <div key={entry.id} style={{
              background: 'var(--card)', borderRadius: 14,
              border: `1px solid ${isEditing ? color + '40' : 'var(--border)'}`,
              borderLeft: `4px solid ${isDisabled ? '#94A3B8' : color}`,
              padding: '20px 22px',
              transition: 'border-color 200ms ease',
              opacity: isDisabled ? 0.6 : 1,
            }}>
              {/* Entry header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                  background: (isDisabled ? '#94A3B8' : color) + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11,
                  color: isDisabled ? '#94A3B8' : color,
                }}>{entry.id.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{entry.label}</div>
                    {isDisabled && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#94A3B820', color: '#94A3B8', border: '1px solid #94A3B840', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Disabled
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: typeColor + '20', color: typeColor }}>
                    {typeLabel}
                  </span>
                </div>
                {!isEditing && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <PermissionGate roles={['admin', 'ops']} mode="disable">
                      <button onClick={() => startEdit(entry)} style={{
                        padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: 'var(--surface)', color: 'var(--muted)',
                        border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}>Edit</button>
                    </PermissionGate>
                    <PermissionGate roles={['admin', 'ops']} mode="disable">
                      <button onClick={() => handleDisableToggle(entry)} style={{
                        padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: isDisabled ? 'var(--green-soft)' : 'var(--amber-soft)',
                        color: isDisabled ? '#059669' : 'var(--amber)',
                        border: `1px solid ${isDisabled ? '#BBF7D0' : '#FDE68A'}`,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}>{isDisabled ? 'Enable' : 'Disable'}</button>
                    </PermissionGate>
                    {canDelete && (
                      <button onClick={() => setConfirmDelete(entry.id)} style={{
                        padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: '#FEF2F2', color: '#DC2626',
                        border: '1px solid #FECACA', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}>Delete</button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* URL input */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Remote Entry URL
                    </div>
                    <input style={inputStyle} value={editUrl} onChange={e => setEditUrl(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>Quick switch:</span>
                      <button onClick={() => switchToPreview(entry, portMap[entry.id] || '3001')} style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: 'var(--signal-soft)', color: 'var(--signal)',
                        border: '1px solid #C7D2FE', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}>← Preview ({portMap[entry.id] || '300x'})</button>
                      <button onClick={() => switchToDeployed(entry, 'v1')} style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: 'var(--green-soft)', color: '#059669',
                        border: '1px solid #BBF7D0', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}>→ Deployed (v1)</button>
                    </div>
                  </div>

                  {/* Role access control */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Access — who can see this plugin
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ALL_ROLES.map(({ role, label, desc, color: rc }) => {
                        const checked = editRoles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleRole(role)}
                            style={{
                              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: checked ? rc + '18' : 'var(--surface)',
                              color: checked ? rc : 'var(--muted)',
                              border: `1.5px solid ${checked ? rc + '60' : 'var(--border)'}`,
                              cursor: 'pointer', fontFamily: 'var(--font-body)',
                              display: 'flex', alignItems: 'center', gap: 6,
                              transition: 'all 120ms',
                            }}
                          >
                            <span style={{
                              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                              background: checked ? rc : 'transparent',
                              border: `1.5px solid ${checked ? rc : 'var(--border-strong)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {checked && <span style={{ color: 'white', fontSize: 9, fontWeight: 900 }}>✓</span>}
                            </span>
                            {label}
                            <span style={{ fontWeight: 400, fontSize: 11, color: checked ? rc + 'cc' : 'var(--subtle)' }}>{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {editRoles.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>
                        ⚠ No roles selected — this plugin will be hidden from all users
                      </div>
                    )}
                  </div>

                  {/* JSON diff preview */}
                  {diffChanges.length > 0 && (
                    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
                      <div style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                        Changes preview · {diffChanges.length} field{diffChanges.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {diffChanges.map((c, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 8, fontSize: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 700, padding: '1px 7px', borderRadius: 4, textAlign: 'center', fontSize: 10,
                              background: c.type === 'added' ? '#F0FDF4' : c.type === 'removed' ? '#FEF2F2' : '#FFFBEB',
                              color:      c.type === 'added' ? '#059669' : c.type === 'removed' ? '#DC2626' : '#D97706',
                              border:     `1px solid ${c.type === 'added' ? '#BBF7D0' : c.type === 'removed' ? '#FECACA' : '#FDE68A'}`,
                            }}>{c.type}</span>
                            <div style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                              <span style={{ color: 'var(--muted)' }}>{c.path}: </span>
                              {c.type === 'changed' && <><span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{JSON.stringify(c.oldValue)}</span> → </>}
                              <span style={{ color: c.type === 'removed' ? '#DC2626' : '#059669' }}>{JSON.stringify(c.type === 'removed' ? c.oldValue : c.value)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save / Cancel */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => previewDiff(entry.id)}
                      style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                      title="Show what will change before saving"
                    >⇄ Diff</button>
                    <PermissionGate roles={['admin', 'ops']} mode="disable" style={{ flex: 1 }}>
                      <button onClick={() => handleSave(entry.id)} disabled={saving === entry.id} style={{
                        width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                        background: color, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-head)',
                      }}>{saving === entry.id ? 'Saving…' : 'Save & Apply'}</button>
                    </PermissionGate>
                    <button onClick={() => { setEditing(null); setDiffChanges([]); }} style={{
                      padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'var(--surface)', color: 'var(--muted)',
                      border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {entry.url}
                  </div>
                  {/* Role pills (read mode) */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--subtle)', marginRight: 2 }}>Access:</span>
                    {roles.length === 4 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--green-soft)', color: 'var(--green)' }}>
                        All roles
                      </span>
                    ) : roles.map(r => {
                      const def = ALL_ROLES.find(x => x.role === r);
                      return (
                        <span key={r} style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: (def?.color ?? '#64748B') + '18',
                          color: def?.color ?? '#64748B',
                        }}>{def?.label ?? r}</span>
                      );
                    })}
                    {roles.length === 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--red-soft)', color: 'var(--red)' }}>
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && confirmEntry && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: '28px 32px',
            maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
              Delete {confirmEntry.label}?
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
              This will permanently remove <strong>{confirmEntry.id}</strong> from the registry,
              kill its preview server, and delete the <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '1px 5px', borderRadius: 4 }}>apps/{confirmEntry.id}/</code> directory from disk.
              <br /><br />
              <strong style={{ color: '#DC2626' }}>This action cannot be undone.</strong>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-head)',
              }}>Confirm Delete</button>
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--surface)', color: 'var(--muted)',
                border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
