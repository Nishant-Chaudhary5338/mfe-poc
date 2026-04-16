const COLOR = '#546BE8';

const rules = [
  { id: 'R-01', name: 'Loudness Normalisation', desc: 'EBU R128 — integrated loudness between -23 and -18 LUFS', category: 'Audio', severity: 'critical', enabled: true },
  { id: 'R-02', name: 'Black Frame Detection', desc: 'Flag sequences of black frames longer than 2 seconds', category: 'Video', severity: 'critical', enabled: true },
  { id: 'R-03', name: 'Aspect Ratio Check', desc: 'Validate 16:9 or 4:3 depending on channel spec', category: 'Video', severity: 'warning', enabled: true },
  { id: 'R-04', name: 'Bitrate Compliance', desc: 'Minimum 4 Mbps for HD, 8 Mbps for UHD content', category: 'Video', severity: 'critical', enabled: true },
  { id: 'R-05', name: 'Caption Validation', desc: 'Ensure subtitles are present and correctly timed for all drama content', category: 'Accessibility', severity: 'warning', enabled: true },
  { id: 'R-06', name: 'Watermark Detection', desc: 'Reject assets with visible third-party watermarks', category: 'Rights', severity: 'critical', enabled: true },
  { id: 'R-07', name: 'Audio Track Count', desc: 'Require at least 2 audio tracks (stereo + 5.1) for sports events', category: 'Audio', severity: 'warning', enabled: false },
  { id: 'R-08', name: 'Frame Rate Check', desc: 'Must match channel spec: 25fps (EU) or 29.97fps (US)', category: 'Video', severity: 'warning', enabled: true },
  { id: 'R-09', name: 'Safe Area Compliance', desc: 'Validate UI overlays do not exceed safe area boundaries', category: 'Video', severity: 'info', enabled: false },
];

const catColor: Record<string, string> = { Video: '#546BE8', Audio: '#F4511E', Accessibility: '#16a34a', Rights: '#dc2626' };
const sevColor: Record<string, string> = { critical: '#dc2626', warning: '#d97706', info: '#3b82f6' };
const sevBg: Record<string, string>    = { critical: '#fef2f2', warning: '#fffbeb', info: '#eff6ff' };

export default function Rules() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>QC Rules</h2>
          <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>7 active · 2 disabled · Across 4 categories</p>
        </div>
        <button style={{
          padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: COLOR, color: 'white', border: 'none', cursor: 'pointer',
        }}>+ New Rule</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map(r => (
          <div key={r.id} style={{
            background: 'white', borderRadius: 12, padding: '15px 20px',
            border: '1px solid #ECEEF5', display: 'flex', alignItems: 'center', gap: 14,
            opacity: r.enabled ? 1 : 0.55,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8C94B0', fontFamily: "'DM Mono', monospace", width: 36, flexShrink: 0 }}>{r.id}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1E2235' }}>{r.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  background: (catColor[r.category] || '#636B8A') + '18',
                  color: catColor[r.category] || '#636B8A',
                }}>{r.category}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  background: sevBg[r.severity], color: sevColor[r.severity],
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>{r.severity}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8C94B0' }}>{r.desc}</div>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: r.enabled ? COLOR : '#D6D9E8',
              position: 'relative', cursor: 'pointer', flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3, left: r.enabled ? 23 : 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
