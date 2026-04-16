const COLOR = '#1428A0';

const channels = [
  { name: 'PagerDuty', desc: 'On-call escalation for P1/P2 incidents', enabled: true },
  { name: 'Slack #ops-alerts', desc: 'Real-time alert notifications', enabled: true },
  { name: 'Email digest', desc: 'Daily summary to infra-team@tvplus.com', enabled: false },
  { name: 'SMS (on-call)', desc: 'Critical alerts to on-call engineer', enabled: true },
];

const thresholds = [
  { metric: 'Error Rate', warn: '2%', critical: '5%' },
  { metric: 'Latency P95', warn: '200ms', critical: '500ms' },
  { metric: 'CPU Utilisation', warn: '80%', critical: '95%' },
  { metric: 'Cache Hit Ratio', warn: '85%', critical: '75%' },
];

export default function Settings() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Settings</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Alert channels and threshold configuration</p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Notification Channels</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {channels.map(c => (
            <div key={c.name} style={{
              background: 'white', borderRadius: 10, padding: '14px 18px',
              border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{c.desc}</div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: c.enabled ? COLOR : '#D6D9E8',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: c.enabled ? 23 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Alert Thresholds</h3>
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #ECEEF5', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #ECEEF5' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C94B0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metric</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warning</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((t, i) => (
                <tr key={t.metric} style={{ borderBottom: i < thresholds.length - 1 ? '1px solid #F7F8FC' : 'none' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1E2235' }}>{t.metric}</td>
                  <td style={{ padding: '13px 16px', color: '#b45309', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{t.warn}</td>
                  <td style={{ padding: '13px 16px', color: '#dc2626', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{t.critical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
