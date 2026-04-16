const stats = [
  { label: 'Total Views Today', value: '4.2M', delta: '+18%', up: true },
  { label: 'Peak Concurrent', value: '266K', delta: '+34%', up: true },
  { label: 'Avg Watch Time', value: '38m', delta: '+4m', up: true },
  { label: 'Completion Rate', value: '67%', delta: '-2%', up: false },
];

const top = [
  { rank: 1, title: 'UEFA Champions League Final 2025', channel: 'Sports', views: '1.84M', watch: '92m', complete: '88%' },
  { rank: 2, title: 'The Crown S03E07', channel: 'Drama', views: '284K', watch: '52m', complete: '74%' },
  { rank: 3, title: 'Evening News 22:00', channel: 'News', views: '221K', watch: '28m', complete: '91%' },
  { rank: 4, title: 'Peppa Pig — S06E21', channel: 'Kids', views: '188K', watch: '22m', complete: '95%' },
  { rank: 5, title: 'Climate Change Documentary', channel: 'Entertainment', views: '112K', watch: '84m', complete: '61%' },
];

const byChannel = [
  { channel: 'Sports', share: 62, color: '#1428A0' },
  { channel: 'News', share: 15, color: '#636B8A' },
  { channel: 'Drama', share: 12, color: '#7c3aed' },
  { channel: 'Kids', share: 6, color: '#F4511E' },
  { channel: 'Entertainment', share: 5, color: '#0891b2' },
];

const COLOR = '#0D1B70';

export default function Analytics() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Analytics</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Content performance — today · 10 June 2025</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #ECEEF5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 12, color: '#8C94B0', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: COLOR, fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.up ? '#16a34a' : '#dc2626', marginTop: 4, fontWeight: 500 }}>{s.delta} vs yesterday</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Top content */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Top Content</h3>
          <div style={{
            background: 'white', borderRadius: 12, border: '1px solid #ECEEF5',
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {top.map((t, i) => (
              <div key={t.title} style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: i < top.length - 1 ? '1px solid #F7F8FC' : 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#D6D9E8', width: 24, textAlign: 'center', fontFamily: "'Sora', sans-serif" }}>#{t.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2235', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{t.channel} · {t.watch} avg · {t.complete} complete</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLOR, fontFamily: "'Sora', sans-serif" }}>{t.views}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Views by channel */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Views by Channel</h3>
          <div style={{
            background: 'white', borderRadius: 12, border: '1px solid #ECEEF5', padding: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {byChannel.map(c => (
              <div key={c.channel} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E2235' }}>{c.channel}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.share}%</span>
                </div>
                <div style={{ height: 6, background: '#ECEEF5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${c.share}%`,
                    background: c.color, borderRadius: 3,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
