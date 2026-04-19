import { useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:5001/api/mock/articles';

const COLS = [
  { key: 'title', label: 'Title', type: 'text', bold: true },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'author', label: 'Author', type: 'text' },
  { key: 'createdAt', label: 'Created', type: 'date' },
  { key: 'tags', label: 'Tags', type: 'tags' },
];

const STATUS_COLORS: Record<string, [string, string]> = {
  draft:        ['#FFF7ED', '#C2410C'],
  published:    ['#F0FDF4', '#15803D'],
  archived:     ['#F1F5F9', '#64748B'],
  ready:        ['#F0FDF4', '#15803D'],
  processing:   ['#EFF6FF', '#1D4ED8'],
  error:        ['#FEF2F2', '#DC2626'],
  open:         ['#FEF2F2', '#DC2626'],
  investigating:['#FFF7ED', '#C2410C'],
  resolved:     ['#F0FDF4', '#15803D'],
  low:          ['#F0FDF4', '#15803D'],
  medium:       ['#FFFBEB', '#D97706'],
  high:         ['#FFF0F0', '#DC2626'],
  critical:     ['#FDF4FF', '#9333EA'],
};

type Row = Record<string, any>;
type Col = { key: string; label: string; type?: string; bold?: boolean };

function Cell({ col, row }: { col: Col; row: Row }) {
  const v = row[col.key];
  if (col.type === 'badge') {
    const [bg, color] = STATUS_COLORS[String(v)] ?? ['#F1F5F9', '#64748B'];
    return (
      <td style={{ padding: '13px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color, textTransform: 'capitalize', letterSpacing: '0.04em' }}>{String(v)}</span>
      </td>
    );
  }
  if (col.type === 'date') {
    return <td style={{ padding: '13px 16px', color: '#8C94B0', fontSize: 12 }}>{v ? new Date(v).toLocaleDateString() : '—'}</td>;
  }
  if (col.type === 'tags') {
    return (
      <td style={{ padding: '13px 16px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(Array.isArray(v) ? v : []).map((t: string) => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EEF2FF', color: '#4F46E5' }}>{t}</span>
          ))}
        </div>
      </td>
    );
  }
  return <td style={{ padding: '13px 16px', fontWeight: col.bold ? 600 : 400, color: col.bold ? '#1E2235' : '#636B8A' }}>{String(v ?? '—')}</td>;
}

export default function Articles() {
  const [allData, setAllData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(BASE_URL)
      .then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
      .then(d => { setAllData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  const allStatuses = [...new Set(allData.map((r) => r['status']).filter(Boolean))];
  const data = filter ? allData.filter(r => r['status'] === filter) : allData;

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Articles</h2>
          <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Content articles with status, author, and tags</p>
        </div>
        {allStatuses.length > 0 && (
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{
            padding: '7px 12px', borderRadius: 7, border: '1.5px solid #E2E8F0',
            background: 'white', fontSize: 12, color: '#475569', cursor: 'pointer', outline: 'none',
          }}>
            <option value=''>All</option>
            {allStatuses.map(s => <option key={s} value={String(s)}>{String(s)}</option>)}
          </select>
        )}
      </div>

      {loading && (
        <div style={{ color: '#8C94B0', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>Loading…</div>
      )}
      {error && (
        <div style={{ color: '#DC2626', background: '#FEF2F2', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
          Failed to load: {error}
        </div>
      )}
      {!loading && !error && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ECEEF5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #ECEEF5' }}>
                {COLS.map(c => (
                  <th key={c.key} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#8C94B0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: Row, i: number) => (
                <tr key={row.id ?? i} style={{ borderBottom: i < data.length - 1 ? '1px solid #F7F8FC' : 'none' }}>
                  {COLS.map(col => <Cell key={col.key} col={col} row={row} />)}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} style={{ padding: '32px 16px', textAlign: 'center', color: '#8C94B0', fontSize: 13 }}>
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
