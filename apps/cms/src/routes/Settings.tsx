const COLOR = '#0D1B70';

const workflows = [
  { name: 'QC Gate before Publish', desc: 'Require QCA pass before content can go live', enabled: true },
  { name: 'Auto-publish on Schedule', desc: 'Publish content automatically at scheduled time', enabled: true },
  { name: 'Slack Publish Notifications', desc: 'Notify #content-ops when content goes live', enabled: true },
  { name: 'Draft Lock after 7 days', desc: 'Archive stale drafts older than 7 days', enabled: false },
];

const editors = [
  { name: 'Sarah Mitchell', role: 'Senior Editor', channel: 'Sports', lastActive: '5m ago' },
  { name: 'James Okafor', role: 'News Editor', channel: 'News', lastActive: '12m ago' },
  { name: 'Priya Sharma', role: 'Content Producer', channel: 'Drama', lastActive: '1h ago' },
  { name: 'Tom Eriksson', role: 'Kids Content Lead', channel: 'Kids', lastActive: 'Yesterday' },
];

const channelColor: Record<string, string> = { Sports: '#1428A0', News: '#636B8A', Drama: '#7c3aed', Kids: '#F4511E' };

export default function Settings() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Settings</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Publishing workflows and editorial team</p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Workflow Rules</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workflows.map(w => (
            <div key={w.name} style={{
              background: 'white', borderRadius: 10, padding: '14px 18px',
              border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{w.name}</div>
                <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{w.desc}</div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: w.enabled ? COLOR : '#D6D9E8',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: w.enabled ? 23 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Editorial Team</h3>
        <div style={{
          background: 'white', borderRadius: 10, border: '1px solid #ECEEF5', overflow: 'hidden',
        }}>
          {editors.map((e, i) => (
            <div key={e.name} style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < editors.length - 1 ? '1px solid #F7F8FC' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${channelColor[e.channel] || '#636B8A'} 0%, ${COLOR} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color: 'white',
              }}>{e.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{e.name}</div>
                <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{e.role}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10,
                background: (channelColor[e.channel] || '#636B8A') + '18',
                color: channelColor[e.channel] || '#636B8A',
              }}>{e.channel}</span>
              <span style={{ fontSize: 12, color: '#B5BACE' }}>{e.lastActive}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
