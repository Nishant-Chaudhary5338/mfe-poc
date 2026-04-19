import { cap } from '../utils.js';

export function genDetailPage({ pageName, endpoint, fields = [] }) {
  const PName = cap(pageName);
  // Human-readable title with spaces: "Article" → "Article"
  const title = PName.replace(/([A-Z])/g, ' $1').trim();
  const rows = fields.length
    ? fields.map(f => `            <tr key="${f.name}" className="border-b last:border-0">
              <td className="py-3 px-4 text-sm font-semibold text-gray-600 w-40">${f.label || cap(f.name)}</td>
              <td className="py-3 px-4 text-sm text-gray-900">{String(data?.['${f.name}'] ?? '\u2014')}</td>
            </tr>`).join('\n')
    : `            {data && Object.entries(data).map(([k, v]) => (
              <tr key={k} className="border-b last:border-0">
                <td className="py-3 px-4 text-sm font-semibold text-gray-600 w-40">{k}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{String(v ?? '\u2014')}</td>
              </tr>
            ))}`;

  return `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Skeleton, Alert, AlertDescription } from '@repo/shared-ui';

export default function ${PName}DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('${endpoint}'.replace(':id', id ?? ''), {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') ?? '') },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load (' + r.status + ')'); return r.json(); })
      .then((d: Record<string, unknown>) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (error) return <div className="p-6"><Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert></div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-1">\u2190 Back</Button>
          <h1 className="text-2xl font-bold text-gray-900">${title}</h1>
          {data?.id != null && <p className="text-sm text-gray-400 mt-1">ID: {String(data.id)}</p>}
        </div>
        <Button onClick={() => navigate('edit')}>Edit</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <tbody>
${rows}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}
