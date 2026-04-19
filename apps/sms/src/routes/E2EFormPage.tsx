import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AutoForm, Card, CardHeader, CardTitle, CardContent, Button } from '@repo/shared-ui';

const E2EFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email(),
  active: z.boolean().optional(),
});

export default function E2EFormPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">← Back</Button>
        <h1 className="text-2xl font-bold text-gray-900">E2EForm</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>E2EForm Details</CardTitle></CardHeader>
        <CardContent>
          <AutoForm
            schema={E2EFormSchema}
            onSubmit={async (values) => {
              const res = await fetch('/api/e2eforms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('auth_token') ?? '') },
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error('Request failed (' + res.status + ')');
              navigate(-1);
            }}
            submitText="Create E2EForm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
