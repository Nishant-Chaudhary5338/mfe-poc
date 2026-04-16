const COLOR = '#F4511E';

const assets = [
  { id: 'A001', name: 'TVPlus_Champions_League_Final_2025.mp4', type: 'Video', codec: 'H.265', res: '4K UHD', duration: '2h 14m', size: '48.2 GB', status: 'ready', channel: 'Sports' },
  { id: 'A002', name: 'Morning_News_2025_06_10.mxf', type: 'Video', codec: 'ProRes', res: '1080i', duration: '28m', size: '12.4 GB', status: 'ready', channel: 'News' },
  { id: 'A003', name: 'Drama_Series_S03E07_Master.mp4', type: 'Video', codec: 'H.264', res: '1080p', duration: '52m', size: '8.1 GB', status: 'processing', channel: 'Drama' },
  { id: 'A004', name: 'Kids_Cartoon_Episode_21.mp4', type: 'Video', codec: 'H.264', res: '720p', duration: '22m', size: '1.8 GB', status: 'ready', channel: 'Kids' },
  { id: 'A005', name: 'Entertainment_Live_Stream_Backup.ts', type: 'Transport Stream', codec: 'MPEG-2', res: '1080i', duration: '4h 5m', size: '64.7 GB', status: 'ready', channel: 'Entertainment' },
  { id: 'A006', name: 'Documentary_Climate_2025.mp4', type: 'Video', codec: 'H.265', res: '4K', duration: '1h 28m', size: '22.3 GB', status: 'failed', channel: 'Documentary' },
];

const statusColor: Record<string, string> = { ready: '#16a34a', processing: '#d97706', failed: '#dc2626' };
const statusBg: Record<string, string>    = { ready: '#f0fdf4', processing: '#fffbeb', failed: '#fef2f2' };
const channelColor: Record<string, string> = {
  Sports: '#1428A0', News: '#636B8A', Drama: '#7c3aed',
  Kids: '#F4511E', Entertainment: '#0891b2', Documentary: '#16a34a',
};

export default function Library() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Asset Library</h2>
          <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>12,847 assets · 48.2 TB total · 6 shown</p>
        </div>
        <button style={{
          padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: COLOR, color: 'white', border: 'none', cursor: 'pointer',
        }}>+ Upload Asset</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {assets.map(a => (
          <div key={a.id} style={{
            background: 'white', borderRadius: 12, padding: '16px 20px',
            border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            {/* Thumbnail placeholder */}
            <div style={{
              width: 72, height: 44, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${channelColor[a.channel] || '#636B8A'} 0%, #0D1020 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em',
            }}>{a.res}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2235', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
              <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 3, display: 'flex', gap: 12 }}>
                <span>{a.type}</span>
                <span>{a.codec}</span>
                <span>{a.duration}</span>
                <span>{a.size}</span>
              </div>
            </div>

            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
              background: (channelColor[a.channel] || '#636B8A') + '18',
              color: channelColor[a.channel] || '#636B8A',
            }}>{a.channel}</span>

            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: statusBg[a.status], color: statusColor[a.status],
              textTransform: 'capitalize',
            }}>{a.status}</span>

            <button style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#FFF1ED', color: COLOR, border: 'none', cursor: 'pointer',
            }}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
}
