const channels = [
  { name: 'Sports', id: 'CH-01', liveNow: 'UEFA Champions League Final 2025', viewers: '184,231', nextUp: 'Premier League Preview', color: '#1428A0', status: 'live' },
  { name: 'News', id: 'CH-02', liveNow: 'Evening Bulletin — 22:00', viewers: '42,100', nextUp: 'Late Night Update', color: '#636B8A', status: 'live' },
  { name: 'Drama', id: 'CH-03', liveNow: 'The Crown S03E07', viewers: '28,540', nextUp: 'Downton Abbey S06E08', color: '#7c3aed', status: 'live' },
  { name: 'Kids', id: 'CH-04', liveNow: 'Offline — Night Schedule', viewers: '0', nextUp: 'Peppa Pig at 06:00', color: '#F4511E', status: 'offline' },
  { name: 'Entertainment', id: 'CH-05', liveNow: 'Climate Documentary', viewers: '11,200', nextUp: 'Travel Special', color: '#0891b2', status: 'live' },
];

export default function Channels() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Channels</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>4 live · 1 offline · 266,071 total viewers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {channels.map(ch => (
          <div key={ch.id} style={{
            background: 'white', borderRadius: 14, overflow: 'hidden',
            border: '1px solid #ECEEF5', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {/* Channel header */}
            <div style={{
              background: `linear-gradient(135deg, ${ch.color} 0%, ${ch.color}99 100%)`,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, color: 'white',
              }}>{ch.name[0]}</div>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: 'white' }}>{ch.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{ch.id}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: ch.status === 'live' ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.15)',
                  color: ch.status === 'live' ? '#4ade80' : 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{ch.status === 'live' ? '● LIVE' : 'OFFLINE'}</span>
              </div>
            </div>

            {/* Channel body */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#8C94B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Now Playing</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E2235' }}>{ch.liveNow}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8C94B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Next Up</div>
                  <div style={{ fontSize: 13, color: '#636B8A' }}>{ch.nextUp}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#8C94B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Viewers</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ch.color, fontFamily: "'Sora', sans-serif" }}>{ch.viewers}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
