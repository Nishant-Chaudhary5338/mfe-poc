const incidents = [
  {
    id: 'INC-2024-089', priority: 'P1', title: 'Transcode Farm Degraded — Live Sports Event',
    status: 'investigating', started: 'Today 14:22', duration: '38 min',
    services: ['Transcode Farm', 'CDN Edge'], assignee: 'Platform Team',
    summary: 'GPU cluster TF-03 experiencing elevated error rates affecting live sports transcoding pipeline. Redundant jobs rerouted to TF-01.',
  },
  {
    id: 'INC-2024-088', priority: 'P2', title: 'DRM License Server High Latency',
    status: 'monitoring', started: 'Today 12:05', duration: '2h 55m',
    services: ['DRM Service'], assignee: 'Security Team',
    summary: 'DRM license server P99 latency spiked to 520ms following config update. Rolled back to v2.4.1, latency stabilising.',
  },
  {
    id: 'INC-2024-087', priority: 'P2', title: 'Ad Insertion VAST Timeout Spike',
    status: 'resolved', started: 'Yesterday 22:10', duration: '1h 12m',
    services: ['Ad Insertion'], assignee: 'Monetisation Team',
    summary: 'Third-party VAST endpoint intermittent failures caused 12% timeout rate. Fallback ad server activated. Resolved at 23:22.',
  },
  {
    id: 'INC-2024-086', priority: 'P3', title: 'CDN Cache Miss Rate — Amsterdam PoP',
    status: 'resolved', started: '2 days ago', duration: '45 min',
    services: ['CDN Edge — AMS'], assignee: 'Infrastructure Team',
    summary: 'Cache invalidation misconfiguration following CMS publish event. Cache warmed and configuration corrected.',
  },
];

const pColor: Record<string, string> = { P1: '#dc2626', P2: '#f59e0b', P3: '#3b82f6' };
const sColor: Record<string, string> = { investigating: '#dc2626', monitoring: '#f59e0b', resolved: '#16a34a' };
const sBg: Record<string, string> = { investigating: '#fef2f2', monitoring: '#fffbeb', resolved: '#f0fdf4' };

export default function Incidents() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Incidents</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>1 active · 1 monitoring · 2 resolved in last 48h</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {incidents.map(inc => (
          <div key={inc.id} style={{
            background: 'white', borderRadius: 12, padding: 20,
            border: '1px solid #ECEEF5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${pColor[inc.priority]}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                background: pColor[inc.priority], color: 'white', letterSpacing: '0.05em',
              }}>{inc.priority}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2235' }}>{inc.title}</div>
                <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{inc.id} · Started {inc.started} · Duration {inc.duration}</div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                background: sBg[inc.status], color: sColor[inc.status],
                textTransform: 'capitalize',
              }}>{inc.status}</span>
            </div>
            <div style={{ fontSize: 13, color: '#636B8A', lineHeight: 1.6, marginBottom: 12 }}>{inc.summary}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8C94B0' }}>
              <span>Assignee: <strong style={{ color: '#343A56' }}>{inc.assignee}</strong></span>
              <span>Services: {inc.services.map(s => (
                <span key={s} style={{
                  background: '#EEF1FC', color: '#1428A0', padding: '1px 8px',
                  borderRadius: 10, fontSize: 11, fontWeight: 500, marginLeft: 4,
                }}>{s}</span>
              ))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
