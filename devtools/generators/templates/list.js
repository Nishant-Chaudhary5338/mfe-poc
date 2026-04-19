import { cap } from '../utils.js';

export function genListPage({ pageName, endpoint, fields = [] }) {
  const PName = cap(pageName);
  // Human-readable title with spaces: "Article" → "Article"
  const title = PName.replace(/([A-Z])/g, ' $1').trim();
  // Singular = resource name (no suffix)
  const singular = title.trim();
  // Route prefix: resource lowercase, e.g. "article"
  const r = singular.toLowerCase();
  const cols = fields.length
    ? fields.map(f => `    { accessorKey: '${f.name}', header: '${f.label || cap(f.name)}' },`).join('\n')
    : `    { accessorKey: 'id', header: 'ID' },\n    { accessorKey: 'name', header: 'Name' },`;

  return `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Button, Alert, AlertDescription } from '@repo/shared-ui';

export default function ${PName}ListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('${endpoint}', {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') ?? '') },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load (' + r.status + ')'); return r.json(); })
      .then((d: unknown) => setData(Array.isArray(d) ? d : (d as Record<string, unknown>).data as Record<string, unknown>[] ?? (d as Record<string, unknown>).items as Record<string, unknown>[] ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
${cols}
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: Record<string, unknown> } }) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(\`/${r}/\${row.original.id}\`)}>
          View
        </Button>
      ),
    },
  ];

  if (error) return (
    <div className="p-6">
      <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">${title}</h1>
        <Button onClick={() => navigate('new')}>New ${singular}</Button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        features={{ sorting: true, globalFilter: true, pagination: true }}
        emptyMessage="No ${singular.toLowerCase()} records found."
      />
    </div>
  );
}
`;
}
