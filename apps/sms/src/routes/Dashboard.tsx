const services = [
  { name: 'CDN Edge', uptime: '99.98%', latency: '12ms', status: 'healthy' },
  { name: 'Ingest Pipeline', uptime: '99.95%', latency: '34ms', status: 'healthy' },
  { name: 'Transcode Farm', uptime: '98.72%', latency: '210ms', status: 'degraded' },
  { name: 'Playback API', uptime: '99.99%', latency: '8ms', status: 'healthy' },
  { name: 'DRM Service', uptime: '99.91%', latency: '22ms', status: 'healthy' },
  { name: 'Ad Insertion', uptime: '97.40%', latency: '45ms', status: 'warning' },
];

const stats = [
  { label: 'Active Streams', value: '184,231', delta: '+3.2%', up: true },
  { label: 'Avg Bitrate', value: '4.8 Mbps', delta: '+0.4', up: true },
  { label: 'Error Rate', value: '0.12%', delta: '-0.03%', up: false },
  { label: 'P95 Latency', value: '94ms', delta: '+2ms', up: true },
];

const statusColor: Record<string, string> = {
  healthy: '#22c55e',
  degraded: '#f59e0b',
  warning: '#f97316',
  critical: '#ef4444',
};

const statusBg: Record<string, string> = {
  healthy: '#f0fdf4',
  degraded: '#fffbeb',
  warning: '#fff7ed',
  critical: '#fef2f2',
};

export default function Dashboard() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>
          Infrastructure Overview
        </h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>
          Live health status across all TVPlus streaming services
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #ECEEF5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 12, color: '#8C94B0', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0D1020', fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.up ? '#16a34a' : '#dc2626', marginTop: 4, fontWeight: 500 }}>
              {s.delta} vs last hour
            </div>
          </div>
        ))}
      </div>

      {/* Service health grid */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#343A56', marginBottom: 14 }}>Service Health</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {services.map(s => (
          <div key={s.name} style={{
            background: 'white', borderRadius: 12, padding: 18,
            border: '1px solid #ECEEF5',
            borderLeft: `4px solid ${statusColor[s.status]}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{s.name}</div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                background: statusBg[s.status], color: statusColor[s.status],
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{s.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8C94B0' }}>Uptime</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0D1020' }}>{s.uptime}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8C94B0' }}>Latency</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0D1020' }}>{s.latency}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
