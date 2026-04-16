const alerts = [
  { id: 'ALT-001', severity: 'critical', service: 'Transcode Farm', message: 'GPU utilisation exceeded 95% for >10 minutes', time: '2 min ago' },
  { id: 'ALT-002', severity: 'warning', service: 'Ad Insertion', message: 'VAST timeout rate above threshold (12.4%)', time: '18 min ago' },
  { id: 'ALT-003', severity: 'warning', service: 'CDN Edge — AMS', message: 'Cache hit ratio dropped below 88%', time: '34 min ago' },
  { id: 'ALT-004', severity: 'info', service: 'Playback API', message: 'Scheduled maintenance window starts in 2 hours', time: '1 hr ago' },
  { id: 'ALT-005', severity: 'info', service: 'Ingest Pipeline', message: 'Live event ingest channel count at 90% capacity', time: '1 hr ago' },
  { id: 'ALT-006', severity: 'critical', service: 'DRM Service', message: 'License server response time P99 > 500ms', time: '2 hr ago' },
];

const sev: Record<string, { bg: string; color: string; dot: string }> = {
  critical: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  warning:  { bg: '#fffbeb', color: '#b45309', dot: '#f59e0b' },
  info:     { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
};

export default function Alerts() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Active Alerts</h2>
          <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>6 active · 2 critical · 2 warning · 2 info</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['critical', 'warning', 'info'] as const).map(s => (
            <span key={s} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: sev[s].bg, color: sev[s].color, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: 'white', borderRadius: 12, padding: '16px 20px',
            border: '1px solid #ECEEF5',
            borderLeft: `4px solid ${sev[a.severity].dot}`,
            display: 'flex', alignItems: 'flex-start', gap: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: sev[a.severity].dot, flexShrink: 0, marginTop: 4,
              boxShadow: a.severity === 'critical' ? `0 0 6px ${sev[a.severity].dot}` : 'none',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: sev[a.severity].bg, color: sev[a.severity].color,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{a.severity}</span>
                <span style={{ fontSize: 12, color: '#8C94B0' }}>{a.id}</span>
                <span style={{ fontSize: 12, color: '#8C94B0', marginLeft: 'auto' }}>{a.time}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{a.service}</div>
              <div style={{ fontSize: 13, color: '#636B8A', marginTop: 3 }}>{a.message}</div>
            </div>
            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#EEF1FC', color: '#1428A0', border: 'none', cursor: 'pointer',
              flexShrink: 0,
            }}>Acknowledge</button>
          </div>
        ))}
      </div>
    </div>
  );
}
