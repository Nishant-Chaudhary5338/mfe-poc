import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastCtx {
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

let _id = 0;

const colors: Record<ToastType, { border: string; iconBg: string; icon: string }> = {
  success: { border: '#059669', iconBg: '#ECFDF5', icon: '✓' },
  error:   { border: '#DC2626', iconBg: '#FEF2F2', icon: '✕' },
  info:    { border: '#1428A0', iconBg: '#EEF2FF', icon: 'i' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++_id;
    setToasts(t => [...t.slice(-2), { id, type, title, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const ctx: ToastCtx = {
    success: (t, m) => add('success', t, m),
    error:   (t, m) => add('error', t, m),
    info:    (t, m) => add('info', t, m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 9999, pointerEvents: 'none',
        }}>
          {toasts.map(t => {
            const c = colors[t.type];
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px',
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  borderLeft: `3px solid ${c.border}`,
                  boxShadow: '0 8px 30px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.06)',
                  maxWidth: 320, minWidth: 240,
                  fontFamily: "'DM Sans', sans-serif",
                  pointerEvents: 'auto',
                  animation: 'toastIn 280ms cubic-bezier(.16,1,.3,1) both',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: c.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: c.border,
                  flexShrink: 0, marginTop: 1,
                }}>{c.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{t.title}</div>
                  {t.message && (
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{t.message}</div>
                  )}
                </div>
                <button
                  onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94A3B8', fontSize: 15, lineHeight: 1,
                    padding: 0, marginTop: 1, flexShrink: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast: no ToastProvider found');
  return ctx;
}
