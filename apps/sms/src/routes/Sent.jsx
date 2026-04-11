import { useEffect } from 'react';
import { Card } from '@repo/shared-ui';

export default function Sent() {
  useEffect(() => {
    console.log('Sent route loaded');
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Sent</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card title="To: Alice Johnson">
          Yes, 2pm works great. See you then!
        </Card>
        <Card title="To: Bob Martinez">
          Report looks good. Approved for distribution.
        </Card>
        <Card title="To: DevOps Team">
          Please schedule maintenance for Saturday night.
        </Card>
      </div>
    </div>
  );
}
