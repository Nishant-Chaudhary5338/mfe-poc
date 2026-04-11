import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Config() {
  useEffect(() => {
    console.log('Config route loaded');
  }, []);

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Config</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card title="Test Runner">
          Runner: Playwright | Concurrency: 4 | Timeout: 30s
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Edit</Button>
          </div>
        </Card>
        <Card title="Environments">
          Active: staging, production | Dev: disabled
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Manage</Button>
          </div>
        </Card>
        <Card title="Alerting">
          Slack alerts on failure | Email digest: daily
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Configure</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
