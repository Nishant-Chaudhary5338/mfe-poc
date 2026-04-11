import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Settings() {
  useEffect(() => {
    console.log('Settings route loaded');
  }, []);

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Settings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card title="Notifications">
          Configure when and how you receive message alerts.
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Configure</Button>
          </div>
        </Card>
        <Card title="Auto-Reply">
          Set up automatic replies for when you are unavailable.
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Configure</Button>
          </div>
        </Card>
        <Card title="Signature">
          Add a custom signature to all outgoing messages.
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Edit Signature</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
