const COLOR = '#546BE8';

const integrations = [
  { name: 'MAM Integration', desc: 'Automatically trigger QC when new assets are ingested', enabled: true },
  { name: 'Slack Notifications', desc: 'Post QC results to #qc-alerts on grade D or F', enabled: true },
  { name: 'Auto-reject on Fail', desc: 'Block publishing for assets that fail critical rules', enabled: true },
  { name: 'Weekly Digest', desc: 'Email weekly QC summary to content-ops@tvplus.com', enabled: false },
];

const channels = [
  { name: 'Sports', rules: 14, lastRun: 'Today 14:22', passRate: '98.2%' },
  { name: 'News', rules: 10, lastRun: 'Today 09:05', passRate: '100%' },
  { name: 'Drama', rules: 14, lastRun: 'Today 12:44', passRate: '78.6%' },
  { name: 'Kids', rules: 12, lastRun: 'Yesterday 22:30', passRate: '83.3%' },
];

export default function Settings() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Settings</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Integrations and per-channel rule configuration</p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Integrations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {integrations.map(i => (
            <div key={i.name} style={{
              background: 'white', borderRadius: 10, padding: '14px 18px',
              border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{i.name}</div>
                <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{i.desc}</div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: i.enabled ? COLOR : '#D6D9E8',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: i.enabled ? 23 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Channel Rule Sets</h3>
        <div style={{
          background: 'white', borderRadius: 10, border: '1px solid #ECEEF5', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #ECEEF5' }}>
                {['Channel', 'Active Rules', 'Last Run', 'Pass Rate'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C94B0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((c, i) => (
                <tr key={c.name} style={{ borderBottom: i < channels.length - 1 ? '1px solid #F7F8FC' : 'none' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1E2235' }}>{c.name}</td>
                  <td style={{ padding: '13px 16px', color: '#636B8A' }}>{c.rules}</td>
                  <td style={{ padding: '13px 16px', color: '#636B8A', fontSize: 12 }}>{c.lastRun}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: parseFloat(c.passRate) > 90 ? '#16a34a' : '#d97706' }}>{c.passRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
