const reports = [
  { id: 'QCR-0441', asset: 'UEFA_Final_2025_RAW.mp4', channel: 'Sports', checks: 14, passed: 14, failed: 0, grade: 'A', date: '2025-06-10 14:22', duration: '3m 12s' },
  { id: 'QCR-0440', asset: 'Drama_S03E08_Master.mp4', channel: 'Drama', checks: 14, passed: 11, failed: 3, grade: 'D', date: '2025-06-10 12:44', duration: '2m 58s' },
  { id: 'QCR-0439', asset: 'News_Bulletin_Morning.mxf', channel: 'News', checks: 10, passed: 10, failed: 0, grade: 'A', date: '2025-06-10 09:05', duration: '1m 44s' },
  { id: 'QCR-0438', asset: 'Kids_S04E01_Rough.mov', channel: 'Kids', checks: 12, passed: 10, failed: 2, grade: 'C', date: '2025-06-09 22:30', duration: '2m 22s' },
  { id: 'QCR-0437', asset: 'Sports_Highlights_Clip.mp4', channel: 'Sports', checks: 8, passed: 8, failed: 0, grade: 'A', date: '2025-06-09 18:15', duration: '0m 58s' },
];

const gColor: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#d97706', D: '#ea580c', F: '#dc2626' };
const channelColor: Record<string, string> = { Sports: '#1428A0', News: '#636B8A', Drama: '#7c3aed', Kids: '#F4511E' };

export default function Reports() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>QC Reports</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Detailed results for all quality check runs</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reports.map(r => (
          <div key={r.id} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #ECEEF5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            {/* Grade badge */}
            <div style={{
              width: 52, height: 52, borderRadius: 10, flexShrink: 0,
              background: gColor[r.grade] + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 22,
              color: gColor[r.grade],
            }}>{r.grade}</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1E2235' }}>{r.asset}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                  background: (channelColor[r.channel] || '#636B8A') + '18',
                  color: channelColor[r.channel] || '#636B8A',
                }}>{r.channel}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8C94B0', display: 'flex', gap: 16 }}>
                <span>{r.id}</span>
                <span>{r.checks} checks · <span style={{ color: '#16a34a', fontWeight: 600 }}>{r.passed} pass</span> · <span style={{ color: r.failed > 0 ? '#dc2626' : '#8C94B0', fontWeight: r.failed > 0 ? 600 : 400 }}>{r.failed} fail</span></span>
                <span>{r.duration}</span>
                <span>{r.date}</span>
              </div>
            </div>

            <button style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#EEF1FC', color: '#546BE8', border: 'none', cursor: 'pointer',
            }}>View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}
