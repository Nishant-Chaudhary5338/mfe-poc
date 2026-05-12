import { useState, useEffect, useCallback, type CSSProperties, Component, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@repo/auth';
import type { UserRole } from '@repo/auth';
import RemoteLoader from './RemoteLoader.tsx';
import LoginPage from './LoginPage.tsx';

export interface AppEntry {
  id: string;
  label: string;
  url: string;
  requiredRoles?: UserRole[];
  disabled?: boolean;
}

const appMeta: Record<string, { icon: string; desc: string; color: string }> = {
  sms: { icon: '💬', desc: 'Real-time infrastructure monitoring & alerting', color: '#1428A0' },
  qca: { icon: '✅', desc: 'Automated quality control pipeline',              color: '#546BE8' },
  cms: { icon: '📝', desc: 'Programme & content publishing hub',              color: '#0D1B70' },
  mam: { icon: '🗂️', desc: 'Media asset library & transcoding',              color: '#F4511E' },
};

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

// ─── Error boundary for remote apps ──────────────────────────────────────────

interface EBState { hasError: boolean; message: string }
class RemoteErrorBoundary extends Component<{ appLabel: string; children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): EBState {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full min-h-screen items-start justify-center bg-slate-50 p-10">
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="mb-1 font-semibold text-red-700">Failed to render {this.props.appLabel}</p>
          <p className="font-mono text-sm text-red-500">{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); }}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}

// ─── Shell component ──────────────────────────────────────────────────────────

function Shell() {
  const { user, logout } = useAuth();
  const [registry, setRegistry] = useState<AppEntry[]>([]);

  // Persist active app across refreshes
  const [activeApp, setActiveApp] = useState<AppEntry | null>(() => {
    try {
      const s = sessionStorage.getItem('tvplus_active_app');
      return s ? (JSON.parse(s) as AppEntry) : null;
    } catch { return null; }
  });

  const openApp = useCallback((app: AppEntry) => {
    setActiveApp(app);
    sessionStorage.setItem('tvplus_active_app', JSON.stringify(app));
  }, []);

  const goHome = useCallback(() => {
    setActiveApp(null);
    sessionStorage.removeItem('tvplus_active_app');
  }, []);

  useEffect(() => {
    (globalThis as any).__tvplus_goHome = goHome;
  }, [goHome]);

  // DevTools hot-reload
  useEffect(() => {
    let lastRevision = -1;
    const pollId = setInterval(async () => {
      try {
        const { revision } = await fetch('http://localhost:5001/api/revision').then(r => r.json());
        if (lastRevision === -1) { lastRevision = revision; return; }
        if (revision !== lastRevision) window.location.reload();
      } catch { /* DevTools not running */ }
    }, 3000);
    return () => clearInterval(pollId);
  }, []);

  useEffect(() => {
    fetch('http://localhost:5001/api/registry')
      .catch(() => fetch('/registry.json'))
      .then(r => r.json())
      .then((data: AppEntry[]) => {
        setRegistry(data);
        // Rehydrate: if saved app is no longer in registry, clear it
        const saved = sessionStorage.getItem('tvplus_active_app');
        if (saved) {
          const savedApp = JSON.parse(saved) as AppEntry;
          const found = data.find((a: AppEntry) => a.id === savedApp.id);
          if (!found || found.disabled) goHome();
        }
      })
      .catch(err => console.error('Failed to load registry:', err));
  }, [goHome]);

  if (!user) return <LoginPage />;

  const visibleApps = registry.filter(app =>
    !app.disabled &&
    (!app.requiredRoles?.length || app.requiredRoles.includes(user.role))
  );

  // Active remote — full screen with error boundary
  if (activeApp) {
    const meta = appMeta[activeApp.id] ?? { icon: '📦', desc: '', color: '#546BE8' };
    return (
      <RemoteErrorBoundary key={activeApp.id} appLabel={activeApp.label}>
        <RemoteLoader key={activeApp.id} app={activeApp} appColor={meta.color} />
      </RemoteErrorBoundary>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const roleColor = roleColors[user.role] ?? '#4A5170';

  return (
    <div className="h-screen overflow-auto bg-slate-100 font-sans">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-slate-200 bg-white/[0.92] px-10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#1428A0] to-[#091455]">
            <span className="text-base">📺</span>
          </div>
          <div className="font-[Sora] text-[15px] font-extrabold tracking-tight text-slate-900">
            TV<span className="text-[#F4511E]">Plus</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pl-2 pr-3 py-1.5">
            <div
              className="flex size-[26px] flex-shrink-0 items-center justify-center rounded-[7px] text-xs"
              style={{ background: roleColor + '20', border: `1px solid ${roleColor}40` }}
            >
              {user.role === 'admin' ? '👑' : user.role === 'ops' ? '⚙️' : user.role === 'editor' ? '✏️' : '👁️'}
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight text-slate-900">{user.name}</div>
              <div className="text-[10px] font-bold uppercase leading-none tracking-wide" style={{ color: roleColor }}>
                {user.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="cursor-pointer rounded-lg border border-slate-200 px-3.5 py-[7px] text-xs font-medium text-slate-500 transition-all duration-[120ms] hover:bg-slate-100 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-10 pt-10 pb-16">
        <div className="mb-9">
          <div className="mb-1.5 font-[Sora] text-[28px] font-extrabold tracking-tighter text-slate-900">
            {greeting}, {user.name.split(' ')[0]} 👋
          </div>
          <div className="text-[15px] text-slate-500">
            {visibleApps.length > 0
              ? `You have access to ${visibleApps.length} plugin${visibleApps.length !== 1 ? 's' : ''}`
              : 'No plugins assigned to your role'}
          </div>
        </div>

        {registry.length === 0 ? (
          <div className="py-[60px] text-center text-sm text-slate-400">
            <div className="mb-3 text-[32px]">⏳</div>
            Loading registry…
          </div>
        ) : visibleApps.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-800">
            No plugins are assigned to your role (<strong>{user.role}</strong>). Contact your admin.
          </div>
        ) : (
          <div className="grid max-w-[900px] grid-cols-2 gap-[18px]">
            {visibleApps.map(app => {
              const meta = appMeta[app.id] ?? { icon: '📦', desc: '', color: '#546BE8' };
              return (
                <div
                  key={app.id}
                  style={{ borderTopColor: meta.color } as CSSProperties}
                  className="cursor-pointer rounded-2xl border border-slate-200 border-t-[3px] bg-white px-[26px] py-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl"
                  onClick={() => openApp(app)}
                >
                  <div className="mb-3.5 flex items-center gap-3.5">
                    <div
                      className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl text-[22px]"
                      style={{ background: meta.color + '14', border: `1.5px solid ${meta.color}28` }}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <div className="font-[Sora] text-base font-bold leading-tight text-slate-900">{app.label}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{meta.desc}</div>
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-[9px] px-3.5 py-2.5"
                    style={{ background: meta.color + '0A', border: `1px solid ${meta.color}1E` }}
                  >
                    <span className="text-[13px] font-semibold" style={{ color: meta.color }}>Open plugin</span>
                    <span className="text-base" style={{ color: meta.color }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
