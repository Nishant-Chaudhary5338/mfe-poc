const COLOR = '#546BE8';

const stats = [
  { label: 'Checks Today', value: '284', sub: '↑ 12 vs yesterday', color: '#546BE8' },
  { label: 'Pass Rate', value: '96.4%', sub: '274 passed · 10 failed', color: '#16a34a' },
  { label: 'Avg Check Time', value: '2.8s', sub: 'P95: 8.4s', color: '#636B8A' },
  { label: 'Assets Pending', value: '17', sub: 'in review queue', color: '#d97706' },
];

const recent = [
  { asset: 'UEFA_Final_2025_RAW.mp4', check: 'Loudness Normalisation', result: 'pass', grade: 'A', time: '2m ago' },
  { asset: 'News_Bulletin_Morning.mxf', check: 'Black Frame Detection', result: 'pass', grade: 'A', time: '5m ago' },
  { asset: 'Drama_S03E08_Master.mp4', check: 'Bitrate Compliance', result: 'fail', grade: 'F', time: '8m ago' },
  { asset: 'Kids_S04E01_Rough.mov', check: 'Caption Validation', result: 'warning', grade: 'C', time: '12m ago' },
  { asset: 'Sports_Highlights_Clip.mp4', check: 'Aspect Ratio Check', result: 'pass', grade: 'A', time: '15m ago' },
];

const rColor: Record<string, string> = { pass: '#16a34a', fail: '#dc2626', warning: '#d97706' };
const rBg: Record<string, string>    = { pass: '#f0fdf4', fail: '#fef2f2', warning: '#fffbeb' };
const gColor: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#d97706', D: '#ea580c', F: '#dc2626' };

export default function Dashboard() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>QC Dashboard</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Automated quality checks across all TVPlus content</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #ECEEF5', borderTop: `3px solid ${s.color}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 12, color: '#8C94B0', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent checks */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343A56', marginBottom: 14 }}>Recent Checks</h3>
      <div style={{
        background: 'white', borderRadius: 12, border: '1px solid #ECEEF5',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {recent.map((r, i) => (
          <div key={r.asset + r.check} style={{
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: i < recent.length - 1 ? '1px solid #F7F8FC' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: gColor[r.grade] + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16,
              color: gColor[r.grade],
            }}>{r.grade}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2235', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.asset}</div>
              <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>{r.check}</div>
            </div>
            <span style={{ fontSize: 11, color: '#B5BACE' }}>{r.time}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
              background: rBg[r.result], color: rColor[r.result],
              textTransform: 'capitalize',
            }}>{r.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
