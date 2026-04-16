import { AppEntry } from './App.tsx';

const appIcons: Record<string, string> = { sms: '💬', qca: '✅', cms: '📝', mam: '🗂️' };

interface SidebarProps {
  registry: AppEntry[];
  activeId: string | undefined;
  onSelect: (app: AppEntry) => void;
}

export default function Sidebar({ registry, activeId, onSelect }: SidebarProps) {
  return (
    <nav
      style={{
        width: 220,
        background: '#1a1a2e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
          MFE SHELL
        </div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Applications</div>
      </div>

      <div style={{ padding: '8px 0', flex: 1 }}>
        {registry.map((app) => {
          const isActive = activeId === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onSelect(app)}
              style={{
                width: '100%',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                border: 'none',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                padding: '11px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <span>{appIcons[app.id] ?? '📦'}</span>
              <span>{app.label}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        {registry.length} app{registry.length !== 1 ? 's' : ''} registered
      </div>
    </nav>
  );
}
