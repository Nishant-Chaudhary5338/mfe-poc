import { fieldToZod, cap } from '../utils.js';

export function genFormPage({ pageName, endpoint, method = 'POST', fields = [], color }) {
  const PName = cap(pageName);
  const zodLines = fields.map(fieldToZod).join('\n');
  const submitText = method.toUpperCase() === 'PUT' ? `Update ${PName}` : `Create ${PName}`;
  const isPut = method.toUpperCase() === 'PUT' && endpoint.includes(':id');

  if (isPut) {
    // Edit form: fetch existing record, pre-populate, replace :id in submit URL
    return `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AutoForm, Card, CardHeader, CardTitle, CardContent, Button, Skeleton, Alert, AlertDescription } from '@repo/shared-ui';

const ${PName}Schema = z.object({
${zodLines}
});

export default function ${PName}Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [defaults, setDefaults] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch('${endpoint}'.replace(':id', id ?? ''), {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') ?? '') },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load (' + r.status + ')'); return r.json(); })
      .then((d: Record<string, unknown>) => setDefaults(d))
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-2xl mx-auto p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;
  if (fetchError) return <div className="max-w-2xl mx-auto p-6"><Alert variant="destructive"><AlertDescription>{fetchError}</AlertDescription></Alert></div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">\u2190 Back</Button>
        <h1 className="text-2xl font-bold text-gray-900">${PName}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>${PName} Details</CardTitle></CardHeader>
        <CardContent>
          <AutoForm
            schema={${PName}Schema}
            defaultValues={defaults}
            onSubmit={async (values) => {
              const res = await fetch('${endpoint}'.replace(':id', id ?? ''), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('auth_token') ?? '') },
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error('Request failed (' + res.status + ')');
              navigate(-1);
            }}
            submitText="${submitText}"
          />
        </CardContent>
      </Card>
    </div>
  );
}
`;
  }

  // Create form (POST or non-id PUT)
  return `import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AutoForm, Card, CardHeader, CardTitle, CardContent, Button } from '@repo/shared-ui';

const ${PName}Schema = z.object({
${zodLines}
});

export default function ${PName}Page() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">\u2190 Back</Button>
        <h1 className="text-2xl font-bold text-gray-900">${PName}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>${PName} Details</CardTitle></CardHeader>
        <CardContent>
          <AutoForm
            schema={${PName}Schema}
            onSubmit={async (values) => {
              const res = await fetch('${endpoint}', {
                method: '${method.toUpperCase()}',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('auth_token') ?? '') },
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error('Request failed (' + res.status + ')');
              navigate(-1);
            }}
            submitText="${submitText}"
          />
        </CardContent>
      </Card>
    </div>
  );
}
`;
}
