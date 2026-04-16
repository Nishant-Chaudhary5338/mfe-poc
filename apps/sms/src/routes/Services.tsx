const services = [
  { name: 'CDN Edge Network', owner: 'Infrastructure', sla: '99.95%', actual: '99.98%', p50: '8ms', p95: '24ms', p99: '48ms', status: 'healthy', region: 'Global · 12 PoPs' },
  { name: 'Live Ingest Pipeline', owner: 'Platform', sla: '99.90%', actual: '99.95%', p50: '28ms', p95: '80ms', p99: '140ms', status: 'healthy', region: 'EU-West · US-East' },
  { name: 'Transcode Farm', owner: 'Platform', sla: '99.50%', actual: '98.72%', p50: '180ms', p95: '420ms', p99: '890ms', status: 'degraded', region: 'EU-West' },
  { name: 'Playback API', owner: 'Streaming', sla: '99.99%', actual: '99.99%', p50: '5ms', p95: '18ms', p99: '32ms', status: 'healthy', region: 'Global · Multi-region' },
  { name: 'DRM License Server', owner: 'Security', sla: '99.95%', actual: '99.91%', p50: '18ms', p95: '120ms', p99: '510ms', status: 'warning', region: 'EU-West · US-East' },
  { name: 'Ad Insertion (SSAI)', owner: 'Monetisation', sla: '99.50%', actual: '97.40%', p50: '35ms', p95: '95ms', p99: '210ms', status: 'warning', region: 'EU-West' },
  { name: 'EPG / Metadata API', owner: 'Content', sla: '99.90%', actual: '99.97%', p50: '12ms', p95: '35ms', p99: '60ms', status: 'healthy', region: 'Global' },
  { name: 'User Auth Service', owner: 'Identity', sla: '99.99%', actual: '99.99%', p50: '22ms', p95: '55ms', p99: '90ms', status: 'healthy', region: 'Global · Active-Active' },
];

const sColor: Record<string, string> = { healthy: '#16a34a', degraded: '#d97706', warning: '#ea580c' };
const sBg: Record<string, string>    = { healthy: '#f0fdf4', degraded: '#fffbeb', warning: '#fff7ed' };

export default function Services() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Services</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>SLA tracking across all monitored services</p>
      </div>

      <div style={{
        background: 'white', borderRadius: 12, border: '1px solid #ECEEF5',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #ECEEF5' }}>
              {['Service', 'Owner', 'Region', 'SLA Target', 'Actual (30d)', 'P50', 'P95', 'P99', 'Status'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '12px 16px',
                  fontSize: 11, fontWeight: 600, color: '#8C94B0', letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={s.name} style={{ borderBottom: i < services.length - 1 ? '1px solid #F7F8FC' : 'none' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1E2235' }}>{s.name}</td>
                <td style={{ padding: '14px 16px', color: '#636B8A' }}>{s.owner}</td>
                <td style={{ padding: '14px 16px', color: '#636B8A', fontSize: 12 }}>{s.region}</td>
                <td style={{ padding: '14px 16px', color: '#8C94B0' }}>{s.sla}</td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: parseFloat(s.actual) >= parseFloat(s.sla) ? '#16a34a' : '#dc2626' }}>{s.actual}</td>
                <td style={{ padding: '14px 16px', color: '#636B8A', fontFamily: "'DM Mono', monospace" }}>{s.p50}</td>
                <td style={{ padding: '14px 16px', color: '#636B8A', fontFamily: "'DM Mono', monospace" }}>{s.p95}</td>
                <td style={{ padding: '14px 16px', color: '#636B8A', fontFamily: "'DM Mono', monospace" }}>{s.p99}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: sBg[s.status], color: sColor[s.status],
                    textTransform: 'capitalize', letterSpacing: '0.04em',
                  }}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
