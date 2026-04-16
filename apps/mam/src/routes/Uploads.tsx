const uploads = [
  { name: 'UEFA_Final_2025_RAW.mp4', size: '128.4 GB', progress: 78, speed: '142 MB/s', eta: '2m 14s', status: 'uploading' },
  { name: 'News_Bulletin_Morning.mxf', size: '4.2 GB', progress: 100, speed: '—', eta: '—', status: 'complete' },
  { name: 'Kids_S04E01_Rough.mov', size: '18.7 GB', progress: 45, speed: '98 MB/s', eta: '5m 40s', status: 'uploading' },
  { name: 'Drama_S03E08_Master.mp4', size: '9.1 GB', progress: 0, speed: '—', eta: 'Queued', status: 'queued' },
  { name: 'Documentary_Draft_v2.mp4', size: '31.2 GB', progress: 0, speed: '—', eta: 'Queued', status: 'queued' },
];

const statusColor: Record<string, string> = { uploading: '#1428A0', complete: '#16a34a', queued: '#8C94B0', failed: '#dc2626' };
const statusBg: Record<string, string>    = { uploading: '#EEF1FC', complete: '#f0fdf4', queued: '#F7F8FC', failed: '#fef2f2' };

export default function Uploads() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Upload Queue</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>2 active · 2 queued · 1 complete</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {uploads.map(u => (
          <div key={u.name} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #ECEEF5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: u.status === 'uploading' ? 12 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{u.name}</div>
                <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 3, display: 'flex', gap: 14 }}>
                  <span>{u.size}</span>
                  {u.status === 'uploading' && <span>↑ {u.speed}</span>}
                  <span>ETA: {u.eta}</span>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
                background: statusBg[u.status], color: statusColor[u.status],
                textTransform: 'capitalize',
              }}>{u.status === 'complete' ? '✓ Complete' : u.status}</span>
            </div>

            {u.status === 'uploading' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#8C94B0' }}>Progress</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1428A0' }}>{u.progress}%</span>
                </div>
                <div style={{ height: 6, background: '#ECEEF5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${u.progress}%`,
                    background: 'linear-gradient(90deg, #1428A0, #546BE8)',
                    borderRadius: 3, transition: 'width 300ms ease',
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
