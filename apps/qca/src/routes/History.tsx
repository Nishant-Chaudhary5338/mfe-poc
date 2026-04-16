const runs = [
  { date: 'Today', entries: [
    { time: '14:22', asset: 'UEFA_Final_2025_RAW.mp4', checks: 14, pass: 14, fail: 0, grade: 'A' },
    { time: '12:44', asset: 'Drama_S03E08_Master.mp4', checks: 14, pass: 11, fail: 3, grade: 'D' },
    { time: '09:05', asset: 'News_Bulletin_Morning.mxf', checks: 10, pass: 10, fail: 0, grade: 'A' },
  ]},
  { date: 'Yesterday', entries: [
    { time: '22:30', asset: 'Kids_S04E01_Rough.mov', checks: 12, pass: 10, fail: 2, grade: 'C' },
    { time: '18:15', asset: 'Sports_Highlights_Clip.mp4', checks: 8, pass: 8, fail: 0, grade: 'A' },
    { time: '15:02', asset: 'Entertainment_Live_Stream_Backup.ts', checks: 14, pass: 14, fail: 0, grade: 'A' },
    { time: '11:44', asset: 'Documentary_Climate_2025.mp4', checks: 14, pass: 9, fail: 5, grade: 'F' },
  ]},
];

const gColor: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#d97706', D: '#ea580c', F: '#dc2626' };

export default function History() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>QC History</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>All quality check runs in chronological order</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {runs.map(group => (
          <div key={group.date}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#8C94B0',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10,
            }}>{group.date}</div>

            <div style={{
              background: 'white', borderRadius: 12, border: '1px solid #ECEEF5',
              overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {group.entries.map((e, i) => (
                <div key={e.time + e.asset} style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  borderBottom: i < group.entries.length - 1 ? '1px solid #F7F8FC' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: '#B5BACE', fontFamily: "'DM Mono', monospace", width: 40, flexShrink: 0 }}>{e.time}</span>

                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: gColor[e.grade] + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14,
                    color: gColor[e.grade],
                  }}>{e.grade}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2235', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.asset}</div>
                    <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>
                      {e.checks} checks · <span style={{ color: '#16a34a', fontWeight: 600 }}>{e.pass} pass</span>
                      {e.fail > 0 && <> · <span style={{ color: '#dc2626', fontWeight: 600 }}>{e.fail} fail</span></>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
