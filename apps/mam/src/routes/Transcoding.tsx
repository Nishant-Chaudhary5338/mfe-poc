const jobs = [
  { id: 'TC-8821', asset: 'UEFA_Final_2025_RAW.mp4', from: '4K RAW ProRes', to: 'H.265 4K + H.264 1080p + HLS ABR', progress: 62, eta: '4m 30s', status: 'running', worker: 'TF-01' },
  { id: 'TC-8820', asset: 'News_Bulletin_Morning.mxf', from: '1080i ProRes', to: 'H.264 1080p + H.264 720p', progress: 100, eta: '—', status: 'complete', worker: 'TF-02' },
  { id: 'TC-8819', asset: 'Kids_S04E01_Rough.mov', from: '1080p H.264', to: 'H.265 1080p + H.264 720p', progress: 88, eta: '45s', status: 'running', worker: 'TF-01' },
  { id: 'TC-8818', asset: 'Drama_S03E08_Master.mp4', from: '1080p H.264', to: 'H.265 1080p + HLS ABR', progress: 0, eta: 'Queued', status: 'queued', worker: '—' },
  { id: 'TC-8817', asset: 'Sports_Highlights_Clip.mp4', from: '4K H.265', to: 'H.264 1080p', progress: 100, eta: '—', status: 'complete', worker: 'TF-03' },
  { id: 'TC-8816', asset: 'Archive_Footage_1998.mpg', from: 'MPEG-2 SD', to: 'H.264 720p (upscale)', progress: 0, eta: '—', status: 'failed', worker: 'TF-03' },
];

const sColor: Record<string, string> = { running: '#1428A0', complete: '#16a34a', queued: '#8C94B0', failed: '#dc2626' };
const sBg: Record<string, string>    = { running: '#EEF1FC', complete: '#f0fdf4', queued: '#F7F8FC', failed: '#fef2f2' };

export default function Transcoding() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Transcoding Jobs</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>2 running · 1 queued · 2 complete · 1 failed</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobs.map(j => (
          <div key={j.id} style={{
            background: 'white', borderRadius: 12, padding: '16px 20px',
            border: '1px solid #ECEEF5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: j.status === 'running' ? 12 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8C94B0', fontFamily: "'DM Mono', monospace" }}>{j.id}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1E2235' }}>{j.asset}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8C94B0', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", background: '#F7F8FC', padding: '1px 6px', borderRadius: 4 }}>{j.from}</span>
                  <span>→</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", background: '#F7F8FC', padding: '1px 6px', borderRadius: 4, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.to}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: sBg[j.status], color: sColor[j.status], textTransform: 'capitalize',
                }}>{j.status}</span>
                <span style={{ fontSize: 11, color: '#8C94B0' }}>Worker: {j.worker}</span>
                <span style={{ fontSize: 11, color: '#8C94B0' }}>ETA: {j.eta}</span>
              </div>
            </div>

            {j.status === 'running' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#8C94B0' }}>Transcoding</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#F4511E' }}>{j.progress}%</span>
                </div>
                <div style={{ height: 5, background: '#ECEEF5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${j.progress}%`,
                    background: 'linear-gradient(90deg, #F4511E, #FC6A47)',
                    borderRadius: 3,
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
