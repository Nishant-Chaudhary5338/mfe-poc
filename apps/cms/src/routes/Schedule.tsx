const slots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

const grid: Record<string, Record<string, { title: string; type: string }>> = {
  '06:00': { Sports: { title: 'Morning Sport Roundup', type: 'Magazine' }, News: { title: 'Morning News', type: 'Bulletin' }, Drama: { title: 'Classic Drama', type: 'Repeat' }, Kids: { title: 'Peppa Pig', type: 'Episode' }, Entertainment: { title: 'Travel Show', type: 'Documentary' } },
  '08:00': { Sports: { title: 'Live: Tennis Wimbledon', type: 'Live' }, News: { title: 'News at 8', type: 'Bulletin' }, Drama: { title: 'Downton Abbey', type: 'Episode' }, Kids: { title: 'Bluey', type: 'Episode' }, Entertainment: { title: 'Chef Special', type: 'Magazine' } },
  '10:00': { Sports: { title: 'Premier League Preview', type: 'Preview' }, News: { title: 'Market Update', type: 'Special' }, Drama: { title: 'The Crown S03', type: 'Episode' }, Kids: { title: 'Hey Duggee', type: 'Episode' }, Entertainment: { title: 'Cooking Show', type: 'Episode' } },
  '12:00': { Sports: { title: 'Midday Sport', type: 'Magazine' }, News: { title: 'Lunchtime News', type: 'Bulletin' }, Drama: { title: 'Bridgerton S02', type: 'Episode' }, Kids: { title: 'Animated Special', type: 'Movie' }, Entertainment: { title: 'Quiz Show', type: 'Game Show' } },
  '14:00': { Sports: { title: 'Golf: US Open', type: 'Live' }, News: { title: 'Afternoon Update', type: 'Bulletin' }, Drama: { title: 'Peaky Blinders', type: 'Episode' }, Kids: { title: 'Afternoon Movie', type: 'Movie' }, Entertainment: { title: 'Talk Show', type: 'Entertainment' } },
  '16:00': { Sports: { title: 'F1: Monaco Qualifying', type: 'Live' }, News: { title: 'Evening Headline', type: 'Bulletin' }, Drama: { title: 'Line of Duty', type: 'Episode' }, Kids: { title: 'CBBC Block', type: 'Block' }, Entertainment: { title: 'Reality Show', type: 'Entertainment' } },
  '18:00': { Sports: { title: 'Champions League Final', type: 'Live' }, News: { title: 'Six O\'Clock News', type: 'Bulletin' }, Drama: { title: 'Slow Horses', type: 'Episode' }, Kids: { title: 'Bedtime Stories', type: 'Special' }, Entertainment: { title: 'Film: Interstellar', type: 'Movie' } },
  '20:00': { Sports: { title: 'Post-Match Analysis', type: 'Analysis' }, News: { title: 'Ten O\'Clock News', type: 'Bulletin' }, Drama: { title: 'Happy Valley', type: 'Episode' }, Kids: { title: 'Offline', type: '—' }, Entertainment: { title: 'Late Show', type: 'Entertainment' } },
  '22:00': { Sports: { title: 'Sports Tonight', type: 'Magazine' }, News: { title: 'Late News', type: 'Bulletin' }, Drama: { title: 'Binge Hour', type: 'Block' }, Kids: { title: 'Offline', type: '—' }, Entertainment: { title: 'Night Cinema', type: 'Movie' } },
};

const channels = ['Sports', 'News', 'Drama', 'Kids', 'Entertainment'];
const chColor: Record<string, string> = { Sports: '#1428A0', News: '#636B8A', Drama: '#7c3aed', Kids: '#F4511E', Entertainment: '#0891b2' };
const typeColor: Record<string, string> = { Live: '#dc2626', Bulletin: '#636B8A', Episode: '#0D1B70' };

export default function Schedule() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Schedule — Today</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Programme grid for 10 June 2025 · All times BST</p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ECEEF5', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #ECEEF5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8C94B0', textTransform: 'uppercase', letterSpacing: '0.05em', width: 70 }}>Time</th>
              {channels.map(ch => (
                <th key={ch} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: chColor[ch] }}>{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => (
              <tr key={slot} style={{ borderBottom: i < slots.length - 1 ? '1px solid #F7F8FC' : 'none' }}>
                <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#8C94B0', fontFamily: "'DM Mono', monospace" }}>{slot}</td>
                {channels.map(ch => {
                  const prog = grid[slot]?.[ch];
                  return (
                    <td key={ch} style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      {prog && (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E2235', marginBottom: 3, lineHeight: 1.3 }}>{prog.title}</div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6,
                            background: (typeColor[prog.type] || '#636B8A') + '18',
                            color: typeColor[prog.type] || '#636B8A',
                          }}>{prog.type}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
