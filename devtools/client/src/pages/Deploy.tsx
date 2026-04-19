import { useState, useEffect, useRef } from 'react';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useToast } from '../components/Toast.tsx';

interface AppInfo {
  id: string;
  label: string;
  url: string;
  port: string;
  built: boolean;
  routeCount: number;
}

type DeployStatus = 'idle' | 'building' | 'success' | 'error';

const appColors: Record<string, string> = {
  sms: '#1428A0', qca: '#546BE8', cms: '#0D1B70', mam: '#F4511E',
};

const appIcons: Record<string, string> = {
  sms: '💬', qca: '✅', cms: '📝', mam: '🗂️',
};

export default function Deploy() {
  const toast = useToast();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, DeployStatus>>({});
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const logRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch('/api/apps').then(r => r.json()).then(setApps).catch(console.error);
  }, []);

  async function deployPlugin(id: string) {
    if (deploying) return;
    setDeploying(id);
    setStatus(s => ({ ...s, [id]: 'building' }));
    setLogs(l => ({ ...l, [id]: '' }));
    setExpandedLog(id);

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: id }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          try {
            const event = JSON.parse(trimmed.slice(5).trim());
            if (event.type === 'stdout' || event.type === 'stderr' || event.type === 'done') {
              const cleaned = (event.line ?? '').replace(/\r/g, '');
              setLogs(l => ({ ...l, [id]: (l[id] ?? '') + cleaned }));
              // auto-scroll log
              requestAnimationFrame(() => {
                const el = logRefs.current[id];
                if (el) el.scrollTop = el.scrollHeight;
              });
            }
            if (event.type === 'exit') {
              const succeeded = event.code === 0;
              setStatus(s => ({ ...s, [id]: succeeded ? 'success' : 'error' }));
              if (succeeded) {
                toast.success(`${id.toUpperCase()} deployed`, 'Update registry URL to go live');
                fetch('/api/apps').then(r => r.json()).then(setApps).catch(() => {});
              } else {
                toast.error(`${id.toUpperCase()} build failed`, 'Check build log for details');
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      setLogs(l => ({ ...l, [id]: (l[id] ?? '') + `\nError: ${err}` }));
      setStatus(s => ({ ...s, [id]: 'error' }));
    } finally {
      setDeploying(null);
    }
  }

  async function restartAllPreviews() {
    if (restarting || deploying) return;
    setRestarting(true);
    try {
      await fetch('/api/restart-previews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    } catch {}
    setTimeout(() => setRestarting(false), 2000);
  }

  const otherApps = (id: string) => apps.filter(a => a.id !== id).map(a => a.label || a.id);

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Team Deployments
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Each team rebuilds and deploys their plugin independently — no coordination required
          </p>
        </div>
        <PermissionGate roles={['admin', 'ops']} mode="disable">
        <button
          onClick={restartAllPreviews}
          disabled={restarting || !!deploying}
          title="Kill stale preview processes and restart on the correct ports"
          style={{
            flexShrink: 0, padding: '9px 16px', borderRadius: 8, marginTop: 4,
            background: restarting ? 'var(--surface)' : 'var(--signal-soft)',
            border: '1px solid var(--signal)',
            color: restarting ? 'var(--muted)' : 'var(--signal)',
            fontSize: 12, fontWeight: 700, cursor: restarting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6,
            opacity: deploying ? 0.4 : 1,
          }}
        >
          {restarting ? (
            <>
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--signal)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Restarting…
            </>
          ) : (
            <>⟳ Restart Previews</>
          )}
        </button>
        </PermissionGate>
      </div>

      {/* How it works banner */}
      <div style={{
        background: 'rgba(20,40,160,0.06)', borderRadius: 12, padding: '16px 20px',
        border: '1px solid rgba(20,40,160,0.15)', marginBottom: 28,
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🚀</span>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, color: 'var(--signal)', marginBottom: 4 }}>
            Independent Deployment Model
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            Rebuild <strong style={{ color: 'var(--text)' }}>one plugin</strong> without touching others.
            The shell reads the registry URL at runtime — teams deploy to their own server,
            update the URL in <strong style={{ color: 'var(--text)' }}>Registry</strong>, and the shell picks up the new version instantly.
            No shell redeploy. No coordination. No downtime.
          </div>
        </div>
      </div>

      {/* Plugin cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        {apps.map(app => {
          const color = appColors[app.id] || '#546BE8';
          const st = status[app.id] || 'idle';
          const isBuilding = st === 'building';
          const isSuccess = st === 'success';
          const isError = st === 'error';
          const isDisabled = !!deploying && deploying !== app.id;

          return (
            <div
              key={app.id}
              style={{
                background: 'var(--card)', borderRadius: 14,
                border: `1px solid ${isBuilding ? color + '50' : isSuccess ? '#10B98130' : isError ? '#EF444430' : 'var(--border)'}`,
                borderTop: `3px solid ${color}`,
                padding: '20px 22px',
                transition: 'border-color 200ms, box-shadow 0.15s ease, transform 0.15s ease',
                opacity: isDisabled ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!isDisabled) { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>{appIcons[app.id] ?? '📦'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{app.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    port {app.port} · {app.routeCount} routes
                  </div>
                </div>
                {/* Status badge */}
                {isSuccess && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#DCFCE7', color: '#059669' }}>
                    ✓ Deployed
                  </span>
                )}
                {isError && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626' }}>
                    ✗ Failed
                  </span>
                )}
                {isBuilding && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: color + '20', color }}>
                    Building...
                  </span>
                )}
                {!isBuilding && !isSuccess && !isError && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: app.built ? 'var(--green-soft)' : 'var(--amber-soft)',
                    color: app.built ? 'var(--green)' : 'var(--amber)',
                  }}>
                    {app.built ? 'Built' : 'Not built'}
                  </span>
                )}
              </div>

              {/* Independence proof after success */}
              {isSuccess && (
                <div style={{
                  background: '#F0FDF4', borderRadius: 8, padding: '10px 14px',
                  border: '1px solid #BBF7D0', marginBottom: 12, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>✓ {app.label} redeployed</div>
                  <div style={{ color: '#15803D' }}>
                    {otherApps(app.id).join(' · ')} were <strong>NOT touched</strong>
                  </div>
                </div>
              )}

              {/* Build log toggle */}
              {(isBuilding || isSuccess || isError) && logs[app.id] && (
                <button
                  onClick={() => setExpandedLog(expandedLog === app.id ? null : app.id)}
                  style={{
                    width: '100%', padding: '6px 0', marginBottom: 10, borderRadius: 6,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  {expandedLog === app.id ? '▲ Hide log' : '▼ Show build log'}
                </button>
              )}

              {expandedLog === app.id && logs[app.id] && (
                <div
                  ref={el => { logRefs.current[app.id] = el; }}
                  style={{
                    background: '#0F172A', borderRadius: 8, padding: '12px 14px',
                    fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8',
                    maxHeight: 180, overflowY: 'auto', marginBottom: 12,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6,
                  }}
                >
                  {logs[app.id]}
                </div>
              )}

              {/* Deploy button */}
              <PermissionGate roles={['admin', 'ops']} mode="disable" style={{ display: 'block' }}>
                <button
                  onClick={() => deployPlugin(app.id)}
                  disabled={!!deploying || isBuilding}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 8,
                    background: isBuilding ? 'var(--surface)' : color,
                    color: isBuilding ? 'var(--muted)' : 'white',
                    border: isBuilding ? '1px solid var(--border)' : 'none',
                    fontSize: 13, fontWeight: 700, cursor: deploying ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-head)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 150ms',
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  {isBuilding ? (
                    <>
                      <span style={{
                        width: 12, height: 12, borderRadius: '50%',
                        border: '2px solid var(--border)', borderTopColor: color,
                        animation: 'spin 0.7s linear infinite', display: 'inline-block',
                      }} />
                      Building…
                    </>
                  ) : (
                    <>🚀 Deploy {app.id.toUpperCase()}</>
                  )}
                </button>
              </PermissionGate>
            </div>
          );
        })}
      </div>

      {/* Deployment story explainer */}
      <div style={{
        background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)',
        padding: '20px 24px',
      }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          How teams deploy in production
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { step: '1', title: 'Team builds their plugin', desc: 'Run Deploy above. Only their plugin\'s chunks are rebuilt. Other teams\' dist/ folders are untouched.' },
            { step: '2', title: 'Copy dist/ to server', desc: 'SCP, rsync, or S3 upload the dist/ folder to any static host — EC2, CDN, nginx. Teams own this independently.' },
            { step: '3', title: 'Update registry URL', desc: 'Go to Registry → change the URL to the new server. Shell loads the new version on next page load. Zero downtime.' },
          ].map(item => (
            <div key={item.step} style={{
              background: 'var(--surface)', borderRadius: 10, padding: '16px 18px',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--signal)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13,
                marginBottom: 10,
              }}>{item.step}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
