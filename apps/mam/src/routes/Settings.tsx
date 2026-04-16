const COLOR = '#F4511E';

const storages = [
  { name: 'Primary — AWS S3 (eu-west-1)', used: '38.2 TB', total: '100 TB', pct: 38, status: 'healthy' },
  { name: 'Nearline — Google Coldline', used: '142.7 TB', total: '500 TB', pct: 28, status: 'healthy' },
  { name: 'Archive — Tape (LTO-9)', used: '1.2 PB', total: '4 PB', pct: 30, status: 'healthy' },
];

const policies = [
  { rule: 'Auto-archive after 90 days of inactivity', enabled: true },
  { rule: 'Delete failed jobs after 7 days', enabled: true },
  { rule: 'Keep 3 transcoded renditions per asset', enabled: false },
  { rule: 'Notify on storage > 80% capacity', enabled: true },
];

export default function Settings() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Settings</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Storage tiers and asset lifecycle policies</p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Storage Tiers</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storages.map(s => (
            <div key={s.name} style={{
              background: 'white', borderRadius: 10, padding: '16px 18px',
              border: '1px solid #ECEEF5', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{s.name}</span>
                <span style={{ fontSize: 13, color: '#636B8A' }}>{s.used} / {s.total}</span>
              </div>
              <div style={{ height: 6, background: '#ECEEF5', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${s.pct}%`,
                  background: `linear-gradient(90deg, ${COLOR}, #FC6A47)`,
                  borderRadius: 3,
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#8C94B0', marginTop: 6 }}>{s.pct}% utilised</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Lifecycle Policies</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {policies.map(p => (
            <div key={p.rule} style={{
              background: 'white', borderRadius: 10, padding: '13px 18px',
              border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ flex: 1, fontSize: 13, color: '#343A56', fontWeight: 500 }}>{p.rule}</span>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: p.enabled ? COLOR : '#D6D9E8',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: p.enabled ? 23 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
