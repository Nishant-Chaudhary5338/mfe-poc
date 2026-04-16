const COLOR = '#0D1B70';

const items = [
  { id: 'C-1001', title: 'UEFA Champions League Final 2025 — Full Match', type: 'Programme', channel: 'Sports', status: 'live', modified: '1h ago', author: 'Content Team' },
  { id: 'C-1002', title: 'Evening News — 10 Jun 2025', type: 'Bulletin', channel: 'News', status: 'live', modified: '2h ago', author: 'News Desk' },
  { id: 'C-1003', title: 'The Crown Season 3 — Episode 7', type: 'Episode', channel: 'Drama', status: 'scheduled', modified: '4h ago', author: 'Drama Editorial' },
  { id: 'C-1004', title: 'Peppa Pig — Series 6, Episode 21', type: 'Episode', channel: 'Kids', status: 'live', modified: 'Yesterday', author: 'Kids Team' },
  { id: 'C-1005', title: 'Premier League Highlights — Matchday 38', type: 'Highlights', channel: 'Sports', status: 'draft', modified: 'Yesterday', author: 'Sports Editorial' },
  { id: 'C-1006', title: 'Climate Change Documentary — Full Film', type: 'Documentary', channel: 'Entertainment', status: 'draft', modified: '2 days ago', author: 'Content Team' },
];

const statusColor: Record<string, string> = { live: '#16a34a', scheduled: '#1428A0', draft: '#8C94B0' };
const statusBg: Record<string, string>    = { live: '#f0fdf4', scheduled: '#EEF1FC', draft: '#F7F8FC' };
const channelColor: Record<string, string> = { Sports: '#1428A0', News: '#636B8A', Drama: '#7c3aed', Kids: '#F4511E', Entertainment: '#0891b2' };

export default function Content() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Content</h2>
          <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>3 live · 1 scheduled · 2 draft</p>
        </div>
        <button style={{
          padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: COLOR, color: 'white', border: 'none', cursor: 'pointer',
        }}>+ New Content</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(c => (
          <div key={c.id} style={{
            background: 'white', borderRadius: 12, padding: '15px 20px',
            border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1E2235' }}>{c.title}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8C94B0', display: 'flex', gap: 12 }}>
                <span>{c.id}</span>
                <span>{c.type}</span>
                <span>By {c.author}</span>
                <span>Modified {c.modified}</span>
              </div>
            </div>

            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10,
              background: (channelColor[c.channel] || '#636B8A') + '18',
              color: channelColor[c.channel] || '#636B8A',
            }}>{c.channel}</span>

            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
              background: statusBg[c.status], color: statusColor[c.status],
              textTransform: 'capitalize',
            }}>
              {c.status === 'live' ? '● ' : ''}{c.status}
            </span>

            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#EEF1FC', color: COLOR, border: 'none', cursor: 'pointer',
            }}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}
